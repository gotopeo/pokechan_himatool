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
import { CommandPalette } from './components/shared/CommandPalette'

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
    <div className="pdx-shell">
      {/* 装飾リベット */}
      <span className="rivet tl" />
      <span className="rivet tr" />
      <span className="rivet bl" />
      <span className="rivet br" />

      {/* ヘッダー（Pokéball レンズ + LED + タイトル） */}
      <header>
        <div className="pdx-lens-row">
          <div className="pdx-lens-ball" />
          <div className="flex-1 min-w-0">
            <h1 className="pdx-title truncate">ポケチャン Battle Dex</h1>
            <div className="pdx-sub">REG.M-A / TRAINER SUPPORT TOOL</div>
          </div>
          <div className="hidden sm:flex gap-1.5 items-center">
            <span className="pdx-led r" />
            <span className="pdx-led y" />
            <span className="pdx-led g" />
          </div>
        </div>

        {/* タブ */}
        <nav className="pdx-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pdx-tab ${tab === t.id ? 'on' : ''}`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* メインスクリーン */}
      <main className="pdx-screen">
        {tab === 'party'    && <PartyEditor />}
        {tab === 'registry' && <PokemonRegistry />}
        {tab === 'type'     && <TypeMatrix />}
        {tab === 'speed'    && <SpeedComparison />}
        {tab === 'damage'   && <DamageCalculator />}
        {tab === 'predict'  && <SelectionPredictor />}
        {tab === 'share'    && <PartyShare />}
      </main>

      {/* グローバル: Cmd+K で起動するコマンドパレット */}
      <CommandPalette />
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
