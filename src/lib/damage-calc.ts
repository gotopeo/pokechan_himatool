import type { DamageInput, DamageResult, RankModifier } from '../types/pokemon'
import type { PokemonData, BaseStats } from '../types/pokemon'
import type { PokemonType } from '../data/type-chart'
import { getDefensiveMatchup } from '../data/type-chart'
import { NATURE_MAP } from '../data/natures'
import { MOVE_MAP } from '../data/moves'

const IV = 31 // ポケチャン仕様: 個体値概念なし（基準値として31扱い）

/**
 * ステータス実数値計算（ポケチャン新ルール: 1ポイント=+1実数値、線形）
 *
 * - 配分上限: 各ステ32ポイント、合計66ポイント
 * - 性格補正は基礎値部分にのみ乗算（その後に努力値ポイントを加算）
 * - 個体値はゲーム上廃止だが、内部基準値として31を採用
 */
export function calcStat(
  base: number,
  ev: number,
  level: number,
  natureMul: number,
  isHp = false
): number {
  if (isHp) {
    // HP = floor((種族値×2 + IV) × Level/100 + Level + 10) + EV
    return Math.floor((base * 2 + IV) * level / 100 + level + 10) + ev
  }
  // 他 = floor(floor((種族値×2 + IV) × Level/100 + 5) × 性格補正) + EV
  return Math.floor(
    Math.floor((base * 2 + IV) * level / 100 + 5) * natureMul
  ) + ev
}

/** ランク補正の倍率 */
function rankMultiplier(rank: RankModifier): number {
  if (rank >= 0) return (2 + rank) / 2
  return 2 / (2 - rank)
}

/** タイプ一致補正 */
function stabMultiplier(moveType: PokemonType, pokemonTypes: PokemonType[]): number {
  return pokemonTypes.includes(moveType) ? 1.5 : 1
}

/** 持ち物によるタイプ技威力補正 */
const TYPE_ITEMS: Record<string, PokemonType> = {
  'もくたん':         'ほのお',
  'しんぴのしずく':   'みず',
  'じしゃく':         'でんき',
  'きせきのタネ':     'くさ',
  'とけないこおり':   'こおり',
  'くろおび':         'かくとう',
  'どくバリ':         'どく',
  'やわらかいすな':   'じめん',
  'するどいくちばし': 'ひこう',
  'ねじれスプーン':   'エスパー',
  'ぎんのこな':       'むし',
  'かたいいし':       'いわ',
  'のろいのおふだ':   'ゴースト',
  'りゅうのキバ':     'ドラゴン',
  'くろいメガネ':     'あく',
  'メタルコート':     'はがね',
  'ようせいのはね':   'フェアリー',
}

/** 持ち物補正 */
function itemMultiplier(item: string, moveType: PokemonType, moveCategory: string): number {
  if (item === 'ライフオーブ') return 1.3
  if (item === 'こだわりハチマキ' && moveCategory === '物理') return 1.5
  if (item === 'こだわりメガネ' && moveCategory === '特殊') return 1.5

  const itemType = TYPE_ITEMS[item]
  if (itemType && itemType === moveType) return 1.2

  return 1
}

/** 天候補正 */
function weatherMultiplier(weather: string, moveType: PokemonType): number {
  if (weather === 'はれ') {
    if (moveType === 'ほのお') return 1.5
    if (moveType === 'みず')   return 0.5
  }
  if (weather === 'あめ') {
    if (moveType === 'みず')   return 1.5
    if (moveType === 'ほのお') return 0.5
  }
  return 1
}

/** フィールド補正 */
function fieldMultiplier(field: string, moveType: PokemonType, attackerIsGrounded: boolean): number {
  if (!attackerIsGrounded) return 1
  if (field === 'エレキフィールド' && moveType === 'でんき')   return 1.3
  if (field === 'グラスフィールド' && moveType === 'くさ')     return 1.3
  if (field === 'サイコフィールド' && moveType === 'エスパー') return 1.3
  if (field === 'ミストフィールド' && moveType === 'ドラゴン') return 0.5
  return 1
}

/** 壁補正 */
function wallMultiplier(wallActive: boolean, _category: string, isCrit: boolean): number {
  if (!wallActive || isCrit) return 1
  return 0.5
}

/** 急所補正 */
function critMultiplier(isCrit: boolean): number {
  return isCrit ? 1.5 : 1
}

/** 相性無効チェック（簡易版） */
function isImmune(
  moveType: PokemonType,
  defTypes: PokemonType[],
  defAbility: string
): boolean {
  const [t1, t2] = defTypes
  const base = getDefensiveMatchup(moveType, t1, t2)
  if (base === 0) return true
  if (moveType === 'じめん' && defAbility === 'levitate') return true
  if (moveType === 'みず'   && (defAbility === 'waterabsorb' || defAbility === 'stormdrain')) return true
  if (moveType === 'でんき' && (defAbility === 'voltabsorb' || defAbility === 'lightningrod')) return true
  if (moveType === 'くさ'   && defAbility === 'sapsipper') return true
  if (moveType === 'ほのお' && defAbility === 'flashfire') return true
  return false
}

/** ダメージ計算のコア（本編準拠）
 *  乱数 85/100〜100/100 の16通りを返す
 */
export function calcDamage(input: DamageInput): DamageResult {
  const {
    attacker, defender, moveName,
    atkRank, defRank, spAtkRank, spDefRank,
    weather, field, wallActive, isCrit,
    defenderHpRatio, attackerIsMega,
  } = input

  const atkData: PokemonData | undefined =
    attackerIsMega && attacker.megaData ? attacker.megaData : attacker.data
  const defData: PokemonData | undefined = defender.data

  if (!atkData || !defData) {
    return emptyResult()
  }

  // 新経路: moveData が渡されればそれを使う / 旧経路: MOVE_MAPからjaNameで引く
  const moveLike = input.moveData
    ? {
        name: input.moveData.jaName,
        type: input.moveData.type as PokemonType,
        category: input.moveData.category,
        power: input.moveData.power,
        accuracy: input.moveData.accuracy,
      }
    : MOVE_MAP[moveName]
  const move = moveLike
  if (!move || move.category === '変化' || move.power === 0) {
    return emptyResult()
  }

  const atkNature = NATURE_MAP[attacker.nature]
  const defNature = NATURE_MAP[defender.nature]

  const atkLevel  = attacker.level
  const defLevel  = defender.level

  // 攻撃・防御実数値
  let atkStat: number
  let defStat: number

  if (move.category === '物理') {
    atkStat = calcStat(
      atkData.stats.atk, attacker.evs.atk, atkLevel, atkNature.multiplierA
    )
    defStat = calcStat(
      defData.stats.def, defender.evs.def, defLevel, defNature.multiplierB
    )
    atkStat = Math.floor(atkStat * rankMultiplier(atkRank))
    defStat = Math.floor(defStat * rankMultiplier(defRank))
  } else {
    atkStat = calcStat(
      atkData.stats.spAtk, attacker.evs.spAtk, atkLevel, atkNature.multiplierC
    )
    defStat = calcStat(
      defData.stats.spDef, defender.evs.spDef, defLevel, defNature.multiplierD
    )
    atkStat = Math.floor(atkStat * rankMultiplier(spAtkRank))
    defStat = Math.floor(defStat * rankMultiplier(spDefRank))
  }

  // 急所時はランク悪化を無視（最高値を使う）
  if (isCrit) {
    if (move.category === '物理') {
      const baseAtk = calcStat(atkData.stats.atk, attacker.evs.atk, atkLevel, atkNature.multiplierA)
      const baseDef = calcStat(defData.stats.def, defender.evs.def, defLevel, defNature.multiplierB)
      atkStat = Math.max(atkStat, baseAtk)
      defStat = Math.min(defStat, baseDef)
    } else {
      const baseSpAtk = calcStat(atkData.stats.spAtk, attacker.evs.spAtk, atkLevel, atkNature.multiplierC)
      const baseSpDef = calcStat(defData.stats.spDef, defender.evs.spDef, defLevel, defNature.multiplierD)
      atkStat = Math.max(atkStat, baseSpAtk)
      defStat = Math.min(defStat, baseSpDef)
    }
  }

  // HP実数値
  const defMaxHp = calcStat(defData.stats.hp, defender.evs.hp, defLevel, 1, true)
  const defCurrentHp = Math.max(1, Math.floor(defMaxHp * defenderHpRatio))

  // タイプ相性
  const moveType = move.type
  const [dt1, dt2] = defData.types
  const typeMul = getDefensiveMatchup(moveType, dt1, dt2)

  // 無効チェック
  if (isImmune(moveType, defData.types, defender.ability)) {
    return emptyResult()
  }

  // STAB
  const stab = stabMultiplier(moveType, atkData.types)

  // 持ち物補正
  const atkItem  = itemMultiplier(attacker.item, moveType, move.category)
  const defItem  = 1 // 防御側の持ち物軽減は簡易版では省略

  // 天候・フィールド
  const weatherMul = weatherMultiplier(weather, moveType)
  const fieldMul   = fieldMultiplier(field, moveType, true)
  const wallMul    = wallMultiplier(wallActive, move.category, isCrit)
  const critMul    = critMultiplier(isCrit)

  // 基本威力
  const basePower = move.power

  // ダメージ計算式（本編準拠）:
  // floor(floor(floor(floor(Level×2/5+2) × BasePower × Atk/Def / 50 + 2)
  //   × Weather × GBA × Crit × Random × STAB × TypeMul × Item × ...)
  const base = Math.floor(
    Math.floor(
      Math.floor(Math.floor(atkLevel * 2 / 5 + 2) * basePower * atkStat / defStat / 50 + 2)
      * critMul
    ) * weatherMul
  )

  // 乱数16通り: 85/100 から 100/100 まで
  const rolls = Array.from({ length: 16 }, (_, i) => {
    const rand = (85 + i) / 100
    return Math.floor(
      Math.floor(
        Math.floor(
          Math.floor(base * rand)
          * stab
        ) * typeMul
      ) * atkItem * defItem * wallMul * fieldMul
    )
  })

  const minDamage = Math.min(...rolls)
  const maxDamage = Math.max(...rolls)
  const averageDamage = Math.round(rolls.reduce((a, b) => a + b, 0) / rolls.length)

  const minPercent    = Math.round(minDamage    / defCurrentHp * 1000) / 10
  const maxPercent    = Math.round(maxDamage    / defCurrentHp * 1000) / 10
  const averagePercent= Math.round(averageDamage / defCurrentHp * 1000) / 10

  // 確定数計算（最大ダメージで）
  const koChanceRaw = rolls.filter(r => r >= defCurrentHp).length / rolls.length * 100
  const koChance = Math.round(koChanceRaw * 10) / 10

  const koDescription = describeKO(rolls, defCurrentHp, defMaxHp)

  return {
    rolls,
    minDamage,
    maxDamage,
    averageDamage,
    minPercent,
    maxPercent,
    averagePercent,
    koChance,
    koDescription,
    defenderMaxHp: defMaxHp,
  }
}

function describeKO(rolls: number[], currentHp: number, _maxHp: number): string {
  const minDmg = Math.min(...rolls)
  const maxDmg = Math.max(...rolls)

  // 確定1発
  if (minDmg >= currentHp) return '確定1発'

  // 乱数1発
  const oneHitChance = rolls.filter(r => r >= currentHp).length / rolls.length * 100
  if (oneHitChance > 0) return `乱数1発 (${Math.round(oneHitChance)}%)`

  // N発KO判定（最大ダメージ基準で倒せる発数）
  for (let n = 2; n <= 10; n++) {
    if (maxDmg * n >= currentHp) {
      // 全乱数でn発以内か確認
      if (minDmg * n >= currentHp) {
        return `確定${n}発`
      } else {
        // 乱数でN発になる確率の近似（簡略化）
        return `乱数${n}発`
      }
    }
  }

  return '確定耐え'
}

function emptyResult(): DamageResult {
  return {
    rolls: Array(16).fill(0),
    minDamage: 0,
    maxDamage: 0,
    averageDamage: 0,
    minPercent: 0,
    maxPercent: 0,
    averagePercent: 0,
    koChance: 0,
    koDescription: '計算不可',
    defenderMaxHp: 0,
  }
}

/** HPの実数値のみを返すユーティリティ */
export function calcHP(stats: BaseStats, ev: number, level: number): number {
  return calcStat(stats.hp, ev, level, 1, true)
}
