import { useState } from 'react'
import { useParty } from '../../store/party-context'
import { clearPokemonCache } from '../../lib/pokeapi'

export function PartyShare() {
  const { state, members, generateShareUrl, dispatch } = useParty()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = generateShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('URLをコピーしてください:', url)
    }
  }

  function handleClearCache() {
    if (confirm('ポケモンデータのキャッシュを削除しますか？次回起動時に再取得します。')) {
      clearPokemonCache()
      alert('キャッシュを削除しました。ページをリロードしてください。')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">パーティ共有</h2>

      {members.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          パーティにポケモンを追加すると共有URLが生成されます
        </div>
      ) : (
        <div className="space-y-4">
          {/* パーティサマリ */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
              現在のパーティ
            </h3>
            <div className="flex flex-wrap gap-3">
              {members.map(m => {
                const data = m.isMega && m.megaData ? m.megaData : m.data
                return (
                  <div key={m.id} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                    {data?.sprite && (
                      <img src={data.sprite} alt={m.jaName} className="w-8 h-8" />
                    )}
                    <div>
                      <div className="font-medium">{m.jaName}</div>
                      <div className="text-xs text-gray-400">
                        {m.nature} / {m.item !== 'なし' ? m.item : '持ち物なし'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* URL共有 */}
          <div className="space-y-3">
            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {copied ? '✓ コピーしました！' : 'URLをクリップボードにコピー'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              URLを共有するとパーティ構成が復元できます
            </p>
          </div>
        </div>
      )}

      {/* 設定 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">設定</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">ダークモード</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.darkMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              state.darkMode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div>
          <button
            onClick={handleClearCache}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            ポケモンデータキャッシュを削除
          </button>
          <p className="text-xs text-gray-400 mt-1">
            データが古い場合やバグが発生した場合にお試しください
          </p>
        </div>
      </div>

      {/* ポケチャン仕様注記 */}
      <div className="border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 space-y-2 text-xs text-yellow-800 dark:text-yellow-200">
        <h3 className="font-bold">⚡ ポケチャン仕様メモ</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>個体値の概念なし（基準値として31扱い）</li>
          <li><strong>個体強化ポイント</strong>: 各ステ最大32／合計最大66／<strong>1pt = 実数値+1</strong>（線形）</li>
          <li>メガシンカ使用可、テラスタル/ダイマックスは使用不可</li>
          <li><strong>まひ</strong>: 技が出せない確率は <strong>12.5%</strong>（本編の25%から緩和）</li>
          <li><strong>こおり</strong>: 技使用時25%で回復、3ターン目に必ず回復</li>
          <li>TOD（時間切れ）= 引き分け、レート変動なし</li>
          <li>レギュレーションM-A: 使用可能213匹（姿違い含む）</li>
        </ul>
      </div>
    </div>
  )
}
