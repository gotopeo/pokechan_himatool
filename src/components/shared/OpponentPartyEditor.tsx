import { useParty } from '../../store/party-context'
import { PokemonCombobox } from './PokemonCombobox'

/**
 * 相手パーティ編集UI（複数タブで共有して使う）。
 * useParty経由でグローバルな相手パーティ状態を編集する。
 */
export function OpponentPartyEditor() {
  const { state, addOpponent, removeOpponent, clearOpponent } = useParty()
  const { opponentMembers, allPokemon } = state

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
      {opponentMembers.length < 6 && (
        <PokemonCombobox
          allPokemon={allPokemon}
          onChange={p => addOpponent(p)}
          placeholder="相手のポケモンを追加..."
        />
      )}
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
