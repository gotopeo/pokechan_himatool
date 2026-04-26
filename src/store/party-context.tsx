import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PartyMember, EVs } from '../types/pokemon'
import type { PokemonData } from '../types/pokemon'
import type { NatureName } from '../data/natures'
import { readPartyFromHash, writePartyToHash } from '../lib/party-codec'
import { loadAllPokemon } from '../lib/pokeapi'

const REGISTRY_STORAGE_KEY = 'pokechan_registry_v1'
const PARTY_IDS_STORAGE_KEY = 'pokechan_party_ids_v1'
const OPPONENT_STORAGE_KEY = 'pokechan_opponent_v1'
const LEGACY_PARTY_KEY = 'pokechan_party_v1'
const MAX_PARTY_SIZE = 6
const MAX_OPPONENT_SIZE = 6

// ---- State ----------------------------------------------------------------

export interface PartyState {
  /** 登録ポケモン一覧（ポケモン管理画面で編集する母集団） */
  registry: PartyMember[]
  /** 自分のパーティ（registryのID参照、最大6） */
  partyIds: string[]
  /** 相手パーティ（独立した最大6体） */
  opponentMembers: PartyMember[]
  /** PokéAPIキャッシュ */
  allPokemon: PokemonData[]
  /** 特性スラッグ → 日本語名マップ */
  abilityJaNames: Record<string, string>
  loadingProgress: { loaded: number; total: number }
  isLoading: boolean
  darkMode: boolean
  showMegaMode: boolean
}

const initialState: PartyState = {
  registry: [],
  partyIds: [],
  opponentMembers: [],
  allPokemon: [],
  abilityJaNames: {},
  loadingProgress: { loaded: 0, total: 1 },
  isLoading: true,
  darkMode: false,
  showMegaMode: false,
}

// ---- Actions ---------------------------------------------------------------

type Action =
  | { type: 'SET_ALL_POKEMON'; payload: PokemonData[]; abilityJaNames: Record<string, string> }
  | { type: 'SET_LOADING_PROGRESS'; loaded: number; total: number }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'HYDRATE'; registry: PartyMember[]; partyIds: string[]; opponentMembers: PartyMember[] }
  // registry
  | { type: 'ADD_TO_REGISTRY'; payload: PartyMember }
  | { type: 'REMOVE_FROM_REGISTRY'; id: string }
  | { type: 'UPDATE_REGISTRY_MEMBER'; id: string; patch: Partial<PartyMember> }
  // party
  | { type: 'TOGGLE_PARTY_ID'; id: string }
  | { type: 'SET_PARTY_IDS'; ids: string[] }
  | { type: 'REORDER_PARTY_IDS'; ids: string[] }
  // opponent
  | { type: 'ADD_OPPONENT'; payload: PartyMember }
  | { type: 'REMOVE_OPPONENT'; id: string }
  | { type: 'UPDATE_OPPONENT'; id: string; patch: Partial<PartyMember> }
  | { type: 'REORDER_OPPONENT'; members: PartyMember[] }
  | { type: 'CLEAR_OPPONENT' }
  // ui
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_MEGA_MODE' }

// ---- Reducer ---------------------------------------------------------------

function reducer(state: PartyState, action: Action): PartyState {
  switch (action.type) {
    case 'SET_ALL_POKEMON':
      return { ...state, allPokemon: action.payload, abilityJaNames: action.abilityJaNames }

    case 'SET_LOADING_PROGRESS':
      return {
        ...state,
        loadingProgress: { loaded: action.loaded, total: action.total },
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }

    case 'HYDRATE':
      return {
        ...state,
        registry: action.registry,
        partyIds: action.partyIds,
        opponentMembers: action.opponentMembers,
      }

    case 'ADD_TO_REGISTRY':
      return { ...state, registry: [...state.registry, action.payload] }

    case 'REMOVE_FROM_REGISTRY':
      return {
        ...state,
        registry: state.registry.filter(m => m.id !== action.id),
        partyIds: state.partyIds.filter(id => id !== action.id),
      }

    case 'UPDATE_REGISTRY_MEMBER':
      return {
        ...state,
        registry: state.registry.map(m =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      }

    case 'TOGGLE_PARTY_ID': {
      if (state.partyIds.includes(action.id)) {
        return { ...state, partyIds: state.partyIds.filter(id => id !== action.id) }
      }
      if (state.partyIds.length >= MAX_PARTY_SIZE) return state
      return { ...state, partyIds: [...state.partyIds, action.id] }
    }

    case 'SET_PARTY_IDS':
      return { ...state, partyIds: action.ids.slice(0, MAX_PARTY_SIZE) }

    case 'REORDER_PARTY_IDS':
      return { ...state, partyIds: action.ids }

    case 'ADD_OPPONENT':
      if (state.opponentMembers.length >= MAX_OPPONENT_SIZE) return state
      return { ...state, opponentMembers: [...state.opponentMembers, action.payload] }

    case 'REMOVE_OPPONENT':
      return { ...state, opponentMembers: state.opponentMembers.filter(m => m.id !== action.id) }

    case 'UPDATE_OPPONENT':
      return {
        ...state,
        opponentMembers: state.opponentMembers.map(m =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      }

    case 'REORDER_OPPONENT':
      return { ...state, opponentMembers: action.members }

    case 'CLEAR_OPPONENT':
      return { ...state, opponentMembers: [] }

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
  /** 自分のパーティ（registryからpartyIdsで解決した6匹分） */
  members: PartyMember[]
  dispatch: React.Dispatch<Action>
  // registry
  addToRegistry: (pokemon: PokemonData) => string
  removeFromRegistry: (id: string) => void
  updateRegistryMember: (id: string, patch: Partial<PartyMember>) => void
  // party
  togglePartyId: (id: string) => void
  setPartyIds: (ids: string[]) => void
  reorderPartyIds: (ids: string[]) => void
  // opponent
  addOpponent: (pokemon: PokemonData) => void
  /** 登録済みポケモンを相手パーティへコピーで追加 */
  addOpponentFromRegistry: (registryId: string) => void
  removeOpponent: (id: string) => void
  updateOpponent: (id: string, patch: Partial<PartyMember>) => void
  reorderOpponent: (members: PartyMember[]) => void
  clearOpponent: () => void
  // share
  generateShareUrl: () => string
}

const PartyContext = createContext<PartyContextValue | null>(null)

// ---- Helpers --------------------------------------------------------------

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
    usage:       'both',
    notes:       '',
    data:        pokemon,
  }
}

/** 登録済みポケモンを相手パーティ用にディープコピーする（新ID発行） */
function copyForOpponent(src: PartyMember): PartyMember {
  return {
    ...src,
    id: uuidv4(),
    evs: { ...src.evs },
    moves: [...src.moves],
    usage: 'opp',
    data: src.data,
    megaData: src.megaData,
  }
}

function stripData(m: PartyMember): PartyMember {
  return { ...m, data: undefined, megaData: undefined }
}

function attachData(m: PartyMember, allPokemon: PokemonData[]): PartyMember {
  return {
    ...m,
    data: allPokemon.find(p => p.name === m.pokemonName),
    evs: clampEvs(m.evs),
    usage: m.usage ?? 'both',
    notes: m.notes ?? '',
  }
}

/** 旧ルール（max252）で保存されたEVを新ルール（max32）に丸める。 */
function clampEvs(evs: PartyMember['evs']): PartyMember['evs'] {
  return {
    hp:    Math.min(32, Math.max(0, evs?.hp    ?? 0)),
    atk:   Math.min(32, Math.max(0, evs?.atk   ?? 0)),
    def:   Math.min(32, Math.max(0, evs?.def   ?? 0)),
    spAtk: Math.min(32, Math.max(0, evs?.spAtk ?? 0)),
    spDef: Math.min(32, Math.max(0, evs?.spDef ?? 0)),
    spd:   Math.min(32, Math.max(0, evs?.spd   ?? 0)),
  }
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function persistRegistry(registry: PartyMember[]): void {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry.map(stripData)))
  } catch { /* ignore quota */ }
}

function persistPartyIds(ids: string[]): void {
  try {
    localStorage.setItem(PARTY_IDS_STORAGE_KEY, JSON.stringify(ids))
  } catch { /* ignore */ }
}

function persistOpponent(members: PartyMember[]): void {
  try {
    localStorage.setItem(OPPONENT_STORAGE_KEY, JSON.stringify(members.map(stripData)))
  } catch { /* ignore */ }
}

// ---- Provider --------------------------------------------------------------

export function PartyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ポケモンデータをロード → ストレージから復元
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      dispatch({ type: 'SET_LOADING', isLoading: true })
      try {
        const { pokemon, abilityJaNames } = await loadAllPokemon((loaded, total) => {
          if (!cancelled) {
            dispatch({ type: 'SET_LOADING_PROGRESS', loaded, total })
          }
        })
        if (cancelled) return
        dispatch({ type: 'SET_ALL_POKEMON', payload: pokemon, abilityJaNames })

        // URLハッシュからパーティ復元（共有URL経由・1回限り）
        const fromHash = readPartyFromHash()
        if (fromHash && fromHash.length > 0) {
          const newMembers: PartyMember[] = fromHash.map(raw => ({
            ...raw,
            id: uuidv4(),
            evs: clampEvs(raw.evs),
            data: pokemon.find(p => p.name === raw.pokemonName),
          }))
          const existingRegistry = loadFromStorage<PartyMember[]>(REGISTRY_STORAGE_KEY) ?? []
          const merged = [...existingRegistry.map(m => attachData(m, pokemon)), ...newMembers]
          // 取り込み後はハッシュを消去（再読み込みで再度追加されないように）
          history.replaceState(null, '', location.pathname + location.search)
          dispatch({
            type: 'HYDRATE',
            registry: merged,
            partyIds: newMembers.map(m => m.id),
            opponentMembers: loadFromStorage<PartyMember[]>(OPPONENT_STORAGE_KEY)?.map(m => attachData(m, pokemon)) ?? [],
          })
          return
        }

        // 通常復元
        let registry = loadFromStorage<PartyMember[]>(REGISTRY_STORAGE_KEY)
        let partyIds = loadFromStorage<string[]>(PARTY_IDS_STORAGE_KEY)
        const opponent = loadFromStorage<PartyMember[]>(OPPONENT_STORAGE_KEY) ?? []

        // 旧形式（v1パーティ）からのマイグレーション
        if (!registry) {
          const legacy = loadFromStorage<PartyMember[]>(LEGACY_PARTY_KEY)
          if (legacy && legacy.length > 0) {
            registry = legacy
            partyIds = legacy.map(m => m.id)
            try { localStorage.removeItem(LEGACY_PARTY_KEY) } catch { /* ignore */ }
          }
        }

        const hydratedRegistry = (registry ?? []).map(m => attachData(m, pokemon))
        const validIds = new Set(hydratedRegistry.map(m => m.id))
        const hydratedPartyIds = (partyIds ?? []).filter(id => validIds.has(id))
        const hydratedOpponent = opponent.map(m => attachData(m, pokemon))

        dispatch({
          type: 'HYDRATE',
          registry: hydratedRegistry,
          partyIds: hydratedPartyIds,
          opponentMembers: hydratedOpponent,
        })
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

  // 永続化
  useEffect(() => {
    if (!state.isLoading) persistRegistry(state.registry)
  }, [state.registry, state.isLoading])

  useEffect(() => {
    if (!state.isLoading) persistPartyIds(state.partyIds)
  }, [state.partyIds, state.isLoading])

  useEffect(() => {
    if (!state.isLoading) persistOpponent(state.opponentMembers)
  }, [state.opponentMembers, state.isLoading])

  // 派生：自分のパーティ（partyIds順にregistryから解決）
  const members = useMemo<PartyMember[]>(() => {
    const byId = new Map(state.registry.map(m => [m.id, m]))
    return state.partyIds
      .map(id => byId.get(id))
      .filter((m): m is PartyMember => !!m)
  }, [state.registry, state.partyIds])

  const addToRegistry = useCallback((pokemon: PokemonData): string => {
    const member = makeMember(pokemon)
    dispatch({ type: 'ADD_TO_REGISTRY', payload: member })
    return member.id
  }, [])

  const removeFromRegistry = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FROM_REGISTRY', id })
  }, [])

  const updateRegistryMember = useCallback((id: string, patch: Partial<PartyMember>) => {
    dispatch({ type: 'UPDATE_REGISTRY_MEMBER', id, patch })
  }, [])

  const togglePartyId = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PARTY_ID', id })
  }, [])

  const setPartyIds = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_PARTY_IDS', ids })
  }, [])

  const reorderPartyIds = useCallback((ids: string[]) => {
    dispatch({ type: 'REORDER_PARTY_IDS', ids })
  }, [])

  const addOpponent = useCallback((pokemon: PokemonData) => {
    dispatch({ type: 'ADD_OPPONENT', payload: makeMember(pokemon) })
  }, [])

  const addOpponentFromRegistry = useCallback((registryId: string) => {
    const src = state.registry.find(m => m.id === registryId)
    if (!src) return
    dispatch({ type: 'ADD_OPPONENT', payload: copyForOpponent(src) })
  }, [state.registry])

  const removeOpponent = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_OPPONENT', id })
  }, [])

  const updateOpponent = useCallback((id: string, patch: Partial<PartyMember>) => {
    dispatch({ type: 'UPDATE_OPPONENT', id, patch })
  }, [])

  const reorderOpponent = useCallback((members: PartyMember[]) => {
    dispatch({ type: 'REORDER_OPPONENT', members })
  }, [])

  const clearOpponent = useCallback(() => {
    dispatch({ type: 'CLEAR_OPPONENT' })
  }, [])

  const generateShareUrl = useCallback(() => {
    writePartyToHash(members)
    return window.location.href
  }, [members])

  return (
    <PartyContext.Provider
      value={{
        state,
        members,
        dispatch,
        addToRegistry,
        removeFromRegistry,
        updateRegistryMember,
        togglePartyId,
        setPartyIds,
        reorderPartyIds,
        addOpponent,
        addOpponentFromRegistry,
        removeOpponent,
        updateOpponent,
        reorderOpponent,
        clearOpponent,
        generateShareUrl,
      }}
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
