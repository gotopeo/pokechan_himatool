import type { PartyMember, RankModifier } from '../types/pokemon'
import { NATURE_MAP } from '../data/natures'
import { calcStat } from './damage-calc'

/** 特性による素早さ補正 */
const SPEED_ABILITY_MULTIPLIERS: Record<string, number> = {
  'swiftswim':    2,   // すいすい（あめ時）
  'chlorophyll':  2,   // ようりょくそ（はれ時）
  'sandrush':     2,   // すなかき（すなあらし時）
  'slushrush':    2,   // ゆきかき（あられ時）
  'unburden':     2,   // かるわざ（アイテム消費後）
  'surgesurfer':  2,   // でんじふゆう（エレキフィールド時）
  'quickfeet':    1.5, // はやあし（状態異常時）
  'speedboost':   1,   // かそく（毎ターン+1）
}

export interface SpeedCalcInput {
  member: PartyMember
  spdEV: number
  spdRank: RankModifier
  hasParalysis: boolean          // ポケチャン仕様: まひ ×0.5
  abilityActive: boolean        // 特性が有効かどうか（天候等の条件）
  isTrickRoom: boolean
}

export interface SpeedResult {
  name: string
  jaName: string
  sprite: string
  baseStat: number
  realStat: number              // 実数値（状態・ランク・持ち物補正前）
  finalStat: number             // 全補正込み最終値
  spdEV: number
  hasParalysis: boolean
  isTrickRoom: boolean
  trickRoomOrder: number        // TR時の順位（小さいほど速い）
}

function rankMultiplier(rank: RankModifier): number {
  if (rank >= 0) return (2 + rank) / 2
  return 2 / (2 - rank)
}

export function calcSpeed(input: SpeedCalcInput): SpeedResult {
  const { member, spdEV, spdRank, hasParalysis, abilityActive } = input

  const data = member.isMega && member.megaData ? member.megaData : member.data
  if (!data) {
    return {
      name: member.pokemonName,
      jaName: member.jaName,
      sprite: '',
      baseStat: 0,
      realStat: 0,
      finalStat: 0,
      spdEV,
      hasParalysis,
      isTrickRoom: input.isTrickRoom,
      trickRoomOrder: 0,
    }
  }

  const nature = NATURE_MAP[member.nature]
  const level  = member.level

  // 実数値（ランク・持ち物・特性・状態異常前）
  const realStat = calcStat(data.stats.spd, spdEV, level, nature.multiplierS)

  // ランク補正
  let finalStat = Math.floor(realStat * rankMultiplier(spdRank))

  // 持ち物: こだわりスカーフ
  if (member.item === 'こだわりスカーフ') {
    finalStat = Math.floor(finalStat * 1.5)
  }

  // 持ち物: くろいてっきゅう
  if (member.item === 'くろいてっきゅう') {
    finalStat = Math.floor(finalStat * 0.5)
  }

  // 特性補正
  const abilityMul = SPEED_ABILITY_MULTIPLIERS[member.ability]
  if (abilityMul && abilityActive) {
    finalStat = Math.floor(finalStat * abilityMul)
  }

  // まひ: ポケチャン仕様では ×0.5（本編と同じ）
  if (hasParalysis) {
    finalStat = Math.floor(finalStat * 0.5)
  }

  return {
    name: data.name,
    jaName: data.jaName,
    sprite: data.sprite,
    baseStat: data.stats.spd,
    realStat,
    finalStat,
    spdEV,
    hasParalysis,
    isTrickRoom: input.isTrickRoom,
    trickRoomOrder: 0, // 後でソート後に付番
  }
}

/** パーティ全員の素早さを比較して順位付き一覧を返す */
export function calcSpeedComparison(
  inputs: SpeedCalcInput[]
): SpeedResult[] {
  const results = inputs.map(calcSpeed)

  // トリックルーム下: 実数値が低い順に動く
  const sorted = [...results].sort((a, b) =>
    inputs[0]?.isTrickRoom
      ? a.finalStat - b.finalStat
      : b.finalStat - a.finalStat
  )

  sorted.forEach((r, i) => {
    r.trickRoomOrder = i + 1
  })

  return results
}

/** 素早さラインを達成するために必要なEV・性格補正の逆算 */
export function reverseCalcSpeedEV(
  baseStat: number,
  targetRealStat: number,
  level: number,
  natureMul: number
): number {
  // realStat = floor(floor((base×2 + IV + floor(EV/4)) × Level/100 + 5) × nature)
  // を EV について解く（近似）
  for (let ev = 0; ev <= 252; ev += 4) {
    const real = calcStat(baseStat, ev, level, natureMul)
    if (real >= targetRealStat) return ev
  }
  return 252
}
