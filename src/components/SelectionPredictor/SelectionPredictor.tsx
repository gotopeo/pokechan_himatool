import { useMemo, useState } from 'react'
import { useParty } from '../../store/party-context'
import { predictSelection } from '../../lib/selection-predictor'
import type { OpponentPrediction } from '../../lib/selection-predictor'
import { TypeBadge } from '../shared/TypeBadge'

function ProbBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
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

interface CardProps {
  pred: OpponentPrediction
  maxSelection: number
  maxLead: number
  selected: boolean
  onSelect: () => void
}

function CompactCard({ pred, maxSelection, maxLead, selected, onSelect }: CardProps) {
  const data = pred.member.data!
  return (
    <button
      onClick={onSelect}
      className={`text-left border rounded-lg shadow-sm p-2 transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {data.sprite && (
          <img src={data.sprite} alt={data.jaName} className="w-9 h-9 object-contain shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs text-gray-800 dark:text-white truncate">
            {data.jaName}
          </div>
          <div className="flex gap-0.5 mt-0.5">
            {data.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
        </div>
      </div>

      <div className="mt-1.5 space-y-1">
        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 leading-none">
            <span>選出</span>
            <span className="font-bold text-gray-800 dark:text-white text-xs">{pred.selectionRate.toFixed(0)}%</span>
          </div>
          <ProbBar value={pred.selectionRate} max={maxSelection} color="bg-gradient-to-r from-orange-400 to-red-500" />
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 leading-none">
            <span>先発</span>
            <span className="font-bold text-gray-800 dark:text-white text-xs">{pred.leadRate.toFixed(0)}%</span>
          </div>
          <ProbBar value={pred.leadRate} max={maxLead} color="bg-gradient-to-r from-purple-400 to-purple-600" />
        </div>
      </div>
    </button>
  )
}

function DetailsPanel({ pred }: { pred: OpponentPrediction }) {
  const data = pred.member.data!
  return (
    <div className="border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        {data.sprite && (
          <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-800 dark:text-white">
            {data.jaName} の詳細
          </div>
          {pred.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {pred.reasons.map((r, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">対 自分パーティの相性</p>
        <div className="space-y-0.5">
          {pred.matchups.map((mu, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {mu.own.data?.sprite && (
                <img src={mu.own.data.sprite} alt={mu.own.jaName} className="w-5 h-5 object-contain" />
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
        <p className="text-[10px] text-gray-400 mt-1">
          ◎=極有利／○=有利／△=互角／▼=不利／×=極不利
        </p>
      </div>
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

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedPred = predictions.find(p => p.member.id === selectedId) ?? null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">選出予測</h2>
        {predictions.length > 0 && (
          <span className="text-[11px] text-gray-400">
            選出率は3体選出想定（合計≒300%）／先発率は合計≒100%
          </span>
        )}
      </div>

      {validOwn.length === 0 && (
        <div className="p-3 border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          自分のパーティが登録されていません。「ポケモン管理」「パーティ」タブで登録してください。
        </div>
      )}

      {validOpp.length === 0 && (
        <div className="p-3 border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          相手パーティが登録されていません。「素早さ」「ダメ計」「タイプ相性」タブから相手のポケモンを追加してください（最大6匹）。
        </div>
      )}

      {validOpp.length > 0 && validOpp.length < 6 && (
        <div className="p-2 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[11px] text-blue-800 dark:text-blue-200">
          相手パーティは現在 {validOpp.length}/6 匹です。6匹揃うとより精度の高い予測ができます。
        </div>
      )}

      {/* グリッド：モバイル2列×3行で6匹同時表示 */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {predictions.map(p => (
            <CompactCard
              key={p.member.id}
              pred={p}
              maxSelection={maxSelection}
              maxLead={maxLead}
              selected={selectedId === p.member.id}
              onSelect={() => setSelectedId(s => s === p.member.id ? null : p.member.id)}
            />
          ))}
        </div>
      )}

      {/* 選択中ポケモンの詳細（カードクリックで開閉） */}
      {selectedPred && <DetailsPanel pred={selectedPred} />}

      {/* グリッドのみだと理由が見えないので、選択がない時は1行ヒント */}
      {predictions.length > 0 && !selectedPred && (
        <p className="text-[11px] text-gray-400 text-center">
          カードをタップで詳細（相性表・理由）を表示
        </p>
      )}
    </div>
  )
}
