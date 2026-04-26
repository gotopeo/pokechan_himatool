import { useMemo, useState } from 'react'
import { TYPES } from '../../data/type-chart'
import { calcTypeMatrix } from '../../lib/type-effectiveness'
import { TypeBadge, multiplierColor, multiplierLabel } from '../shared/TypeBadge'
import { useParty } from '../../store/party-context'
import { OpponentPartyEditor } from '../shared/OpponentPartyEditor'
import type { PartyMember } from '../../types/pokemon'

type Side = 'own' | 'opponent'
type ViewMode = 'own' | 'opponent' | 'both'

function MemberHeader({ member, side }: { member: PartyMember; side: Side }) {
  const data = member.isMega && member.megaData ? member.megaData : member.data
  const sideBadge = side === 'own'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
  return (
    <div className="flex flex-col items-center min-w-[64px]">
      <span className={`text-[10px] px-1 rounded mb-0.5 ${sideBadge}`}>
        {side === 'own' ? '自' : '相'}
      </span>
      {data?.sprite && (
        <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
      )}
      <span className="text-xs text-center leading-tight text-gray-700 dark:text-gray-200">
        {data?.jaName ?? member.jaName}
      </span>
    </div>
  )
}

interface MatrixTableProps {
  members: PartyMember[]
  showMegaMode: boolean
  side: Side
  scoreLabel: string
}

function MatrixTable({ members, showMegaMode, side, scoreLabel }: MatrixTableProps) {
  const matrixInputs = useMemo(
    () =>
      members.map(m => ({
        data:     m.data!,
        ability:  m.ability,
        isMega:   showMegaMode && m.isMega,
        megaData: m.megaData,
      })),
    [members, showMegaMode]
  )

  const matrix = useMemo(
    () => calcTypeMatrix(matrixInputs, [...TYPES]),
    [matrixInputs]
  )

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 pr-2 py-1 text-left text-gray-500 w-20">
              攻撃↓ / 防御→
            </th>
            {members.map(m => (
              <th key={m.id} className="px-1 py-1">
                <MemberHeader member={m} side={side} />
              </th>
            ))}
            <th className="px-2 py-1 text-gray-500">{scoreLabel}</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map(row => (
            <tr key={row.atkType} className="border-t border-gray-100 dark:border-gray-700">
              <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 pr-2 py-1">
                <TypeBadge type={row.atkType} size="sm" />
              </td>
              {row.memberMultipliers.map((mul, i) => (
                <td key={members[i].id} className="px-1 py-1 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-xs min-w-[32px] text-center ${multiplierColor(mul)}`}>
                    {multiplierLabel(mul)}
                  </span>
                </td>
              ))}
              <td className={`px-2 py-1 text-center font-bold ${
                row.score > 0
                  ? side === 'own'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                  : row.score < 0
                  ? side === 'own'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                  : 'text-gray-400'
              }`}>
                {row.score > 0 ? `+${row.score}` : row.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TypeMatrix() {
  const { state, dispatch, members } = useParty()
  const { showMegaMode, opponentMembers } = state
  const [viewMode, setViewMode] = useState<ViewMode>('own')

  const validOwn = members.filter(m => m.data)
  const validOpp = opponentMembers.filter(m => m.data)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          タイプ相性マトリクス
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showMegaMode}
            onChange={() => dispatch({ type: 'TOGGLE_MEGA_MODE' })}
            className="rounded"
          />
          メガシンカ後で計算
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

      {/* 凡例 */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[0, 0.25, 0.5, 1, 2, 4].map(v => (
          <span key={v} className={`px-2 py-0.5 rounded font-bold ${multiplierColor(v)}`}>
            {multiplierLabel(v)}
          </span>
        ))}
      </div>

      {/* 自分パーティのマトリクス */}
      {(viewMode === 'own' || viewMode === 'both') && (
        validOwn.length > 0 ? (
          <div className="space-y-1">
            {viewMode === 'both' && (
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">自分パーティ（被ダメージ視点）</p>
            )}
            <MatrixTable
              members={validOwn}
              showMegaMode={showMegaMode}
              side="own"
              scoreLabel="弱点"
            />
            <p className="text-[11px] text-gray-400">
              スコア = 弱点持ち数 − 耐性・無効持ち数（赤=パーティの穴）
            </p>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            自分のパーティが空です
          </div>
        )
      )}

      {/* 相手パーティのマトリクス */}
      {(viewMode === 'opponent' || viewMode === 'both') && (
        validOpp.length > 0 ? (
          <div className="space-y-1">
            {viewMode === 'both' && (
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">相手パーティ（攻めの通り視点）</p>
            )}
            <MatrixTable
              members={validOpp}
              showMegaMode={showMegaMode}
              side="opponent"
              scoreLabel="刺さり"
            />
            <p className="text-[11px] text-gray-400">
              スコア = 弱点突き可能数 − 耐性数（緑=刺さりやすい攻撃タイプ）
            </p>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            相手パーティが空です
          </div>
        )
      )}
    </div>
  )
}
