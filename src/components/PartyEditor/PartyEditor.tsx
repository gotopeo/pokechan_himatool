import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

interface MemberCardProps {
  member: PartyMember
  onRemove: () => void
  onUpdate: (patch: Partial<PartyMember>) => void
}

function SortableMemberCard({ member, onRemove, onUpdate }: MemberCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [expanded, setExpanded] = useState(false)
  const data = member.isMega && member.megaData ? member.megaData : member.data
  const total = evTotal(member.evs)
  const overLimit = total > 508

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-2 p-3">
        {/* ドラッグハンドル */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing px-1"
          aria-label="並び替え"
        >
          ⠿
        </button>

        {data?.sprite && (
          <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 dark:text-white text-sm">
            {data?.jaName ?? member.jaName}
          </div>
          <div className="flex gap-1 flex-wrap mt-0.5">
            {data?.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                  {a.name}{a.isHidden ? '（隠れ）' : ''}
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

          {/* 努力値 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">努力値</span>
              <span className={`text-xs ${overLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                合計: {total}/508{overLimit ? ' ⚠超過' : ''}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EV_KEYS.map(({ key, label }) => (
                <label key={key} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-500">{label}</span>
                  <input
                    type="number" min={0} max={252} step={4}
                    value={member.evs[key]}
                    onChange={e => {
                      const val = Math.min(252, Math.max(0, Number(e.target.value)))
                      onUpdate({ evs: { ...member.evs, [key]: val } })
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-1 py-1 text-center text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </label>
              ))}
            </div>
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

export function PartyEditor() {
  const { state, addMember, removeMember, updateMember, reorderMembers } = useParty()
  const { members, allPokemon } = state

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = members.findIndex(m => m.id === active.id)
    const newIndex = members.findIndex(m => m.id === over.id)
    reorderMembers(arrayMove(members, oldIndex, newIndex))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          パーティ編集
          <span className="ml-2 text-sm font-normal text-gray-400">{members.length}/6</span>
        </h2>
      </div>

      {/* ポケモン追加 */}
      {members.length < 6 && (
        <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">ポケモンを追加</p>
          <PokemonCombobox
            allPokemon={allPokemon}
            onChange={p => addMember(p)}
            placeholder="名前・図鑑番号で検索..."
          />
        </div>
      )}

      {/* ソータブルパーティリスト */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {members.map(m => (
              <SortableMemberCard
                key={m.id}
                member={m}
                onRemove={() => removeMember(m.id)}
                onUpdate={patch => updateMember(m.id, patch)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {members.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          ポケモンを追加してパーティを組みましょう
        </div>
      )}
    </div>
  )
}
