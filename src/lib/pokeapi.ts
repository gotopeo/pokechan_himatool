import type { PokemonData } from '../types/pokemon'
import type { PokemonType } from '../data/type-chart'
import { REGULATION_POKEMON, MEGA_FORMS, CHAMPIONS_EXCLUSIVE_MEGAS, DEV_SUBSET_IDS } from '../data/regulation-m-a'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const CACHE_KEY = 'pokechan_pokemon_cache_v6'
const CACHE_VERSION = 6

const USE_DEV_SUBSET = false

interface CacheData {
  version: number
  pokemon: PokemonData[]
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

/** ポケチャン独自メガ進化をベース形態のデータで生成 */
function createExclusiveMegas(allPokemon: PokemonData[]): PokemonData[] {
  const byName = new Map(allPokemon.map(p => [p.name, p]))
  return CHAMPIONS_EXCLUSIVE_MEGAS.flatMap(({ slug, jaName, base }) => {
    const basePoke = byName.get(base)
    if (!basePoke) return []
    return [{ ...basePoke, name: slug, jaName, megaOf: base }]
  })
}

/** 全ポケモンを取得 */
async function fetchAllPokemon(
  onProgress?: (loaded: number, total: number) => void
): Promise<PokemonData[]> {
  const normalTargets: (string | number)[] = USE_DEV_SUBSET
    ? DEV_SUBSET_IDS
    : REGULATION_POKEMON

  const total = normalTargets.length + MEGA_FORMS.length

  // 通常ポケモン取得
  const normalPokemon = await fetchBatch(normalTargets, (loaded) => {
    onProgress?.(loaded, total)
  })

  // メガ進化取得
  const megaPokemon = await fetchBatch(MEGA_FORMS, (loaded) => {
    onProgress?.(normalTargets.length + loaded, total)
  })

  const exclusiveMegas = createExclusiveMegas([...normalPokemon, ...megaPokemon])

  return [...normalPokemon, ...megaPokemon, ...exclusiveMegas]
}

function loadCache(): PokemonData[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: CacheData = JSON.parse(raw)
    if (cache.version !== CACHE_VERSION) return null
    return cache.pokemon
  } catch {
    return null
  }
}

function saveCache(pokemon: PokemonData[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, pokemon }))
  } catch {
    // quota超過など無視
  }
}

export function clearPokemonCache(): void {
  // 旧バージョンのキャッシュも削除
  for (let v = 1; v <= 6; v++) {
    localStorage.removeItem(`pokechan_pokemon_cache_v${v}`)
  }
}

export async function loadAllPokemon(
  onProgress?: (loaded: number, total: number) => void
): Promise<PokemonData[]> {
  const cached = loadCache()
  if (cached && cached.length > 0) {
    onProgress?.(cached.length, cached.length)
    return cached
  }

  const pokemon = await fetchAllPokemon(onProgress)
  saveCache(pokemon)
  return pokemon
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
