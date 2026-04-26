import { useState } from 'react'
import { useParty } from '../../store/party-context'
import { PokemonCombobox } from './PokemonCombobox'

/**
 * 相手パーティ編集UI（複数タブで共有して使う）。
 * useParty経由でグローバルな相手パーティ状態を編集する。
 *
 * 追加経路は2つ:
 *   - フリー入力コンボボックス（デフォルトビルドで生成）
 *   - 登録済みから選択（ポケモン管理に登録した実ビルドをコピー追加）
 */
export function OpponentPartyEditor() {
  const {
    state,
    addOpponent,
    addOpponentFromRegistry,
    removeOpponent,
    clearOpponent,
  } = useParty()
  const { opponentMembers, allPokemon, registry } = state

  const [showRegistry, setShowRegistry] = useState(false)

  // 相手パーティ用に使える登録（相手用 + 共用）。すでに相手にコピー済みでもOK（複数追加可）
  const oppCandidates = registry.filter(m => m.usage === 'opp' || m.usage === 'both')

  return (
    <div className="p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/30 dark:bg-red-900/10 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
          相手パーティ ({opponentMembers.length}/6)
        </p>
        {opponentMembers.length > 0 && (
          <button
            onClick={() => { if (confirm('相手パーティをクリアしますか？')) clearOpponent() }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            クリア
          </button>
        )}
      </div>

      {/* フリー入力 */}
      {opponentMembers.length < 6 && (
        <PokemonCombobox
          allPokemon={allPokemon}
          onChange={p => addOpponent(p)}
          placeholder="相手のポケモンを追加（フリー入力）..."
        />
      )}

      {/* 登録済みから選択 */}
      {opponentMembers.length < 6 && oppCandidates.length > 0 && (
        <div>
          <button
            onClick={() => setShowRegistry(s => !s)}
            className="w-full flex items-center justify-between text-xs px-2 py-1.5 border border-red-300 dark:border-red-800 rounded bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <span>📋 登録済みから選択（{oppCandidates.length}件）</span>
            <span>{showRegistry ? '▲' : '▼'}</span>
          </button>
          {showRegistry && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
              {oppCandidates.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    addOpponentFromRegistry(m.id)
                    // 6体に達したら自動で閉じる
                    if (opponentMembers.length + 1 >= 6) setShowRegistry(false)
                  }}
                  className="flex items-start gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded text-left bg-white dark:bg-gray-800 hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {m.data?.sprite && (
                    <img src={m.data.sprite} alt={m.data.jaName} className="w-8 h-8 object-contain shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {m.data?.jaName ?? m.jaName}
                      </span>
                      <span className={`text-[9px] px-1 rounded shrink-0 ${
                        m.usage === 'opp'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {m.usage === 'opp' ? '相' : '共'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {m.nature} / {m.item !== 'なし' ? m.item : '持ち物なし'}
                    </div>
                    {m.notes && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={m.notes}>
                        📝 {m.notes}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 追加済みチップ */}
      {opponentMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {opponentMembers.map(m => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded text-xs"
            >
              {m.data?.sprite && (
                <img src={m.data.sprite} alt={m.data.jaName} className="w-5 h-5" />
              )}
              <span className="text-gray-800 dark:text-white">{m.data?.jaName ?? m.jaName}</span>
              {m.notes && (
                <span className="text-[10px] text-gray-500 truncate max-w-[120px]" title={m.notes}>
                  ({m.notes})
                </span>
              )}
              <button
                onClick={() => removeOpponent(m.id)}
                className="text-red-400 hover:text-red-600 ml-1"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
