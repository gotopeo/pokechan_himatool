import type { PartyMember, PokemonData, MoveData } from '../types/pokemon'
import type { PokemonType } from '../data/type-chart'
import { getEffectivenessWithAbility } from './type-effectiveness'
import { calcDamage } from './damage-calc'
import { HARDCODED_MOVES } from '../data/moves'

/* ===========================================================
 * 役割タグ
 * =========================================================== */
export type OppRole =
  | 'fast-attacker'
  | 'setup-sweeper'
  | 'screen-setter'
  | 'hazard-setter'
  | 'wall'
  | 'balanced'

const ROLE_LABEL: Record<OppRole, string> = {
  'fast-attacker': '高速アタッカー',
  'setup-sweeper': '積みスイーパー',
  'screen-setter': '壁張り',
  'hazard-setter': '撒き役',
  'wall':          '受け',
  'balanced':      'バランス',
}
export function roleLabel(r: OppRole): string { return ROLE_LABEL[r] }

const SETUP_MOVES = new Set(['つるぎのまい', 'りゅうのまい', 'ちょうのまい', 'めいそう', 'ロックカット', 'コットンガード', 'ビルドアップ', 'のろい', 'ドわすれ', 'てっぺき', 'バリアー'])
const SCREEN_MOVES = new Set(['リフレクター', 'ひかりのかべ', 'オーロラベール'])
const HAZARD_MOVES = new Set(['ステルスロック', 'まきびし', 'どくびし', 'ねばねばネット'])

/* ===========================================================
 * 結果型
 * =========================================================== */
export interface OpponentPrediction {
  member: PartyMember
  /** 選出率（％・パーティ合計≒300） */
  selectionRate: number
  /** 先発確率（％・パーティ合計≒100） */
  leadRate: number
  /** 総合脅威スコア（生値） */
  threatScore: number
  /** 推定役割 */
  role: OppRole
  /** 自分パーティ各メンバーへの相性 */
  matchups: Array<{
    own: PartyMember
    /** ペアスコア（>1: 相手有利、<1: 自分有利） */
    pairScore: number
    /** 相手→自分の最大ダメ% */
    offensivePercent: number
    /** 自分→相手の最大ダメ% */
    defensivePercent: number
    /** 相手→自分の最有効技名（ja） */
    bestMoveJa?: string
  }>
  /** 理由メモ */
  reasons: string[]
}

/** 推奨選出（3体構成） */
export interface RecommendedPick {
  members: PartyMember[]
  totalThreat: number
  reason: string
}

interface PartyAggregates {
  avgBst: number
  avgSpd: number
}

/* ===========================================================
 * ヘルパー
 * =========================================================== */
function getEffectiveData(m: PartyMember): PokemonData | null {
  if (!m.data) return null
  if (m.isMega && m.megaData) return m.megaData
  return m.data
}

function bst(p: PokemonData): number {
  return p.stats.hp + p.stats.atk + p.stats.def + p.stats.spAtk + p.stats.spDef + p.stats.spd
}

function moveJaName(stored: string, movesMap?: Record<string, MoveData>): string {
  if (!stored) return ''
  if (movesMap?.[stored]) return movesMap[stored].jaName
  return stored
}

/**
 * 攻撃側の覚える技から、最大ダメージ%を出す技を選んで返す。
 * 1. 登録された技を優先 → 2. 無ければ全movePoolから推定（攻撃技かつ威力>0）
 */
function pickBestMoveAndDamage(
  attacker: PartyMember,
  defender: PartyMember,
  movesMap: Record<string, MoveData>
): { moveData: MoveData; percent: number } | null {
  if (!attacker.data || !defender.data) return null

  const candidates: MoveData[] = []
  // 登録技
  for (const stored of attacker.moves) {
    if (!stored) continue
    let md: MoveData | undefined = movesMap[stored]
    if (!md) md = Object.values(movesMap).find(m => m.jaName === stored)
    if (md && md.category !== '変化' && md.power > 0) candidates.push(md)
  }
  // フォールバック: movePool 全体（多すぎるので威力>=60で絞り、上位30まで）
  if (candidates.length === 0 && attacker.data.movePool) {
    const pool = attacker.data.movePool
      .map(slug => movesMap[slug])
      .filter((m): m is MoveData => !!m && m.category !== '変化' && m.power >= 60)
      .sort((a, b) => b.power - a.power)
      .slice(0, 30)
    candidates.push(...pool)
  }

  if (candidates.length === 0) return null

  let best: { moveData: MoveData; percent: number } | null = null
  for (const md of candidates) {
    try {
      const r = calcDamage({
        attacker, defender,
        moveName: md.jaName,
        moveData: md,
        atkRank: 0, defRank: 0, spAtkRank: 0, spDefRank: 0,
        weather: 'なし', field: 'なし',
        wallActive: false, isCrit: false,
        defenderHpRatio: 1,
        attackerIsMega: !!(attacker.isMega && attacker.megaData),
      })
      if (r.maxPercent > 0 && (!best || r.maxPercent > best.percent)) {
        best = { moveData: md, percent: r.maxPercent }
      }
    } catch { /* skip move */ }
  }
  return best
}

/**
 * ダメージ%をスコアtierに変換
 * - 確1（>=100%）→ 1.0
 * - 乱数1高（>=87.5%）→ 0.85
 * - 確2（>=50%）→ 0.65
 * - 乱数2（>=35%）→ 0.45
 * - 確3（>=25%）→ 0.30
 * - それ以下 → 0.10〜0.18
 */
function damageTier(percent: number): number {
  if (percent >= 100) return 1.0
  if (percent >= 87.5) return 0.85
  if (percent >= 50)  return 0.65
  if (percent >= 35)  return 0.45
  if (percent >= 25)  return 0.30
  if (percent >= 15)  return 0.18
  return 0.10
}

/**
 * 相手の取り得る攻撃タイプを推定
 */
function inferOffensiveTypes(
  m: PartyMember,
  data: PokemonData,
  movesMap?: Record<string, MoveData>
): PokemonType[] {
  const types: string[] = []
  for (const stored of m.moves) {
    if (!stored) continue
    const bySlug = movesMap?.[stored]
    if (bySlug && bySlug.category !== '変化' && bySlug.power > 0) {
      types.push(bySlug.type); continue
    }
    if (movesMap) {
      const byJa = Object.values(movesMap).find(mv =>
        mv.jaName === stored && mv.category !== '変化' && mv.power > 0
      )
      if (byJa) { types.push(byJa.type); continue }
    }
    const hc = HARDCODED_MOVES.find(mv => mv.name === stored)
    if (hc && hc.category !== '変化' && hc.power > 0) types.push(hc.type)
  }
  if (types.length > 0) return Array.from(new Set(types)) as PokemonType[]
  return data.types
}

/**
 * 役割推定
 */
function inferRole(
  m: PartyMember,
  data: PokemonData,
  movesMap?: Record<string, MoveData>
): OppRole {
  const moveJaSet = m.moves.map(s => moveJaName(s, movesMap))
  if (moveJaSet.some(j => SCREEN_MOVES.has(j))) return 'screen-setter'
  if (moveJaSet.some(j => HAZARD_MOVES.has(j))) return 'hazard-setter'
  if (moveJaSet.some(j => SETUP_MOVES.has(j))) return 'setup-sweeper'
  const maxOff = Math.max(data.stats.atk, data.stats.spAtk)
  if (data.stats.spd >= 110 && maxOff >= 105) return 'fast-attacker'
  const bulk = data.stats.hp + data.stats.def + data.stats.spDef
  if (bulk >= 350 && data.stats.spd <= 75) return 'wall'
  return 'balanced'
}

function leadFactor(role: OppRole): number {
  switch (role) {
    case 'fast-attacker': return 1.5
    case 'screen-setter': return 1.7
    case 'hazard-setter': return 1.5
    case 'setup-sweeper': return 1.2
    case 'wall':          return 0.5
    case 'balanced':      return 1.0
  }
}

/* ===========================================================
 * マッチアップ（ダメ計版）
 * =========================================================== */
function computeMatchups(
  opp: PartyMember,
  ownParty: PartyMember[],
  movesMap: Record<string, MoveData>
): OpponentPrediction['matchups'] {
  return ownParty.map(own => {
    const ownData = getEffectiveData(own)
    if (!ownData) {
      return { own, pairScore: 1, offensivePercent: 0, defensivePercent: 0 }
    }
    const oppToOwn = pickBestMoveAndDamage(opp, own, movesMap)
    const ownToOpp = pickBestMoveAndDamage(own, opp, movesMap)

    const offPct = oppToOwn?.percent ?? 0
    const defPct = ownToOpp?.percent ?? 0

    const offT = damageTier(offPct)
    const defT = damageTier(defPct)
    const ratio = offT / Math.max(0.10, defT)

    // 速度補正
    const oppData = getEffectiveData(opp)!
    const oppSpd = oppData.stats.spd * (opp.item === 'こだわりスカーフ' ? 1.5 : 1)
    const ownSpd = ownData.stats.spd * (own.item === 'こだわりスカーフ' ? 1.5 : 1)
    let speedW = 1
    if (oppSpd > ownSpd) speedW = 1.18
    else if (oppSpd === ownSpd) speedW = 1.0
    else speedW = 0.90

    // ノックアウトボーナス（先制で確1なら大幅加点）
    let koBonus = 1
    if (oppSpd > ownSpd && offPct >= 100) koBonus = 1.4
    else if (oppSpd > ownSpd && offPct >= 87.5) koBonus = 1.2

    const pairScore = ratio * speedW * koBonus

    return {
      own,
      pairScore,
      offensivePercent: offPct,
      defensivePercent: defPct,
      bestMoveJa: oppToOwn?.moveData.jaName,
    }
  })
}

/* ===========================================================
 * 相手1匹のスコアリング
 * =========================================================== */
function rateOpponent(
  opp: PartyMember,
  oppData: PokemonData,
  ownParty: PartyMember[],
  agg: PartyAggregates,
  movesMap: Record<string, MoveData>,
  oppOffTypes: PokemonType[],
): OpponentPrediction {
  const matchups = computeMatchups(opp, ownParty, movesMap)
  const avgPair = matchups.reduce((s, m) => s + m.pairScore, 0) / Math.max(1, matchups.length)
  const oppBst = bst(oppData)
  const bstFactor = 0.7 + 0.3 * (oppBst / Math.max(450, agg.avgBst))

  // 自パーティのタイプ穴ボーナス：相手の有効打タイプを誰も半減できないと加点
  let holeBonus = 1
  for (const type of oppOffTypes) {
    const resisters = ownParty.filter(o => {
      const od = getEffectiveData(o)
      if (!od) return false
      const eff = getEffectivenessWithAbility(type, od, o.ability)
      return eff <= 0.5
    })
    if (resisters.length === 0) holeBonus *= 1.45
    else if (resisters.length === 1) holeBonus *= 1.10
  }
  // 行き過ぎ防止
  holeBonus = Math.min(holeBonus, 2.5)

  const role = inferRole(opp, oppData, movesMap)
  const threatScore = avgPair * bstFactor * holeBonus

  // 理由
  const reasons: string[] = []
  reasons.push(roleLabel(role))
  if (oppBst >= 600) reasons.push(`高種族値 (合計${oppBst})`)
  if (oppData.stats.spd >= 110) reasons.push(`高速 (S${oppData.stats.spd})`)
  if (holeBonus >= 1.4) reasons.push('一貫タイプあり')

  const favorable = [...matchups]
    .filter(m => m.pairScore >= 1.4 && m.own.data)
    .sort((a, b) => b.pairScore - a.pairScore)
    .slice(0, 2)
  for (const f of favorable) reasons.push(`対 ${f.own.jaName} 有利`)
  const unfavorable = [...matchups]
    .filter(m => m.pairScore <= 0.5 && m.own.data)
    .sort((a, b) => a.pairScore - b.pairScore)
    .slice(0, 1)
  for (const u of unfavorable) reasons.push(`対 ${u.own.jaName} 不利`)

  return {
    member: opp,
    selectionRate: 0,
    leadRate: 0,
    threatScore,
    role,
    matchups,
    reasons,
  }
}

/* ===========================================================
 * Tier3: 6C3 組合せ最適化
 * =========================================================== */
function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = []
  const n = arr.length
  if (k > n) return out
  const idxs = Array.from({ length: k }, (_, i) => i)
  while (true) {
    out.push(idxs.map(i => arr[i]))
    let i = k - 1
    while (i >= 0 && idxs[i] === n - k + i) i--
    if (i < 0) break
    idxs[i]++
    for (let j = i + 1; j < k; j++) idxs[j] = idxs[j - 1] + 1
  }
  return out
}

/**
 * 3体選出として最も脅威的な組合せを評価
 *
 * 評価式: Σ(threatScore) + タイプカバレッジボーナス（被るより広い方が選ばれやすい）
 */
function findBestPick(
  predictions: OpponentPrediction[],
  movesMap: Record<string, MoveData>,
): RecommendedPick | null {
  const validOpps = predictions.filter(p => p.member.data)
  if (validOpps.length === 0) return null
  const k = Math.min(3, validOpps.length)
  if (k < validOpps.length) {
    // 単独でしか組めない場合の例外処理
  }
  const combos = combinations(validOpps, k)

  let best: { combo: OpponentPrediction[]; score: number } | null = null
  for (const c of combos) {
    let score = c.reduce((s, p) => s + p.threatScore, 0)
    // タイプカバレッジボーナス
    const types = new Set<string>()
    for (const p of c) {
      const data = getEffectiveData(p.member)
      if (!data) continue
      inferOffensiveTypes(p.member, data, movesMap).forEach(t => types.add(t))
    }
    score += types.size * 0.15
    // 役割重複ペナルティ（壁2匹など重複を避ける）
    const roles = c.map(p => p.role)
    const roleCounts = new Map<OppRole, number>()
    roles.forEach(r => roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1))
    for (const cnt of roleCounts.values()) {
      if (cnt >= 2) score -= 0.20 * (cnt - 1)
    }

    if (!best || score > best.score) best = { combo: c, score }
  }
  if (!best) return null

  // 理由文の組立
  const types = new Set<string>()
  for (const p of best.combo) {
    const data = getEffectiveData(p.member)
    if (!data) continue
    inferOffensiveTypes(p.member, data, movesMap).forEach(t => types.add(t))
  }
  const reason = `脅威合計 ${best.score.toFixed(2)} / 攻めタイプ ${types.size}種`

  return {
    members: best.combo.map(c => c.member),
    totalThreat: best.score,
    reason,
  }
}

/* ===========================================================
 * メインエントリ
 * =========================================================== */
export function predictSelection(
  ownParty: PartyMember[],
  opponentParty: PartyMember[],
  movesMap?: Record<string, MoveData>,
): { predictions: OpponentPrediction[]; recommended: RecommendedPick | null } {
  const validOwn = ownParty.filter(m => !!m.data)
  const validOpp = opponentParty.filter(m => !!m.data)
  if (validOpp.length === 0) return { predictions: [], recommended: null }

  const safeMovesMap = movesMap ?? {}

  const ownBsts = validOwn.map(m => bst(getEffectiveData(m)!))
  const ownSpds = validOwn.map(m => getEffectiveData(m)!.stats.spd)
  const agg: PartyAggregates = {
    avgBst: ownBsts.length ? ownBsts.reduce((s, v) => s + v, 0) / ownBsts.length : 500,
    avgSpd: ownSpds.length ? ownSpds.reduce((s, v) => s + v, 0) / ownSpds.length : 80,
  }

  const predictions = validOpp.map(opp => {
    const oppData = getEffectiveData(opp)!
    const oppOffTypes = inferOffensiveTypes(opp, oppData, safeMovesMap)
    return rateOpponent(opp, oppData, validOwn, agg, safeMovesMap, oppOffTypes)
  })

  // 選出率（合計≒300%）
  const totalThreat = predictions.reduce((s, p) => s + Math.max(0.01, p.threatScore), 0)
  const totalSelections = Math.min(3, validOpp.length) * 100
  predictions.forEach(p => {
    p.selectionRate = (Math.max(0.01, p.threatScore) / totalThreat) * totalSelections
  })

  // 先発率（合計≒100%）：役割係数 × 速度 × 脅威
  const leadScores = predictions.map(p => {
    const data = getEffectiveData(p.member)!
    const speedRel = data.stats.spd / Math.max(60, agg.avgSpd)
    const roleW = leadFactor(p.role)
    return Math.max(0.01, speedRel * p.threatScore * roleW)
  })
  const totalLead = leadScores.reduce((s, v) => s + v, 0)
  predictions.forEach((p, i) => {
    p.leadRate = (leadScores[i] / totalLead) * 100
  })

  predictions.sort((a, b) => b.selectionRate - a.selectionRate)

  // Tier3: 推奨選出
  const recommended = findBestPick(predictions, safeMovesMap)

  return { predictions, recommended }
}
