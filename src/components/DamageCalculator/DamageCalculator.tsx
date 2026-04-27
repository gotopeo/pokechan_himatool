import { useState, useMemo } from 'react'
import { useParty } from '../../store/party-context'
import { calcDamage, calcStat } from '../../lib/damage-calc'
import { getEffectivenessWithAbility } from '../../lib/type-effectiveness'
import { OpponentPartyEditor } from '../shared/OpponentPartyEditor'
import { MoveCombobox } from '../shared/MoveCombobox'
import { TypeBadge } from '../shared/TypeBadge'
import type { DamageInput, RankModifier, Weather, Field, PartyMember, MoveData } from '../../types/pokemon'
import type { PokemonType } from '../../data/type-chart'

const WEATHER_OPTIONS: Weather[] = ['なし', 'はれ', 'あめ', 'すなあらし', 'あられ']
const FIELD_OPTIONS: Field[]   = ['なし', 'エレキフィールド', 'グラスフィールド', 'サイコフィールド', 'ミストフィールド']
const RANKS: RankModifier[] = [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6]

function RankSelect({ value, onChange }: { value: RankModifier; onChange: (v: RankModifier) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value) as RankModifier)}
      className="border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
    >
      {RANKS.map(r => (
        <option key={r} value={r}>{r >= 0 ? `+${r}` : r}</option>
      ))}
    </select>
  )
}

interface ChipPickerProps {
  ownMembers: PartyMember[]
  oppMembers: PartyMember[]
  value: string
  onChange: (id: string) => void
}

function PokemonChipPicker({ ownMembers, oppMembers, value, onChange }: ChipPickerProps) {
  const renderChip = (m: PartyMember, side: 'own' | 'opp') => {
    const data = m.isMega && m.megaData ? m.megaData : m.data
    const isSelected = value === m.id
    const baseColor = side === 'own'
      ? (isSelected
          ? 'border-blue-500 bg-blue-100 dark:bg-blue-800'
          : 'border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-white dark:bg-gray-800')
      : (isSelected
          ? 'border-red-500 bg-red-100 dark:bg-red-800'
          : 'border-red-200 dark:border-red-800 hover:border-red-400 bg-white dark:bg-gray-800')
    return (
      <button
        key={m.id}
        onClick={() => onChange(m.id)}
        className={`flex items-center gap-1 px-1.5 py-1 border rounded text-left transition-colors ${baseColor}`}
      >
        {data?.sprite && (
          <img src={data.sprite} alt={data.jaName} className="w-7 h-7 object-contain shrink-0" />
        )}
        <span className="text-xs text-gray-800 dark:text-white truncate max-w-[90px]" title={data?.jaName}>
          {data?.jaName ?? m.jaName}
        </span>
      </button>
    )
  }

  if (ownMembers.length === 0 && oppMembers.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        パーティ未登録です
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      {ownMembers.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-300 mr-1">自分</span>
          <div className="inline-flex flex-wrap gap-1 align-middle">
            {ownMembers.map(m => renderChip(m, 'own'))}
          </div>
        </div>
      )}
      {oppMembers.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold text-red-600 dark:text-red-300 mr-1">相手</span>
          <div className="inline-flex flex-wrap gap-1 align-middle">
            {oppMembers.map(m => renderChip(m, 'opp'))}
          </div>
        </div>
      )}
    </div>
  )
}

function DamageBar({ rolls, defHp }: { rolls: number[]; defHp: number }) {
  if (defHp === 0 || rolls.every(r => r === 0)) return null
  const max = defHp
  return (
    <div className="space-y-1">
      <div className="flex gap-0.5 h-6">
        {rolls.map((r, i) => {
          const pct = Math.min(r / max * 100, 100)
          const exceeds = r >= defHp
          return (
            <div
              key={i}
              title={`${r} (${Math.round(r / defHp * 100)}%)`}
              className={`flex-1 rounded-sm ${exceeds ? 'bg-red-500' : 'bg-blue-400'}`}
              style={{ height: `${pct}%`, alignSelf: 'flex-end' }}
            />
          )
        })}
      </div>
      <div className="text-xs text-gray-400 text-center">乱数16通りの分布</div>
    </div>
  )
}

/**
 * タイプ相性倍率を表示用ラベルに変換
 */
function effectivenessLabel(mul: number): { text: string; color: string } | null {
  if (mul === 0)         return { text: 'こうかなし',   color: 'bg-gray-800 text-white' }
  if (mul <= 0.25)       return { text: 'いまひとつ(¼)', color: 'bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100' }
  if (mul < 1)           return { text: 'いまひとつ',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' }
  if (mul === 1)         return null // 等倍は表示しない（ノイズ削減）
  if (mul >= 4)          return { text: 'ばつぐん(×4)', color: 'bg-red-300 text-red-900 dark:bg-red-700 dark:text-red-100' }
  return                        { text: 'ばつぐん',     color: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' }
}

export function DamageCalculator() {
  const { members, state } = useParty()
  const { opponentMembers, moves: movesMap } = state
  const validOwn = members.filter(m => m.data)
  const validOpp = opponentMembers.filter(m => m.data)
  const allValid = [...validOwn, ...validOpp]

  const [attackerId, setAttackerId] = useState<string>('')
  const [defenderId, setDefenderId] = useState<string>('')
  const [moveSlug,   setMoveSlug]   = useState<string>('')
  const [atkRank,    setAtkRank]    = useState<RankModifier>(0)
  const [defRank,    setDefRank]    = useState<RankModifier>(0)
  const [spAtkRank,  setSpAtkRank]  = useState<RankModifier>(0)
  const [spDefRank,  setSpDefRank]  = useState<RankModifier>(0)
  const [weather,    setWeather]    = useState<Weather>('なし')
  const [field,      setField]      = useState<Field>('なし')
  const [wallActive, setWallActive] = useState(false)
  const [isCrit,     setIsCrit]     = useState(false)
  const [defHpRatio, setDefHpRatio] = useState(1)
  const [atkIsMega,  setAtkIsMega]  = useState(false)

  const attacker = allValid.find(m => m.id === attackerId)
  const defender = allValid.find(m => m.id === defenderId)
  const moveData: MoveData | undefined = moveSlug ? movesMap[moveSlug] : undefined

  // 攻撃側の覚える技から、攻撃技（変化技以外・威力>0）のみを選択肢とする
  const attackerMovePool: MoveData[] = useMemo(() => {
    if (!attacker?.data?.movePool) return []
    return attacker.data.movePool
      .map(slug => movesMap[slug])
      .filter((m): m is MoveData => !!m && m.category !== '変化' && m.power > 0)
      .sort((a, b) => b.power - a.power)
  }, [attacker, movesMap])

  // タイプ相性（特性込み）
  const effectiveness = useMemo(() => {
    if (!moveData || !defender?.data) return null
    const defData = defender.data
    return getEffectivenessWithAbility(moveData.type as PokemonType, defData, defender.ability)
  }, [moveData, defender])

  const effLabel = effectiveness !== null ? effectivenessLabel(effectiveness) : null

  // 攻守スワップ
  const handleSwap = () => {
    setAttackerId(defenderId)
    setDefenderId(attackerId)
    setMoveSlug('') // 技は攻撃側のmovePoolから選ぶので、入れ替え時はリセット
    // ランクも入れ替え（A↔B、C↔D）
    setAtkRank(defRank)
    setDefRank(atkRank)
    setSpAtkRank(spDefRank)
    setSpDefRank(spAtkRank)
    setAtkIsMega(false)
  }

  const result = useMemo(() => {
    if (!attacker || !defender || !moveData) return null
    const input: DamageInput = {
      attacker,
      defender,
      moveName: moveData.jaName,
      moveData,
      atkRank,
      defRank,
      spAtkRank,
      spDefRank,
      weather,
      field,
      wallActive,
      isCrit,
      defenderHpRatio: defHpRatio,
      attackerIsMega: atkIsMega,
    }
    return calcDamage(input)
  }, [attacker, defender, moveData, atkRank, defRank, spAtkRank, spDefRank, weather, field, wallActive, isCrit, defHpRatio, atkIsMega])

  // 防御側の最大HP（技選択前から計算可能）
  const defenderMaxHp = useMemo(() => {
    if (!defender?.data) return 0
    return calcStat(defender.data.stats.hp, defender.evs.hp, defender.level, 1, true)
  }, [defender])
  const defenderCurrentHp = defenderMaxHp > 0 ? Math.max(1, Math.round(defenderMaxHp * defHpRatio)) : 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">ダメージ計算</h2>

      {/* 相手パーティ管理 */}
      <OpponentPartyEditor />

      {/* 攻撃側／⇄／防御側 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        {/* 攻撃側 */}
        <div className="p-3 border border-red-200 dark:border-red-900 rounded-lg space-y-2 bg-red-50/50 dark:bg-red-900/10">
          <h3 className="font-semibold text-red-700 dark:text-red-300 text-sm flex items-center gap-1">
            <span>⚔</span> 攻撃側
          </h3>
          <PokemonChipPicker
            ownMembers={validOwn}
            oppMembers={validOpp}
            value={attackerId}
            onChange={setAttackerId}
          />
          {attacker?.megaData && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={atkIsMega}
                onChange={e => setAtkIsMega(e.target.checked)}
              />
              メガシンカ後で計算
            </label>
          )}
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Aランク</span>
              <RankSelect value={atkRank} onChange={setAtkRank} />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Cランク</span>
              <RankSelect value={spAtkRank} onChange={setSpAtkRank} />
            </label>
          </div>
        </div>

        {/* スワップボタン */}
        <div className="flex md:flex-col items-center justify-center">
          <button
            onClick={handleSwap}
            disabled={!attackerId || !defenderId}
            className="text-sm px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            title="攻守を入れ替え"
            aria-label="攻守を入れ替え"
          >
            ⇄
          </button>
        </div>

        {/* 防御側 */}
        <div className="p-3 border border-blue-200 dark:border-blue-900 rounded-lg space-y-2 bg-blue-50/50 dark:bg-blue-900/10">
          <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-sm flex items-center gap-1">
            <span>🛡</span> 防御側
          </h3>
          <PokemonChipPicker
            ownMembers={validOwn}
            oppMembers={validOpp}
            value={defenderId}
            onChange={setDefenderId}
          />
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Bランク</span>
              <RankSelect value={defRank} onChange={setDefRank} />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Dランク</span>
              <RankSelect value={spDefRank} onChange={setSpDefRank} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 shrink-0">残HP</span>
            <input
              type="range" min={0.01} max={1} step={0.01}
              value={defHpRatio}
              onChange={e => setDefHpRatio(Number(e.target.value))}
              className="flex-1 min-w-0"
            />
            <span className="shrink-0 text-right tabular-nums text-gray-700 dark:text-gray-200">
              {defenderMaxHp > 0 ? `${defenderCurrentHp} / ${defenderMaxHp}` : '—'}
              <span className="text-gray-400 ml-1">({Math.round(defHpRatio * 100)}%)</span>
            </span>
          </label>
        </div>
      </div>

      {/* 技選択 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-gray-500">技（攻撃側の覚える技から選択）</label>
          {attacker && (
            <span className="text-[11px] text-gray-400">
              候補 {attackerMovePool.length}個
            </span>
          )}
        </div>
        <MoveCombobox
          available={attackerMovePool}
          value={moveSlug}
          onChange={setMoveSlug}
          placeholder={attacker ? '技を検索...' : 'まず攻撃側を選択してください'}
        />
        {/* 効果バッジ */}
        {moveData && defender && (
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="text-gray-500">対 {defender.data?.jaName}:</span>
            {effLabel ? (
              <span className={`px-2 py-0.5 rounded font-bold ${effLabel.color}`}>
                {effLabel.text}（×{effectiveness}）
              </span>
            ) : (
              <span className="text-gray-500">等倍（×1）</span>
            )}
          </div>
        )}
      </div>

      {/* 場の状態 */}
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1">
          <span className="text-gray-500">天候</span>
          <select
            value={weather}
            onChange={e => setWeather(e.target.value as Weather)}
            className="border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-gray-500">フィールド</span>
          <select
            value={field}
            onChange={e => setField(e.target.value as Field)}
            className="border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={wallActive} onChange={e => setWallActive(e.target.checked)} />
          <span className="text-gray-500">壁あり</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isCrit} onChange={e => setIsCrit(e.target.checked)} />
          <span className="text-gray-500">急所（×1.5）</span>
        </label>
      </div>

      {/* 結果表示 */}
      {result && result.maxDamage > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-2xl font-bold text-gray-800 dark:text-white tabular-nums">
              {result.minDamage}〜{result.maxDamage}
            </div>
            <div className="text-sm text-gray-500 tabular-nums">
              ({result.minPercent}%〜{result.maxPercent}%)
            </div>
            {effLabel && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${effLabel.color}`}>
                {effLabel.text}
              </span>
            )}
            <div className={`text-lg font-bold ${
              result.koChance >= 100 ? 'text-red-600' :
              result.koChance > 0   ? 'text-orange-500' : 'text-blue-600'
            }`}>
              {result.koDescription}
            </div>
          </div>

          <DamageBar rolls={result.rolls} defHp={result.defenderMaxHp} />

          {/* 残HP予測 */}
          <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs space-y-0.5 tabular-nums">
            <div className="text-gray-500 text-[11px] mb-0.5">
              現在HP {defenderCurrentHp} / {result.defenderMaxHp} に対する残HP予測
            </div>
            <div className="grid grid-cols-3 gap-x-3">
              <div>
                <span className="text-gray-500">最小ダメ後:</span>{' '}
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {Math.max(0, defenderCurrentHp - result.minDamage)}
                </span>
                <span className="text-gray-400"> / {result.defenderMaxHp}</span>
              </div>
              <div>
                <span className="text-gray-500">平均後:</span>{' '}
                <span className="font-bold text-gray-700 dark:text-gray-200">
                  {Math.max(0, defenderCurrentHp - result.averageDamage)}
                </span>
                <span className="text-gray-400"> / {result.defenderMaxHp}</span>
              </div>
              <div>
                <span className="text-gray-500">最大ダメ後:</span>{' '}
                <span className={`font-bold ${defenderCurrentHp - result.maxDamage <= 0 ? 'text-red-600' : 'text-red-500'}`}>
                  {Math.max(0, defenderCurrentHp - result.maxDamage)}
                </span>
                <span className="text-gray-400"> / {result.defenderMaxHp}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
            <div>最小: {result.minDamage}（{result.minPercent}%）</div>
            <div>最大: {result.maxDamage}（{result.maxPercent}%）</div>
            <div>平均: {result.averageDamage}（{result.averagePercent}%）</div>
            <div>KO確率: {result.koChance}%</div>
          </div>

          {moveData && (
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <TypeBadge type={moveData.type as PokemonType} size="sm" />
              <span>{moveData.jaName}</span>
              <span className="text-gray-400">
                {moveData.category} / 威力{moveData.power}
              </span>
            </div>
          )}
        </div>
      )}

      {result && result.maxDamage === 0 && attacker && defender && moveData && (
        <div className="p-4 text-center text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
          技が無効か、計算できませんでした（タイプ無効・変化技など）
        </div>
      )}

      {(!attacker || !defender || !moveData) && (
        <div className="p-4 text-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm">
          攻撃側・防御側・技を選択してください
        </div>
      )}
    </div>
  )
}
