interface Props {
  loaded: number
  total: number
}

export function LoadingScreen({ loaded, total }: Props) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="text-4xl mb-4">⚡</div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        ポケチャン対戦支援ツール
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        ポケモンデータを読み込み中... ({loaded}/{total}匹)
      </p>
      <p className="text-xs text-gray-400 mb-4">初回のみ数分かかります</p>
      <div className="w-64 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">{pct}%</p>
    </div>
  )
}
