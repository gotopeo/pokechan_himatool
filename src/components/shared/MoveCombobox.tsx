import { useState, useRef, useEffect, useMemo } from 'react'
import type { MoveData } from '../../types/pokemon'
import { TypeBadge } from './TypeBadge'
import type { PokemonType } from '../../data/type-chart'

/**
 * 検索用に文字列を正規化:
 *   - 大小文字を揃える
 *   - ひらがな → カタカナ（「にとろ」でも「ニトロチャージ」にヒットさせる）
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

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
/** ドロップダウン高さ目安（max-h-60 = 240px、CSS変数と一致させる） */
const DROPDOWN_MAX_HEIGHT = 240

export function MoveCombobox({ available, value, onChange, placeholder = '技を検索...' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  /**
   * 入力欄の位置から、ドロップダウンを上下どちらに開くか判定する。
   * 下方向のスペースが不足（IME予測やキーボードで隠れる場合）は上方向へ反転。
   */
  const recalcDirection = () => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    // 下が240px未満で、上の方が広いなら上に開く
    if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow) {
      setDropDirection('up')
    } else {
      setDropDirection('down')
    }
  }

  useEffect(() => {
    if (!open) return
    recalcDirection()
    window.addEventListener('resize', recalcDirection)
    window.addEventListener('scroll', recalcDirection, true)
    return () => {
      window.removeEventListener('resize', recalcDirection)
      window.removeEventListener('scroll', recalcDirection, true)
    }
  }, [open])

  const selected = available.find(m => m.slug === value)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return available.slice(0, 100)
    return available
      .filter(m =>
        normalize(m.jaName).includes(q) ||
        normalize(m.slug).includes(q) ||
        normalize(m.type as string).includes(q)
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
    <div ref={wrapRef} className="relative">
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
        <ul className={`absolute z-20 w-full max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg ${
          dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
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
