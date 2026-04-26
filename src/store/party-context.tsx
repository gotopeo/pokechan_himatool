import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PartyMember, EVs } from '../types/pokemon'
import type { PokemonData } from '../types/pokemon'
import type { NatureName } from '../data/natures'
import { readPartyFromHash, writePartyToHash } from '../lib/party-codec'
import { loadAllPokemon } from '../lib/pokeapi'

const PARTY_STORAGE_KEY = 'pokechan_party_v1'
const MAX_PARTY_SIZE = 6

// ---- State ----------------------------------------------------------------

export interface PartyState {
  members: PartyMember[]
  allPokemon: PokemonData[]
  loadingProgress: { loaded: number; total: number }
  isLoading: boolean
  darkMode: boolean
  showMegaMode: boolean   // マトリクス計算をメガシンカ後タイプで行うか
}

const initialState: PartyState = {
  members: [],
  allPokemon: [],
  loadingProgress: { loaded: 0, total: 1 },
  isLoading: true,
  darkMode: false,
  showMegaMode: false,
}

// ---- Actions ---------------------------------------------------------------

type Action =
  | { type: 'SET_ALL_POKEMON'; payload: PokemonData[] }
  | { type: 'SET_LOADING_PROGRESS'; loaded: number; total: number }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'ADD_MEMBER'; payload: PartyMember }
  | { type: 'REMOVE_MEMBER'; id: string }
  | { type: 'UPDATE_MEMBER'; id: string; patch: Partial<PartyMember> }
  | { type: 'REORDER_MEMBERS'; members: PartyMember[] }
  | { type: 'SET_MEMBERS'; members: PartyMember[] }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_MEGA_MODE' }

// ---- Reducer ---------------------------------------------------------------

function reducer(state: PartyState, action: Action): PartyState {
  switch (action.type) {
    case 'SET_ALL_POKEMON':
      return { ...state, allPokemon: action.payload }

    case 'SET_LOADING_PROGRESS':
      return {
        ...state,
        loadingProgress: { loaded: action.loaded, total: action.total },
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }

    case 'ADD_MEMBER':
      if (state.members.length >= MAX_PARTY_SIZE) return state
      return { ...state, members: [...state.members, action.payload] }

    case 'REMOVE_MEMBER':
      return { ...state, members: state.members.filter(m => m.id !== action.id) }

    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(m =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      }

    case 'REORDER_MEMBERS':
      return { ...state, members: action.members }

    case 'SET_MEMBERS':
      return { ...state, members: action.members }

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode }

    case 'TOGGLE_MEGA_MODE':
      return { ...state, showMegaMode: !state.showMegaMode }

    default:
      return state
  }
}

// ---- Context ---------------------------------------------------------------

interface PartyContextValue {
  state: PartyState
  dispatch: React.Dispatch<Action>
  addMember: (pokemon: PokemonData) => void
  removeMember: (id: string) => void
  updateMember: (id: string, patch: Partial<PartyMember>) => void
  reorderMembers: (members: PartyMember[]) => void
  generateShareUrl: () => string
}

const PartyContext = createContext<PartyContextValue | null>(null)

// ---- Provider --------------------------------------------------------------

function makeMember(pokemon: PokemonData): PartyMember {
  return {
    id:          uuidv4(),
    pokemonName: pokemon.name,
    jaName:      pokemon.jaName,
    level:       50,
    nature:      'がんばりや' as NatureName,
    ability:     pokemon.abilities[0]?.name ?? '',
    item:        'なし',
    moves:       [],
    evs:         { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
    isMega:      false,
    data:        pokemon,
  }
}

function loadPersistedParty(): PartyMember[] {
  try {
    const raw = localStorage.getItem(PARTY_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function persistParty(members: PartyMember[]): void {
  try {
    // dataはキャッシュから再ロードするので保存しない（容量節約）
    const stripped = members.map(m => ({ ...m, data: undefined, megaData: undefined }))
    localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(stripped))
  } catch {
    // ignore
  }
}

export function PartyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ポケモンデータをロード
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      dispatch({ type: 'SET_LOADING', isLoading: true })
      try {
        const pokemon = await loadAllPokemon((loaded, total) => {
          if (!cancelled) {
            dispatch({ type: 'SET_LOADING_PROGRESS', loaded, total })
          }
        })
        if (!cancelled) {
          dispatch({ type: 'SET_ALL_POKEMON', payload: pokemon })

          // URLハッシュからパーティ復元を試みる
          const fromHash = readPartyFromHash()
          if (fromHash && fromHash.length > 0) {
            const members: PartyMember[] = fromHash.map(raw => {
              const pokeData = pokemon.find(p => p.name === raw.pokemonName)
              return { ...raw, id: uuidv4(), data: pokeData }
            })
            dispatch({ type: 'SET_MEMBERS', members })
          } else {
            // localStorageから復元
            const persisted = loadPersistedParty()
            if (persisted.length > 0) {
              const members = persisted.map(m => ({
                ...m,
                data: pokemon.find(p => p.name === m.pokemonName),
              }))
              dispatch({ type: 'SET_MEMBERS', members })
            }
          }
        }
      } finally {
        if (!cancelled) dispatch({ type: 'SET_LOADING', isLoading: false })
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ダークモード反映
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [state.darkMode])

  // パーティの永続化
  useEffect(() => {
    if (!state.isLoading) {
      persistParty(state.members)
    }
  }, [state.members, state.isLoading])

  const addMember = useCallback((pokemon: PokemonData) => {
    dispatch({ type: 'ADD_MEMBER', payload: makeMember(pokemon) })
  }, [])

  const removeMember = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MEMBER', id })
  }, [])

  const updateMember = useCallback((id: string, patch: Partial<PartyMember>) => {
    dispatch({ type: 'UPDATE_MEMBER', id, patch })
  }, [])

  const reorderMembers = useCallback((members: PartyMember[]) => {
    dispatch({ type: 'REORDER_MEMBERS', members })
  }, [])

  const generateShareUrl = useCallback(() => {
    writePartyToHash(state.members)
    return window.location.href
  }, [state.members])

  return (
    <PartyContext.Provider
      value={{ state, dispatch, addMember, removeMember, updateMember, reorderMembers, generateShareUrl }}
    >
      {children}
    </PartyContext.Provider>
  )
}

export function useParty() {
  const ctx = useContext(PartyContext)
  if (!ctx) throw new Error('useParty must be used within PartyProvider')
  return ctx
}

export type { EVs }
