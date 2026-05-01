import { useEffect, useMemo, useRef, useState } from 'react'
import { useParty } from '../../store/party-context'
import { searchPokemon } from '../../lib/pokeapi'
import { TypeBadge } from './TypeBadge'

/**
 * Pokédex 検索モーダル — Cmd/Ctrl+K で起動。
 * - ポケモンを横断検索（自分パーティ／登録／全ポケモン）
 * - Enter で相手パーティに追加（自分パーティに居ないポケモンの場合）
 * - ESC で閉じる
 */
export function CommandPalette() {
  const { state, addOpponent } = useParty()
  const { allPokemon, opponentMembers } = state

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl+K でトグル、ESC で閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // 開いた瞬間に input にフォーカス
  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(() => {
    if (!open) return []
    const q = query.trim()
    return q
      ? searchPokemon(allPokemon, q).slice(0, 30)
      : allPokemon.slice(0, 30)
  }, [open, query, allPokemon])

  function commit(idx: number) {
    const p = results[idx]
    if (!p) return
    if (opponentMembers.length >= 6) return
    addOpponent(p)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit(cursor)
    }
  }

  if (!open) return null

  return (
    <div
      className="pdx-cp-bg"
      onClick={() => setOpen(false)}
      role="dialog"
    >
      <div className="pdx-cp" onClick={e => e.stopPropagation()}>
        <div className="pdx-cp-screen">
          <div className="pdx-cp-input-row">
            <span style={{ fontFamily: 'var(--font-arcade)', fontSize: 12, color: 'var(--lcd-text)' }}>►</span>
            <input
              ref={inputRef}
              className="pdx-cp-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setCursor(0) }}
              onKeyDown={onKeyDown}
              placeholder="ポケモンを検索..."
            />
            <span className="pdx-kbd">ESC</span>
          </div>

          <div className="pdx-cp-results">
            {results.length === 0 && (
              <div className="pdx-cp-empty">該当なし</div>
            )}
            {results.map((p, i) => (
              <div
                key={p.name}
                className={`pdx-cp-row ${i === cursor ? 'cursor' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => commit(i)}
              >
                {p.sprite ? (
                  <img src={p.sprite} alt={p.jaName} className="w-8 h-8 object-contain shrink-0" />
                ) : (
                  <div className="pdx-glyph" style={{ width: 32, height: 32 }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{p.jaName}</div>
                  <div style={{ fontSize: 10, color: i === cursor ? '#d6c79b' : 'var(--ink-soft)' }}>
                    #{p.id} {p.name}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {p.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                </div>
              </div>
            ))}
          </div>

          <div className="pdx-cp-foot">
            <span><span className="pdx-kbd">↑</span><span className="pdx-kbd">↓</span> 移動</span>
            <span><span className="pdx-kbd">⏎</span> 相手に追加</span>
            <span><span className="pdx-kbd">⌘</span><span className="pdx-kbd">K</span> 閉じる</span>
            <span style={{ marginLeft: 'auto' }}>
              相手 {opponentMembers.length}/6
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
