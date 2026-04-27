import { useMemo, useState } from 'react'
import { useParty } from '../../store/party-context'
import { predictSelection } from '../../lib/selection-predictor'
import type { OpponentPrediction } from '../../lib/selection-predictor'
import { TypeBadge } from '../shared/TypeBadge'

function ProbBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
      <div className={`h-full ${color} rounded transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function MatchupCell({ score }: { score: number }) {
  let bg = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  let label = '互角'
  if (score >= 1.6) { bg = 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100'; label = '◎' }
  else if (score >= 1.2) { bg = 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'; label = '○' }
  else if (score >= 0.8) { bg = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'; label = '△' }
  else if (score >= 0.5) { bg = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'; label = '▼' }
  else { bg = 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100'; label = '×' }
  return (
    <span className={`inline-block w-7 text-center text-xs font-bold rounded ${bg}`} title={score.toFixed(2)}>
      {label}
    </span>
  )
}

function PredictionCard({ pred, maxSelection, maxLead }: {
  pred: OpponentPrediction
  maxSelection: number
  maxLead: number
}) {
  const [expanded, setExpanded] = useState(false)
  const data = pred.member.data!

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          {data.sprite && (
            <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 dark:text-white text-sm">
              {data.jaName}
            </div>
            <div className="flex gap-1 mt-0.5">
              {data.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
            </div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 border border-blue-300 rounded"
          >
            {expanded ? '閉じる' : '詳細'}
          </button>
        </div>

        {/* 選出率 */}
        <div>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-gray-500">選出率</span>
            <span className="font-bold text-gray-800 dark:text-white">{pred.selectionRate.toFixed(0)}%</span>
          </div>
          <ProbBar value={pred.selectionRate} max={maxSelection} color="bg-gradient-to-r from-orange-400 to-red-500" />
        </div>

        {/* 先発確率 */}
        <div>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-gray-500">先発率</span>
            <span className="font-bold text-gray-800 dark:text-white">{pred.leadRate.toFixed(0)}%</span>
          </div>
          <ProbBar value={pred.leadRate} max={maxLead} color="bg-gradient-to-r from-purple-400 to-purple-600" />
        </div>

        {/* 理由 */}
        {pred.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pred.reasons.map((r, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-2">
          <p className="text-xs text-gray-500">対 自分パーティの相性</p>
          <div className="space-y-1">
            {pred.matchups.map((mu, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {mu.own.data?.sprite && (
                  <img src={mu.own.data.sprite} alt={mu.own.jaName} className="w-6 h-6 object-contain" />
                )}
                <span className="flex-1 truncate text-gray-700 dark:text-gray-200">
                  {mu.own.data?.jaName ?? mu.own.jaName}
                </span>
                <span className="text-gray-400">攻×{mu.offensive.toFixed(1)}</span>
                <span className="text-gray-400">受×{mu.defensive.toFixed(1)}</span>
                <MatchupCell score={mu.pairScore} />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
            ◎=極有利／○=有利／△=互角／▼=不利／×=極不利（ペアスコアによる判定）
          </p>
        </div>
      )}
    </div>
  )
}

export function SelectionPredictor() {
  const { members, state } = useParty()
  const { opponentMembers, moves } = state

  const validOwn = members.filter(m => m.data)
  const validOpp = opponentMembers.filter(m => m.data)

  const predictions = useMemo(
    () => predictSelection(validOwn, validOpp, moves),
    [validOwn, validOpp, moves]
  )

  const maxSelection = Math.max(...predictions.map(p => p.selectionRate), 1)
  const maxLead = Math.max(...predictions.map(p => p.leadRate), 1)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">選出予測</h2>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        相手6匹と自分パーティの対面から、相手が選出してくる確率と先発確率を推定します。
        計算要素: タイプ相性（特性込み）／種族値／速度／登録された技。
      </p>

      {validOwn.length === 0 && (
        <div className="p-4 border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          自分のパーティが登録されていません。「ポケモン管理」「パーティ」タブで登録してください。
        </div>
      )}

      {validOpp.length === 0 && (
        <div className="p-4 border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          相手パーティが登録されていません。「素早さ」または「ダメ計」タブから相手のポケモンを追加してください（最大6匹）。
        </div>
      )}

      {validOpp.length > 0 && validOpp.length < 6 && (
        <div className="p-3 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-800 dark:text-blue-200">
          相手パーティは現在 {validOpp.length}/6 匹です。6匹揃うとより精度の高い予測ができます。
        </div>
      )}

      {predictions.length > 0 && (
        <div className="space-y-2">
          {predictions.map(p => (
            <PredictionCard
              key={p.member.id}
              pred={p}
              maxSelection={maxSelection}
              maxLead={maxLead}
            />
          ))}
        </div>
      )}

      {predictions.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border border-gray-200 dark:border-gray-700 rounded p-3">
          <p className="font-semibold mb-1">補足</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>選出率は3体選出を想定（合計約300%）。先発率は合計約100%。</li>
            <li>相手の技が登録されていない場合、自身のタイプ（STAB想定）から推定します。</li>
            <li>本予測はローカル計算であり、考察サイトの個別データは参照していません。</li>
          </ul>
        </div>
      )}
    </div>
  )
}
