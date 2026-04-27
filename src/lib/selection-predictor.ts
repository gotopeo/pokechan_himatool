import type { PartyMember, PokemonData, MoveData } from '../types/pokemon'
import type { PokemonType } from '../data/type-chart'
import { getEffectivenessWithAbility } from './type-effectiveness'
import { HARDCODED_MOVES } from '../data/moves'

/**
 * 選出予測の結果
 */
export interface OpponentPrediction {
  member: PartyMember
  /** 選出率（％・パーティ合計≒300） */
  selectionRate: number
  /** 先発確率（％・パーティ合計≒100） */
  leadRate: number
  /** 総合脅威スコア（生値） */
  threatScore: number
  /** 自分パーティ各メンバーへの相性スコア */
  matchups: Array<{
    own: PartyMember
    /** ペアスコア（>1: 相手有利、<1: 自分有利） */
    pairScore: number
    offensive: number
    defensive: number
  }>
  /** 理由メモ */
  reasons: string[]
}

interface PartyAggregates {
  avgBst: number
  avgSpd: number
}

function getEffectiveData(m: PartyMember): PokemonData | null {
  if (!m.data) return null
  if (m.isMega && m.megaData) return m.megaData
  return m.data
}

function bst(p: PokemonData): number {
  return p.stats.hp + p.stats.atk + p.stats.def + p.stats.spAtk + p.stats.spDef + p.stats.spd
}

/**
 * 相手の取り得る攻撃タイプを推定する。
 * - 技が登録されていれば、変化技以外の技タイプを採用（PokéAPI由来のmovesMapを優先）
 * - そうでなければ、自身のタイプ（STAB想定）を採用
 */
function inferOffensiveTypes(
  m: PartyMember,
  data: PokemonData,
  movesMap?: Record<string, MoveData>
): PokemonType[] {
  const types: string[] = []
  for (const stored of m.moves) {
    if (!stored) continue
    // 1. movesMap[slug]
    const bySlug = movesMap?.[stored]
    if (bySlug && bySlug.category !== '変化' && bySlug.power > 0) {
      types.push(bySlug.type)
      continue
    }
    // 2. movesMap value with jaName match (legacy data)
    if (movesMap) {
      const byJa = Object.values(movesMap).find(mv =>
        mv.jaName === stored && mv.category !== '変化' && mv.power > 0
      )
      if (byJa) { types.push(byJa.type); continue }
    }
    // 3. fallback: HARDCODED_MOVES (legacy)
    const hc = HARDCODED_MOVES.find(mv => mv.name === stored)
    if (hc && hc.category !== '変化' && hc.power > 0) types.push(hc.type)
  }
  if (types.length > 0) return Array.from(new Set(types)) as PokemonType[]
  return data.types
}

/**
 * Aの攻撃 vs Bの防御 で、Aの最大弱点倍率を返す（攻めの押し付けやすさ）
 */
function maxOffensiveMultiplier(
  attacker: { types: PokemonType[]; member: PartyMember },
  defender: { data: PokemonData; ability: string }
): number {
  let max = 0
  for (const t of attacker.types) {
    const x = getEffectivenessWithAbility(t, defender.data, defender.ability)
    if (x > max) max = x
  }
  return max
}

/**
 * 相手1匹 × 自分パーティ への脅威スコアを計算
 */
function computeMatchups(
  opp: PartyMember,
  oppData: PokemonData,
  oppOffTypes: PokemonType[],
  ownParty: PartyMember[],
  movesMap?: Record<string, MoveData>
): OpponentPrediction['matchups'] {
  return ownParty.map(own => {
    const ownData = getEffectiveData(own)
    if (!ownData) {
      return { own, pairScore: 1, offensive: 1, defensive: 1 }
    }
    const ownOffTypes = inferOffensiveTypes(own, ownData, movesMap)

    // 相手→自分: 攻めの通り（相手の最大有効打）
    const offensive = maxOffensiveMultiplier(
      { types: oppOffTypes, member: opp },
      { data: ownData, ability: own.ability }
    )

    // 自分→相手: 受ける側として、自分が押し付けてくる最大有効打
    const defensive = maxOffensiveMultiplier(
      { types: ownOffTypes, member: own },
      { data: oppData, ability: opp.ability }
    )

    // ペアスコア = 攻めの通り / 受ける有効打（高いほど相手が有利）
    // 0除算回避のため最低 0.25
    const denom = Math.max(defensive, 0.25)
    const ratio = offensive === 0 ? 0.1 : offensive / denom

    // 種族値補正（HP+両防御 vs 両攻撃のミニマル比較）
    const oppOff = Math.max(oppData.stats.atk, oppData.stats.spAtk)
    const ownDef = Math.max(ownData.stats.def, ownData.stats.spDef) + ownData.stats.hp / 2
    const ownOff = Math.max(ownData.stats.atk, ownData.stats.spAtk)
    const oppDef = Math.max(oppData.stats.def, oppData.stats.spDef) + oppData.stats.hp / 2
    const statRatio = (oppOff / Math.max(ownDef, 1)) / (ownOff / Math.max(oppDef, 1))
    const statWeight = 0.4 + 0.6 * Math.min(2, Math.max(0.5, statRatio))

    // 速度補正（先制取れる側が少し有利）
    const speedDelta = oppData.stats.spd - ownData.stats.spd
    const speedWeight = 1 + Math.max(-0.2, Math.min(0.2, speedDelta / 200))

    const pairScore = ratio * statWeight * speedWeight

    return { own, pairScore, offensive, defensive }
  })
}

function rateOpponent(
  opp: PartyMember,
  oppData: PokemonData,
  oppOffTypes: PokemonType[],
  ownParty: PartyMember[],
  agg: PartyAggregates,
  movesMap?: Record<string, MoveData>
): OpponentPrediction {
  const matchups = computeMatchups(opp, oppData, oppOffTypes, ownParty, movesMap)
  const avgPair = matchups.reduce((s, m) => s + m.pairScore, 0) / Math.max(1, matchups.length)
  const oppBst = bst(oppData)
  const bstFactor = 0.7 + 0.3 * (oppBst / Math.max(450, agg.avgBst))
  const threatScore = avgPair * bstFactor

  // 理由
  const reasons: string[] = []
  if (oppBst >= 600) reasons.push(`高種族値 (合計${oppBst})`)
  if (oppData.stats.spd >= 110) reasons.push(`高速 (S${oppData.stats.spd})`)

  // 有利な相手の特定
  const favorable = [...matchups]
    .filter(m => m.pairScore >= 1.4 && m.own.data)
    .sort((a, b) => b.pairScore - a.pairScore)
    .slice(0, 2)
  for (const f of favorable) {
    reasons.push(`対 ${f.own.jaName} 有利`)
  }
  const unfavorable = [...matchups]
    .filter(m => m.pairScore <= 0.5 && m.own.data)
    .sort((a, b) => a.pairScore - b.pairScore)
    .slice(0, 1)
  for (const u of unfavorable) {
    reasons.push(`対 ${u.own.jaName} 不利`)
  }

  return {
    member: opp,
    selectionRate: 0, // 後で正規化
    leadRate: 0,      // 後で正規化
    threatScore,
    matchups,
    reasons,
  }
}

/**
 * 自分パーティ vs 相手6匹（or 1〜6匹）の選出予測を計算する
 *
 * 仕様:
 *   - 選出率: 相手の脅威スコアを正規化し合計300%（3体選出想定）
 *   - 先発率: 速度 × 脅威 を正規化し合計100%
 */
export function predictSelection(
  ownParty: PartyMember[],
  opponentParty: PartyMember[],
  movesMap?: Record<string, MoveData>
): OpponentPrediction[] {
  const validOwn = ownParty.filter(m => !!m.data)
  const validOpp = opponentParty.filter(m => !!m.data)
  if (validOpp.length === 0) return []

  const ownBsts = validOwn.map(m => bst(getEffectiveData(m)!))
  const ownSpds = validOwn.map(m => getEffectiveData(m)!.stats.spd)
  const agg: PartyAggregates = {
    avgBst: ownBsts.length ? ownBsts.reduce((s, v) => s + v, 0) / ownBsts.length : 500,
    avgSpd: ownSpds.length ? ownSpds.reduce((s, v) => s + v, 0) / ownSpds.length : 80,
  }

  const predictions = validOpp.map(opp => {
    const oppData = getEffectiveData(opp)!
    const oppOffTypes = inferOffensiveTypes(opp, oppData, movesMap)
    return rateOpponent(opp, oppData, oppOffTypes, validOwn, agg, movesMap)
  })

  // 選出率: 脅威スコアを正規化（合計300%）
  const totalThreat = predictions.reduce((s, p) => s + Math.max(0.01, p.threatScore), 0)
  const totalSelections = Math.min(3, validOpp.length) * 100
  predictions.forEach(p => {
    p.selectionRate = (Math.max(0.01, p.threatScore) / totalThreat) * totalSelections
  })

  // 先発率: 速度 × 脅威。速度は対自分平均との相対
  const leadScores = predictions.map(p => {
    const data = getEffectiveData(p.member)!
    const speedRel = data.stats.spd / Math.max(60, agg.avgSpd)
    return Math.max(0.01, speedRel * p.threatScore)
  })
  const totalLead = leadScores.reduce((s, v) => s + v, 0)
  predictions.forEach((p, i) => {
    p.leadRate = (leadScores[i] / totalLead) * 100
  })

  // 選出率の高い順にソート
  return predictions.sort((a, b) => b.selectionRate - a.selectionRate)
}

