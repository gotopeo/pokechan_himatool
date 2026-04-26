import { useState } from 'react'
import { PartyProvider, useParty } from './store/party-context'
import { LoadingScreen } from './components/shared/LoadingScreen'
import { TypeMatrix } from './components/TypeMatrix/TypeMatrix'
import { SpeedComparison } from './components/SpeedComparison/SpeedComparison'
import { DamageCalculator } from './components/DamageCalculator/DamageCalculator'
import { PartyEditor } from './components/PartyEditor/PartyEditor'
import { PokemonRegistry } from './components/PokemonRegistry/PokemonRegistry'
import { SelectionPredictor } from './components/SelectionPredictor/SelectionPredictor'
import { PartyShare } from './components/PartyShare/PartyShare'

type Tab = 'party' | 'registry' | 'type' | 'speed' | 'damage' | 'predict' | 'share'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'party',    label: 'パーティ',    icon: '👥' },
  { id: 'registry', label: 'ポケモン管理', icon: '📋' },
  { id: 'type',     label: 'タイプ相性',  icon: '🔵' },
  { id: 'speed',    label: '素早さ',      icon: '⚡' },
  { id: 'damage',   label: 'ダメ計',      icon: '⚔️' },
  { id: 'predict',  label: '選出予測',    icon: '🎯' },
  { id: 'share',    label: '共有',        icon: '🔗' },
]

function AppInner() {
  const { state } = useParty()
  const [tab, setTab] = useState<Tab>('party')

  if (state.isLoading) {
    return (
      <LoadingScreen
        loaded={state.loadingProgress.loaded}
        total={state.loadingProgress.total}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <h1 className="font-bold text-base text-gray-800 dark:text-white">
            ポケチャン 対戦支援ツール
          </h1>
          <span className="ml-auto text-xs text-gray-400">
            Reg.M-A
          </span>
        </div>

        {/* タブバー */}
        <div className="max-w-4xl mx-auto px-4 pb-0">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-5">
        {tab === 'party'    && <PartyEditor />}
        {tab === 'registry' && <PokemonRegistry />}
        {tab === 'type'     && <TypeMatrix />}
        {tab === 'speed'    && <SpeedComparison />}
        {tab === 'damage'   && <DamageCalculator />}
        {tab === 'predict'  && <SelectionPredictor />}
        {tab === 'share'    && <PartyShare />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <PartyProvider>
      <AppInner />
    </PartyProvider>
  )
}
