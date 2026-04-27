import { useState, useRef, useEffect, useMemo } from 'react'
import type { MoveData } from '../../types/pokemon'
import { TypeBadge } from './TypeBadge'
import type { PokemonType } from '../../data/type-chart'

interface Props {
  /** 選択肢として表示する技一覧（ポケモンの movePool フィルタ済を期待） */
  available: MoveData[]
  /** 現在選択中の技スラッグ */
  value?: string
  /** 変更時：選択された技のスラッグを返す（未選択 = ''） */
  onChange: (slug: string) => void
  placeholder?: string
}

/**
 * 検索可能な技選択コンボボックス。
 * 入力で日本語名・種別・タイプによる絞り込み、最大100件までインクリメンタルに表示。
 */
export function MoveCombobox({ available, value, onChange, placeholder = '技を検索...' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = available.find(m => m.slug === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return available.slice(0, 100)
    return available
      .filter(m =>
        m.jaName.includes(q) ||
        m.slug.includes(q) ||
        (m.type as string).toLowerCase().includes(q)
      )
      .slice(0, 100)
  }, [available, query])

  useEffect(() => { setHighlighted(0) }, [query])

  function handleSelect(m: MoveData) {
    onChange(m.slug)
    setQuery('')
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') setHighlighted(h => Math.min(h + 1, filtered.length - 1))
    else if (e.key === 'ArrowUp') setHighlighted(h => Math.max(h - 1, 0))
    else if (e.key === 'Enter') {
      if (filtered[highlighted]) handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selected?.jaName ?? '')}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setQuery('') }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 text-sm bg-transparent outline-none text-gray-800 dark:text-white"
        />
        {selected && !open && (
          <>
            <TypeBadge type={selected.type as PokemonType} size="sm" />
            <span className="text-[10px] text-gray-400 mx-1 whitespace-nowrap">
              {selected.category}{selected.power > 0 ? `/威${selected.power}` : ''}
            </span>
          </>
        )}
        {value && (
          <button
            onMouseDown={handleClear}
            className="px-1.5 text-gray-400 hover:text-red-500"
            aria-label="クリア"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-400 text-center">該当なし</li>
          )}
          {filtered.map((m, i) => (
            <li
              key={m.slug}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm ${
                i === highlighted
                  ? 'bg-blue-100 dark:bg-blue-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } text-gray-800 dark:text-white`}
              onMouseDown={() => handleSelect(m)}
              onMouseEnter={() => setHighlighted(i)}
            >
              <TypeBadge type={m.type as PokemonType} size="sm" />
              <span className="flex-1 truncate">{m.jaName}</span>
              <span className="text-[10px] text-gray-400 shrink-0">
                {m.category}{m.power > 0 ? ` 威${m.power}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
