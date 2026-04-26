import { useState } from 'react'
import { useParty } from '../../store/party-context'
import { PokemonCombobox } from '../shared/PokemonCombobox'
import { TypeBadge } from '../shared/TypeBadge'
import { NATURES } from '../../data/natures'
import { ITEM_NAMES } from '../../data/items'
import { HARDCODED_MOVES, MOVE_NAMES } from '../../data/moves'
import type { PartyMember } from '../../types/pokemon'
import type { NatureName } from '../../data/natures'
import type { EVKey } from '../../types/pokemon'

const EV_KEYS: { key: EVKey; label: string }[] = [
  { key: 'hp',    label: 'H' },
  { key: 'atk',   label: 'A' },
  { key: 'def',   label: 'B' },
  { key: 'spAtk', label: 'C' },
  { key: 'spDef', label: 'D' },
  { key: 'spd',   label: 'S' },
]

function evTotal(evs: PartyMember['evs']): number {
  return evs.hp + evs.atk + evs.def + evs.spAtk + evs.spDef + evs.spd
}

interface RegistryRowProps {
  member: PartyMember
  inParty: boolean
  partyFull: boolean
  onToggleParty: () => void
  onUpdate: (patch: Partial<PartyMember>) => void
  onRemove: () => void
}

function RegistryRow({ member, inParty, partyFull, onToggleParty, onUpdate, onRemove, abilityJaNames }: RegistryRowProps & { abilityJaNames: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false)
  const data = member.data
  const total = evTotal(member.evs)
  const overLimit = total > 66

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 p-3">
        {data?.sprite && (
          <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 dark:text-white text-sm">
            {data?.jaName ?? member.jaName}
            <span className="ml-2 text-xs text-gray-400 font-normal">
              Lv{member.level} / {member.nature}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap mt-0.5">
            {data?.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            className={`flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer ${
              inParty
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                : 'border-gray-300 text-gray-500'
            } ${(!inParty && partyFull) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={inParty}
              disabled={!inParty && partyFull}
              onChange={onToggleParty}
              className="rounded"
            />
            パーティ
          </label>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 border border-blue-300 rounded"
          >
            {expanded ? '折りたたむ' : '編集'}
          </button>
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 border border-red-300 rounded"
          >
            削除
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          {/* レベル */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 w-16">レベル</span>
            <input
              type="number" min={1} max={100}
              value={member.level}
              onChange={e => onUpdate({ level: Number(e.target.value) })}
              className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </label>

          {/* 性格 */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 w-16">性格</span>
            <select
              value={member.nature}
              onChange={e => onUpdate({ nature: e.target.value as NatureName })}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {NATURES.map(n => (
                <option key={n.name} value={n.name}>
                  {n.name}
                  {n.up ? ` (${n.up}↑${n.down}↓)` : ''}
                </option>
              ))}
            </select>
          </label>

          {/* 特性 */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 w-16">特性</span>
            <select
              value={member.ability}
              onChange={e => onUpdate({ ability: e.target.value })}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {(member.data?.abilities ?? []).map(a => (
                <option key={a.slot} value={a.name}>
                  {abilityJaNames[a.name] ?? a.name}{a.isHidden ? '（隠れ）' : ''}
                </option>
              ))}
            </select>
          </label>

          {/* 持ち物 */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 w-16">持ち物</span>
            <select
              value={member.item}
              onChange={e => onUpdate({ item: e.target.value })}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {ITEM_NAMES.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </label>

          {/* メガシンカ */}
          {member.megaData && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={member.isMega}
                onChange={e => onUpdate({ isMega: e.target.checked })}
              />
              <span className="text-gray-500">メガシンカ後で表示・計算</span>
            </label>
          )}

          {/* 個体強化ポイント（ポケチャン: 各32・合計66、1pt=+1実数値） */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">個体強化ポイント</span>
              <span className={`text-xs ${overLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                合計: {total}/66{overLimit ? ' ⚠超過' : ''}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EV_KEYS.map(({ key, label }) => (
                <label key={key} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-500">{label}</span>
                  <input
                    type="number" min={0} max={32} step={1}
                    value={member.evs[key]}
                    onChange={e => {
                      const val = Math.min(32, Math.max(0, Number(e.target.value)))
                      onUpdate({ evs: { ...member.evs, [key]: val } })
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-1 py-1 text-center text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              各ステ最大32／合計最大66／1ポイントごとに実数値+1（性格補正は基礎値に乗算）
            </p>
          </div>

          {/* 技 */}
          <div>
            <span className="text-sm text-gray-500 mb-1 block">技（最大4つ）</span>
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map(idx => (
                <select
                  key={idx}
                  value={member.moves[idx] ?? ''}
                  onChange={e => {
                    const newMoves = [...member.moves]
                    newMoves[idx] = e.target.value
                    onUpdate({ moves: newMoves })
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="">--- なし ---</option>
                  {MOVE_NAMES.map(n => {
                    const m = HARDCODED_MOVES.find(mv => mv.name === n)!
                    return (
                      <option key={n} value={n}>
                        {n}（{m.type} / {m.category}）
                      </option>
                    )
                  })}
                </select>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PokemonRegistry() {
  const {
    state,
    addToRegistry,
    removeFromRegistry,
    updateRegistryMember,
    togglePartyId,
  } = useParty()
  const { registry, partyIds, allPokemon, abilityJaNames } = state

  const partySet = new Set(partyIds)
  const partyFull = partyIds.length >= 6

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          ポケモン管理
          <span className="ml-2 text-sm font-normal text-gray-400">
            登録: {registry.length}件 / パーティ: {partyIds.length}/6
          </span>
        </h2>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        対戦で使うポケモンを事前登録します。「パーティ」チェックでパーティに加わります（最大6体）。
      </p>

      {/* ポケモン追加 */}
      <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <p className="text-xs text-gray-400 mb-2">登録するポケモンを選択</p>
        <PokemonCombobox
          allPokemon={allPokemon}
          onChange={p => addToRegistry(p)}
          placeholder="名前・図鑑番号で検索..."
        />
      </div>

      {/* 登録一覧 */}
      <div className="space-y-3">
        {registry.map(m => (
          <RegistryRow
            key={m.id}
            member={m}
            inParty={partySet.has(m.id)}
            partyFull={partyFull}
            onToggleParty={() => togglePartyId(m.id)}
            onUpdate={patch => updateRegistryMember(m.id, patch)}
            onRemove={() => removeFromRegistry(m.id)}
            abilityJaNames={abilityJaNames}
          />
        ))}
      </div>

      {registry.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          まだポケモンが登録されていません。上の検索から追加してください。
        </div>
      )}
    </div>
  )
}
