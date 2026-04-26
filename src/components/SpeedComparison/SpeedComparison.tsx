import { useState, useMemo } from 'react'
import { useParty } from '../../store/party-context'
import { calcSpeed } from '../../lib/speed-calc'
import type { SpeedCalcInput, SpeedResult } from '../../lib/speed-calc'
import type { RankModifier } from '../../types/pokemon'
import type { PartyMember } from '../../types/pokemon'
import { OpponentPartyEditor } from '../shared/OpponentPartyEditor'

type Side = 'own' | 'opponent'
type ViewMode = 'own' | 'opponent' | 'both'

interface MemberSpeedConfig {
  memberId: string
  spdEV: number
  spdRank: RankModifier
  hasParalysis: boolean
  abilityActive: boolean
}

function SpeedBar({ result, maxSpeed, isTrickRoom, side }: {
  result: SpeedResult
  maxSpeed: number
  isTrickRoom: boolean
  side: Side
}) {
  const pct = maxSpeed > 0 ? (result.finalStat / maxSpeed) * 100 : 0
  const barClass = side === 'own'
    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
    : 'bg-gradient-to-r from-red-400 to-red-600'
  const sideBadgeClass = side === 'own'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 w-28 shrink-0">
        <span className={`text-[10px] px-1 rounded ${sideBadgeClass}`}>
          {side === 'own' ? '自' : '相'}
        </span>
        {result.sprite && (
          <img src={result.sprite} alt={result.jaName} className="w-7 h-7 object-contain" />
        )}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
          {result.jaName}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full ${barClass} rounded transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-20 text-right shrink-0">
        <span className="text-sm font-bold text-gray-800 dark:text-white">
          {result.finalStat}
        </span>
        <span className="text-xs text-gray-400 ml-1">
          (種{result.baseStat})
        </span>
      </div>
      {isTrickRoom && (
        <div className="w-6 text-center text-xs font-bold text-purple-600 dark:text-purple-400">
          {result.trickRoomOrder}
        </div>
      )}
      {result.hasParalysis && (
        <span className="text-xs bg-yellow-200 text-yellow-800 rounded px-1">まひ</span>
      )}
    </div>
  )
}

export function SpeedComparison() {
  const { members, state } = useParty()
  const { opponentMembers } = state

  const ownValid = members.filter(m => m.data)
  const oppValid = opponentMembers.filter(m => m.data)

  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [configs, setConfigs] = useState<MemberSpeedConfig[]>([])
  const [isTrickRoom, setIsTrickRoom] = useState(false)

  function getConfig(m: PartyMember): MemberSpeedConfig {
    return configs.find(c => c.memberId === m.id) ?? {
      memberId:     m.id,
      spdEV:        m.evs.spd,
      spdRank:      0,
      hasParalysis: false,
      abilityActive: false,
    }
  }

  function updateConfig(id: string, patch: Partial<MemberSpeedConfig>) {
    setConfigs(prev => {
      const exists = prev.find(c => c.memberId === id)
      if (exists) return prev.map(c => c.memberId === id ? { ...c, ...patch } : c)
      return [...prev, { memberId: id, spdEV: 0, spdRank: 0, hasParalysis: false, abilityActive: false, ...patch }]
    })
  }

  const visibleOwn = viewMode === 'opponent' ? [] : ownValid
  const visibleOpp = viewMode === 'own' ? [] : oppValid

  const results: { result: SpeedResult; side: Side }[] = useMemo(() => {
    const compute = (m: PartyMember, side: Side) => {
      const cfg = getConfig(m)
      const input: SpeedCalcInput = {
        member: m,
        spdEV: cfg.spdEV,
        spdRank: cfg.spdRank,
        hasParalysis: cfg.hasParalysis,
        abilityActive: cfg.abilityActive,
        isTrickRoom,
      }
      return { result: calcSpeed(input), side }
    }
    const arr = [
      ...visibleOwn.map(m => compute(m, 'own')),
      ...visibleOpp.map(m => compute(m, 'opponent')),
    ]
    const sorted = [...arr].sort((a, b) =>
      isTrickRoom
        ? a.result.finalStat - b.result.finalStat
        : b.result.finalStat - a.result.finalStat
    )
    sorted.forEach(({ result }, i) => { result.trickRoomOrder = i + 1 })
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOwn, visibleOpp, configs, isTrickRoom])

  const maxSpeed = Math.max(...results.map(r => r.result.finalStat), 1)

  const sortedResults = useMemo(
    () => [...results].sort((a, b) =>
      isTrickRoom
        ? a.result.finalStat - b.result.finalStat
        : b.result.finalStat - a.result.finalStat
    ),
    [results, isTrickRoom]
  )

  const showConfigsOf = viewMode === 'opponent' ? oppValid : viewMode === 'own' ? ownValid : [...ownValid, ...oppValid]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          素早さライン比較
        </h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTrickRoom}
            onChange={e => setIsTrickRoom(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">トリックルーム下</span>
        </label>
      </div>

      {/* 表示切替 */}
      <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800 w-fit">
        {(['own', 'opponent', 'both'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === mode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {mode === 'own' ? '自分' : mode === 'opponent' ? '相手' : '両方'}
          </button>
        ))}
      </div>

      {/* 相手パーティ編集（opponent/both時） */}
      {viewMode !== 'own' && <OpponentPartyEditor />}

      {/* 個別設定 */}
      {showConfigsOf.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showConfigsOf.map(m => {
            const cfg = getConfig(m)
            const isOwn = ownValid.some(o => o.id === m.id)
            return (
              <div
                key={m.id}
                className={`p-3 border rounded-lg space-y-2 ${
                  isOwn
                    ? 'border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10'
                    : 'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1 rounded ${isOwn ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {isOwn ? '自' : '相'}
                  </span>
                  {m.data?.sprite && (
                    <img src={m.data.sprite} alt={m.jaName} className="w-7 h-7" />
                  )}
                  <span className="font-medium text-sm text-gray-800 dark:text-white">
                    {m.data?.jaName ?? m.jaName}
                  </span>
                  <span className="text-xs text-gray-400">S種{m.data?.stats.spd ?? '?'}</span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <span className="text-gray-500">Sポイント</span>
                    <input
                      type="number"
                      min={0} max={32} step={1}
                      value={cfg.spdEV}
                      onChange={e => updateConfig(m.id, { spdEV: Math.min(32, Math.max(0, Number(e.target.value))) })}
                      className="w-16 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </label>

                  <label className="flex items-center gap-1">
                    <span className="text-gray-500">Sランク</span>
                    <select
                      value={cfg.spdRank}
                      onChange={e => updateConfig(m.id, { spdRank: Number(e.target.value) as RankModifier })}
                      className="border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      {([-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6] as RankModifier[]).map(r => (
                        <option key={r} value={r}>{r >= 0 ? `+${r}` : r}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.hasParalysis}
                      onChange={e => updateConfig(m.id, { hasParalysis: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-500">まひ(×0.5)</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* バーグラフ */}
      {results.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-1">
          <div className="flex items-center text-xs text-gray-400 mb-2">
            <div className="w-28">ポケモン</div>
            <div className="flex-1">素早さ</div>
            <div className="w-20 text-right">実数値</div>
            {isTrickRoom && <div className="w-6 text-center">TR順</div>}
          </div>
          {sortedResults.map(({ result, side }, i) => (
            <SpeedBar key={`${side}-${result.name}-${i}`} result={result} maxSpeed={maxSpeed} isTrickRoom={isTrickRoom} side={side} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">
          {viewMode === 'own' && '自分のパーティに登録がありません'}
          {viewMode === 'opponent' && '相手のポケモンを追加してください'}
          {viewMode === 'both' && 'パーティ・相手どちらかにポケモンを追加してください'}
        </div>
      )}
    </div>
  )
}
