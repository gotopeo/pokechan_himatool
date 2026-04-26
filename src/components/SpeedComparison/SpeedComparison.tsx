import { useState, useMemo } from 'react'
import { useParty } from '../../store/party-context'
import { calcSpeed } from '../../lib/speed-calc'
import type { SpeedCalcInput, SpeedResult } from '../../lib/speed-calc'
import type { RankModifier } from '../../types/pokemon'
import type { PartyMember } from '../../types/pokemon'

interface MemberSpeedConfig {
  memberId: string
  spdEV: number
  spdRank: RankModifier
  hasParalysis: boolean
  abilityActive: boolean
}

function SpeedBar({ result, maxSpeed, isTrickRoom }: {
  result: SpeedResult
  maxSpeed: number
  isTrickRoom: boolean
}) {
  const pct = maxSpeed > 0 ? (result.finalStat / maxSpeed) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 w-24 shrink-0">
        {result.sprite && (
          <img src={result.sprite} alt={result.jaName} className="w-8 h-8 object-contain" />
        )}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
          {result.jaName}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded transition-all duration-300"
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
  const { state } = useParty()
  const { members } = state
  const validMembers = members.filter((m): m is PartyMember & { data: NonNullable<PartyMember['data']> } => !!m.data)

  const [configs, setConfigs] = useState<MemberSpeedConfig[]>(() =>
    validMembers.map(m => ({
      memberId:     m.id,
      spdEV:        m.evs.spd,
      spdRank:      0 as RankModifier,
      hasParalysis: false,
      abilityActive: false,
    }))
  )
  const [isTrickRoom, setIsTrickRoom] = useState(false)

  function getConfig(id: string): MemberSpeedConfig {
    return configs.find(c => c.memberId === id) ?? {
      memberId:     id,
      spdEV:        0,
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

  const results: SpeedResult[] = useMemo(() => {
    const raw = validMembers.map(m => {
      const cfg = getConfig(m.id)
      const input: SpeedCalcInput = {
        member: m,
        spdEV: cfg.spdEV,
        spdRank: cfg.spdRank,
        hasParalysis: cfg.hasParalysis,
        abilityActive: cfg.abilityActive,
        isTrickRoom,
      }
      return calcSpeed(input)
    })

    // 速い順にソート（TR時は遅い順）
    const sorted = [...raw].sort((a, b) =>
      isTrickRoom ? a.finalStat - b.finalStat : b.finalStat - a.finalStat
    )
    sorted.forEach((r, i) => { r.trickRoomOrder = i + 1 })
    return raw
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validMembers, configs, isTrickRoom])

  const maxSpeed = Math.max(...results.map(r => r.finalStat), 1)

  const sortedResults = useMemo(
    () => [...results].sort((a, b) =>
      isTrickRoom ? a.finalStat - b.finalStat : b.finalStat - a.finalStat
    ),
    [results, isTrickRoom]
  )

  if (validMembers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>パーティにポケモンを追加してください</p>
      </div>
    )
  }

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

      {/* 個別設定 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {validMembers.map(m => {
          const cfg = getConfig(m.id)
          return (
            <div
              key={m.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2"
            >
              <div className="flex items-center gap-2">
                {m.data.sprite && (
                  <img src={m.data.sprite} alt={m.jaName} className="w-8 h-8" />
                )}
                <span className="font-medium text-sm text-gray-800 dark:text-white">
                  {m.jaName}
                </span>
                <span className="text-xs text-gray-400">S種{m.data.stats.spd}</span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <span className="text-gray-500">努力値S</span>
                  <input
                    type="number"
                    min={0} max={252} step={4}
                    value={cfg.spdEV}
                    onChange={e => updateConfig(m.id, { spdEV: Number(e.target.value) })}
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
                  {/* ポケチャン仕様: まひ ×0.5 */}
                  <span className="text-gray-500">まひ(×0.5)</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>

      {/* バーグラフ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-1">
        <div className="flex items-center text-xs text-gray-400 mb-2">
          <div className="w-24">ポケモン</div>
          <div className="flex-1">素早さ</div>
          <div className="w-20 text-right">実数値</div>
          {isTrickRoom && <div className="w-6 text-center">TR順</div>}
        </div>
        {sortedResults.map(r => (
          <SpeedBar key={r.name} result={r} maxSpeed={maxSpeed} isTrickRoom={isTrickRoom} />
        ))}
      </div>
    </div>
  )
}
