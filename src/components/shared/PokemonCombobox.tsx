import { useState, useRef, useEffect } from 'react'
import type { PokemonData } from '../../types/pokemon'
import { searchPokemon } from '../../lib/pokeapi'

interface Props {
  allPokemon: PokemonData[]
  value?: PokemonData
  onChange: (pokemon: PokemonData) => void
  placeholder?: string
}

export function PokemonCombobox({ allPokemon, value, onChange, placeholder = 'ポケモンを検索...' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = query.trim()
    ? searchPokemon(allPokemon, query)
    : allPokemon

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  function handleSelect(p: PokemonData) {
    onChange(p)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlighted(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        {value?.sprite && (
          <img src={value.sprite} alt={value.jaName} className="w-8 h-8 object-contain ml-1" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (value?.jaName ?? '')}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setQuery('') }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-gray-800 dark:text-white"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
        >
          {filtered.map((p, i) => (
            <li
              key={p.name}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm
                ${i === highlighted
                  ? 'bg-blue-100 dark:bg-blue-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } text-gray-800 dark:text-white`}
              onMouseDown={() => handleSelect(p)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {p.sprite && (
                <img src={p.sprite} alt={p.jaName} className="w-7 h-7 object-contain" />
              )}
              <span className="font-medium">{p.jaName}</span>
              <span className="text-gray-400 text-xs">#{p.id} {p.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
