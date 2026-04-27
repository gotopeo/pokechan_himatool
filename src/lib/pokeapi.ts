import type { PokemonData, MoveData } from '../types/pokemon'
import type { PokemonType } from '../data/type-chart'
import { REGULATION_POKEMON, MEGA_FORMS, CHAMPIONS_EXCLUSIVE_MEGAS, DEV_SUBSET_IDS } from '../data/regulation-m-a'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const CACHE_KEY = 'pokechan_pokemon_cache_v8'
const CACHE_VERSION = 8

const USE_DEV_SUBSET = false

interface CacheData {
  version: number
  pokemon: PokemonData[]
  abilityJaNames: Record<string, string>
  moves: Record<string, MoveData>
}

const TYPE_EN_JA: Record<string, PokemonType> = {
  normal:   'ノーマル',
  fire:     'ほのお',
  water:    'みず',
  electric: 'でんき',
  grass:    'くさ',
  ice:      'こおり',
  fighting: 'かくとう',
  poison:   'どく',
  ground:   'じめん',
  flying:   'ひこう',
  psychic:  'エスパー',
  bug:      'むし',
  rock:     'いわ',
  ghost:    'ゴースト',
  dragon:   'ドラゴン',
  dark:     'あく',
  steel:    'はがね',
  fairy:    'フェアリー',
  stellar:  'ノーマル',
}

function enTypeToJa(type: string): PokemonType {
  return TYPE_EN_JA[type] ?? 'ノーマル'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePokemonData(poke: any, species: any): PokemonData {
  const types: PokemonType[] = poke.types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.slot - b.slot)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any) => enTypeToJa(t.type.name))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statMap: Record<string, number> = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    poke.stats.map((s: any) => [s.stat.name, s.base_stat])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jaNameEntry = species?.names?.find((n: any) => n.language.name === 'ja-hrkt')
  const jaName: string = jaNameEntry?.name ?? poke.name

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const abilities = poke.abilities.map((a: any) => ({
    name: a.ability.name,
    isHidden: a.is_hidden,
    slot: a.slot,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const movePool: string[] = (poke.moves ?? []).map((m: any) => m.move.name)

  const megaKeywords = ['-mega', '-mega-x', '-mega-y']
  const isMegaForm = megaKeywords.some(suffix => poke.name.endsWith(suffix))

  let displayName = jaName
  if (isMegaForm) {
    if (poke.name.endsWith('-mega-x')) displayName = `メガ${jaName}(X)`
    else if (poke.name.endsWith('-mega-y')) displayName = `メガ${jaName}(Y)`
    else displayName = `メガ${jaName}`
  }

  return {
    id:        poke.id,
    name:      poke.name,
    jaName:    displayName,
    types,
    stats: {
      hp:    statMap['hp']              ?? 0,
      atk:   statMap['attack']          ?? 0,
      def:   statMap['defense']         ?? 0,
      spAtk: statMap['special-attack']  ?? 0,
      spDef: statMap['special-defense'] ?? 0,
      spd:   statMap['speed']           ?? 0,
    },
    abilities,
    sprite:  poke.sprites?.front_default ?? '',
    weight:  poke.weight ?? 0,
    megaOf:  isMegaForm ? (species?.name ?? poke.name.split('-')[0]) : undefined,
    movePool,
  }
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status === 404) throw new Error('404')
    } catch (e) {
      if (String(e).includes('404')) throw e
      if (i < retries - 1) await new Promise(r => setTimeout(r, 400 * (i + 1)))
      else throw e
    }
  }
  throw new Error(`Failed: ${url}`)
}

/** 1匹分のポケモンデータを取得（失敗時null） */
async function fetchOnePokemon(nameOrId: string | number): Promise<PokemonData | null> {
  try {
    const pokeRes = await fetchWithRetry(`${POKEAPI_BASE}/pokemon/${nameOrId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poke: any = await pokeRes.json()

    const speciesName: string = poke.species?.name ?? String(nameOrId).split('-')[0]
    let species = null
    try {
      const speciesRes = await fetchWithRetry(`${POKEAPI_BASE}/pokemon-species/${speciesName}`)
      species = await speciesRes.json()
    } catch {
      // speciesが取れなくても続行（日本語名はnameで代用）
    }

    return parsePokemonData(poke, species)
  } catch {
    return null
  }
}

/** バッチフェッチ: BATCH件ずつ並列、DELAYms間隔 */
async function fetchBatch(
  targets: (string | number)[],
  onProgress?: (loaded: number, total: number) => void
): Promise<PokemonData[]> {
  const BATCH = 5
  const DELAY = 120
  const results: PokemonData[] = []

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH)
    const fetched = await Promise.all(batch.map(t => fetchOnePokemon(t)))
    fetched.forEach(p => { if (p) results.push(p) })
    onProgress?.(Math.min(i + BATCH, targets.length), targets.length)
    if (i + BATCH < targets.length) {
      await new Promise(r => setTimeout(r, DELAY))
    }
  }

  return results
}

/** 1特性の日本語名を取得（失敗時はnull） */
async function fetchAbilityJaName(slug: string): Promise<string | null> {
  try {
    const res = await fetchWithRetry(`${POKEAPI_BASE}/ability/${slug}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = data?.names?.find((n: any) =>
      n.language.name === 'ja-hrkt' || n.language.name === 'ja-Hrkt' || n.language.name === 'ja'
    )
    return entry?.name ?? null
  } catch {
    return null
  }
}

const MOVE_CATEGORY_EN_JA: Record<string, '物理' | '特殊' | '変化'> = {
  physical: '物理',
  special:  '特殊',
  status:   '変化',
}

/** 1技分の日本語名・タイプ・威力等を取得（失敗時null） */
async function fetchMoveData(slug: string): Promise<MoveData | null> {
  try {
    const res = await fetchWithRetry(`${POKEAPI_BASE}/move/${slug}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nameEntry = data?.names?.find((n: any) =>
      n.language.name === 'ja-hrkt' || n.language.name === 'ja-Hrkt' || n.language.name === 'ja'
    )
    const jaName: string = nameEntry?.name ?? slug
    return {
      slug,
      jaName,
      type: enTypeToJa(data?.type?.name ?? 'normal'),
      category: MOVE_CATEGORY_EN_JA[data?.damage_class?.name ?? 'status'] ?? '変化',
      power: data?.power ?? 0,
      accuracy: data?.accuracy ?? 0,
    }
  } catch {
    return null
  }
}

/** 全技スラッグの技データを並列取得 */
async function fetchAllMoveData(
  slugs: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Record<string, MoveData>> {
  const BATCH = 10
  const DELAY = 80
  const map: Record<string, MoveData> = {}

  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH)
    const fetched = await Promise.all(batch.map(s => fetchMoveData(s)))
    fetched.forEach(m => { if (m) map[m.slug] = m })
    onProgress?.(Math.min(i + BATCH, slugs.length), slugs.length)
    if (i + BATCH < slugs.length) {
      await new Promise(r => setTimeout(r, DELAY))
    }
  }

  return map
}

/** 全特性スラッグの日本語名マップを並列取得 */
async function fetchAbilityJaMap(
  slugs: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Record<string, string>> {
  const BATCH = 8
  const DELAY = 100
  const map: Record<string, string> = {}

  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH)
    const fetched = await Promise.all(batch.map(s => fetchAbilityJaName(s).then(name => [s, name] as const)))
    for (const [slug, name] of fetched) {
      if (name) map[slug] = name
    }
    onProgress?.(Math.min(i + BATCH, slugs.length), slugs.length)
    if (i + BATCH < slugs.length) {
      await new Promise(r => setTimeout(r, DELAY))
    }
  }

  return map
}

/** ポケチャン独自メガ進化をベース形態のデータで生成 */
function createExclusiveMegas(allPokemon: PokemonData[]): PokemonData[] {
  const byName = new Map(allPokemon.map(p => [p.name, p]))
  return CHAMPIONS_EXCLUSIVE_MEGAS.flatMap(({ slug, jaName, base }) => {
    const basePoke = byName.get(base)
    if (!basePoke) return []
    return [{ ...basePoke, name: slug, jaName, megaOf: base }]
  })
}

/** 全ポケモン＋特性日本語マップ＋技データを取得 */
async function fetchAllPokemon(
  onProgress?: (loaded: number, total: number) => void
): Promise<{
  pokemon: PokemonData[]
  abilityJaNames: Record<string, string>
  moves: Record<string, MoveData>
}> {
  const normalTargets: (string | number)[] = USE_DEV_SUBSET
    ? DEV_SUBSET_IDS
    : REGULATION_POKEMON

  // 進捗：ポケモン+特性+技 を合算（技は推定800）
  const pokemonTotal = normalTargets.length + MEGA_FORMS.length
  const estimatedAbilityTotal = 200
  const estimatedMoveTotal = 800
  const grandTotal = pokemonTotal + estimatedAbilityTotal + estimatedMoveTotal

  const normalPokemon = await fetchBatch(normalTargets, (loaded) => {
    onProgress?.(loaded, grandTotal)
  })

  const megaPokemon = await fetchBatch(MEGA_FORMS, (loaded) => {
    onProgress?.(normalTargets.length + loaded, grandTotal)
  })

  const exclusiveMegas = createExclusiveMegas([...normalPokemon, ...megaPokemon])
  const allPokemon = [...normalPokemon, ...megaPokemon, ...exclusiveMegas]

  // 特性スラッグを集めて並列取得
  const abilitySlugSet = new Set<string>()
  for (const p of allPokemon) {
    for (const a of p.abilities) abilitySlugSet.add(a.name)
  }
  const abilitySlugs = Array.from(abilitySlugSet)
  const abilityJaNames = await fetchAbilityJaMap(abilitySlugs, (loaded) => {
    onProgress?.(pokemonTotal + Math.round((loaded / abilitySlugs.length) * estimatedAbilityTotal), grandTotal)
  })

  // 技スラッグを集めて並列取得
  const moveSlugSet = new Set<string>()
  for (const p of allPokemon) {
    for (const slug of p.movePool ?? []) moveSlugSet.add(slug)
  }
  const moveSlugs = Array.from(moveSlugSet)
  const moves = await fetchAllMoveData(moveSlugs, (loaded) => {
    onProgress?.(
      pokemonTotal + estimatedAbilityTotal + Math.round((loaded / moveSlugs.length) * estimatedMoveTotal),
      grandTotal
    )
  })

  onProgress?.(grandTotal, grandTotal)

  return { pokemon: allPokemon, abilityJaNames, moves }
}

interface LoadResult {
  pokemon: PokemonData[]
  abilityJaNames: Record<string, string>
  moves: Record<string, MoveData>
}

function loadCache(): LoadResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: CacheData = JSON.parse(raw)
    if (cache.version !== CACHE_VERSION) return null
    return {
      pokemon: cache.pokemon,
      abilityJaNames: cache.abilityJaNames ?? {},
      moves: cache.moves ?? {},
    }
  } catch {
    return null
  }
}

function saveCache(result: LoadResult): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      pokemon: result.pokemon,
      abilityJaNames: result.abilityJaNames,
      moves: result.moves,
    }))
  } catch {
    // quota超過など無視
  }
}

export function clearPokemonCache(): void {
  for (let v = 1; v <= 8; v++) {
    localStorage.removeItem(`pokechan_pokemon_cache_v${v}`)
  }
}

export async function loadAllPokemon(
  onProgress?: (loaded: number, total: number) => void
): Promise<LoadResult> {
  const cached = loadCache()
  if (cached && cached.pokemon.length > 0) {
    onProgress?.(cached.pokemon.length, cached.pokemon.length)
    return cached
  }

  const result = await fetchAllPokemon(onProgress)
  saveCache(result)
  return result
}

export function searchPokemon(pokemon: PokemonData[], query: string): PokemonData[] {
  const q = query.toLowerCase().trim()
  if (!q) return pokemon
  return pokemon.filter(p =>
    p.jaName.includes(q) ||
    p.name.includes(q) ||
    String(p.id) === q
  )
}
