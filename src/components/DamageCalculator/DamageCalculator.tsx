import { useState, useMemo } from 'react'
import { useParty } from '../../store/party-context'
import { calcDamage } from '../../lib/damage-calc'
import { HARDCODED_MOVES, MOVE_NAMES } from '../../data/moves'
import { OpponentPartyEditor } from '../shared/OpponentPartyEditor'
import type { DamageInput, RankModifier, Weather, Field, PartyMember } from '../../types/pokemon'

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

function PokemonSelect({ ownMembers, oppMembers, value, onChange, label }: {
  ownMembers: PartyMember[]
  oppMembers: PartyMember[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
      >
        <option value="">--- 選択 ---</option>
        {ownMembers.length > 0 && (
          <optgroup label="自分">
            {ownMembers.filter(m => m.data).map(m => (
              <option key={m.id} value={m.id}>
                {m.jaName}（Lv{m.level} / {m.nature}）
              </option>
            ))}
          </optgroup>
        )}
        {oppMembers.length > 0 && (
          <optgroup label="相手">
            {oppMembers.filter(m => m.data).map(m => (
              <option key={m.id} value={m.id}>
                {m.jaName}（Lv{m.level} / {m.nature}）
              </option>
            ))}
          </optgroup>
        )}
      </select>
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

export function DamageCalculator() {
  const { members, state } = useParty()
  const { opponentMembers } = state
  const validOwn = members.filter(m => m.data)
  const validOpp = opponentMembers.filter(m => m.data)
  const allValid = [...validOwn, ...validOpp]

  const [attackerId, setAttackerId] = useState<string>('')
  const [defenderId, setDefenderId] = useState<string>('')
  const [moveName,   setMoveName]   = useState<string>('')
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
  const moveData  = HARDCODED_MOVES.find(mv => mv.name === moveName)

  const result = useMemo(() => {
    if (!attacker || !defender || !moveName) return null
    const input: DamageInput = {
      attacker,
      defender,
      moveName,
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
  }, [attacker, defender, moveName, atkRank, defRank, spAtkRank, spDefRank, weather, field, wallActive, isCrit, defHpRatio, atkIsMega])

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">ダメージ計算</h2>

      {/* 相手パーティ管理 */}
      <OpponentPartyEditor />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 攻撃側 */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-red-50 dark:bg-red-900/20">
          <h3 className="font-semibold text-red-700 dark:text-red-300 text-sm">⚔ 攻撃側</h3>
          <PokemonSelect ownMembers={validOwn} oppMembers={validOpp} value={attackerId} onChange={setAttackerId} label="ポケモン（自分/相手）" />
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

        {/* 防御側 */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-sm">🛡 防御側</h3>
          <PokemonSelect ownMembers={validOwn} oppMembers={validOpp} value={defenderId} onChange={setDefenderId} label="ポケモン（自分/相手）" />
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
          <label className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">残HP割合</span>
            <input
              type="range" min={0.01} max={1} step={0.01}
              value={defHpRatio}
              onChange={e => setDefHpRatio(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-right">{Math.round(defHpRatio * 100)}%</span>
          </label>
        </div>
      </div>

      {/* 技選択 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">技</label>
          <select
            value={moveName}
            onChange={e => setMoveName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="">--- 選択 ---</option>
            {MOVE_NAMES.filter(n => {
              const m = HARDCODED_MOVES.find(mv => mv.name === n)
              return m && m.category !== '変化' && m.power > 0
            }).map(n => {
              const m = HARDCODED_MOVES.find(mv => mv.name === n)!
              return (
                <option key={n} value={n}>
                  {n}（{m.type} {m.category} 威力{m.power}）
                </option>
              )
            })}
          </select>
        </div>
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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {result.minDamage}〜{result.maxDamage}
            </div>
            <div className="text-sm text-gray-500">
              ({result.minPercent}%〜{result.maxPercent}%)
            </div>
            <div className={`text-lg font-bold ${
              result.koChance >= 100 ? 'text-red-600' :
              result.koChance > 0   ? 'text-orange-500' : 'text-blue-600'
            }`}>
              {result.koDescription}
            </div>
          </div>

          <DamageBar rolls={result.rolls} defHp={result.defenderMaxHp} />

          <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1">
            <div>最小: {result.minDamage}（{result.minPercent}%）</div>
            <div>最大: {result.maxDamage}（{result.maxPercent}%）</div>
            <div>平均: {result.averageDamage}（{result.averagePercent}%）</div>
            <div>KO確率: {result.koChance}%</div>
          </div>

          {moveData && (
            <div className="text-xs text-gray-400">
              {moveName}（{moveData.type} / {moveData.category} / 威力{moveData.power}）
              {moveData.description && ` — ${moveData.description}`}
            </div>
          )}
        </div>
      )}

      {result && result.maxDamage === 0 && attacker && defender && moveName && (
        <div className="p-4 text-center text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
          技が無効か、計算できませんでした（タイプ無効・変化技など）
        </div>
      )}

      {(!attacker || !defender || !moveName) && (
        <div className="p-4 text-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm">
          攻撃側・防御側・技を選択してください
        </div>
      )}
    </div>
  )
}
