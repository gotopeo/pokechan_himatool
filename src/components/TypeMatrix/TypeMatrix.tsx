import { useMemo } from 'react'
import { TYPES } from '../../data/type-chart'
import { calcTypeMatrix } from '../../lib/type-effectiveness'
import { TypeBadge, multiplierColor, multiplierLabel } from '../shared/TypeBadge'
import { useParty } from '../../store/party-context'
import type { PartyMember } from '../../types/pokemon'

function MemberHeader({ member }: { member: PartyMember }) {
  const data = member.isMega && member.megaData ? member.megaData : member.data
  return (
    <div className="flex flex-col items-center min-w-[64px]">
      {data?.sprite && (
        <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
      )}
      <span className="text-xs text-center leading-tight text-gray-700 dark:text-gray-200">
        {data?.jaName ?? member.jaName}
      </span>
    </div>
  )
}

export function TypeMatrix() {
  const { state, dispatch } = useParty()
  const { members, showMegaMode } = state

  const validMembers = members.filter(m => m.data)

  const matrixInputs = useMemo(
    () =>
      validMembers.map(m => ({
        data:     m.data!,
        ability:  m.ability,
        isMega:   showMegaMode && m.isMega,
        megaData: m.megaData,
      })),
    [validMembers, showMegaMode]
  )

  const matrix = useMemo(
    () => calcTypeMatrix(matrixInputs, [...TYPES]),
    [matrixInputs]
  )

  if (validMembers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">パーティにポケモンを追加してください</p>
        <p className="text-sm mt-2">最大6匹まで登録できます</p>
      </div>
    )
  }

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

      {/* 凡例 */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[0, 0.25, 0.5, 1, 2, 4].map(v => (
          <span key={v} className={`px-2 py-0.5 rounded font-bold ${multiplierColor(v)}`}>
            {multiplierLabel(v)}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 pr-2 py-1 text-left text-gray-500 w-20">
                攻撃↓ / 防御→
              </th>
              {validMembers.map(m => (
                <th key={m.id} className="px-1 py-1">
                  <MemberHeader member={m} />
                </th>
              ))}
              <th className="px-2 py-1 text-gray-500">スコア</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map(row => (
              <tr key={row.atkType} className="border-t border-gray-100 dark:border-gray-700">
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 pr-2 py-1">
                  <TypeBadge type={row.atkType} size="sm" />
                </td>
                {row.memberMultipliers.map((mul, i) => (
                  <td key={validMembers[i].id} className="px-1 py-1 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-xs min-w-[32px] text-center ${multiplierColor(mul)}`}>
                      {multiplierLabel(mul)}
                    </span>
                  </td>
                ))}
                <td className={`px-2 py-1 text-center font-bold ${
                  row.score > 0
                    ? 'text-red-600 dark:text-red-400'
                    : row.score < 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                }`}>
                  {row.score > 0 ? `+${row.score}` : row.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        スコア = 弱点持ち数 − 耐性・無効持ち数（正値が大きいほどチームの穴）
      </p>
    </div>
  )
}
