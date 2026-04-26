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
import { TypeBadge } from '../shared/TypeBadge'
import type { PartyMember } from '../../types/pokemon'

interface SlotProps {
  member: PartyMember
  onRemove: () => void
}

function SortableSlot({ member, onRemove }: SlotProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const data = member.data

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex items-center gap-2 p-3"
    >
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
          <span className="ml-2 text-xs text-gray-400 font-normal">
            Lv{member.level} / {member.nature}
          </span>
        </div>
        {member.notes && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={member.notes}>
            📝 {member.notes}
          </div>
        )}
        <div className="flex gap-1 flex-wrap mt-0.5">
          {data?.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 border border-red-300 rounded"
      >
        外す
      </button>
    </div>
  )
}

export function PartyEditor() {
  const {
    members,
    state,
    togglePartyId,
    reorderPartyIds,
  } = useParty()
  const { registry } = state

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = members.map(m => m.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    reorderPartyIds(arrayMove(ids, oldIndex, newIndex))
  }

  const partySet = new Set(members.map(m => m.id))
  // 自分パーティの候補は「自分用 + 共用」（相手専用は除外）
  const candidates = registry.filter(m => !partySet.has(m.id) && m.usage !== 'opp')
  const partyFull = members.length >= 6

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          パーティ
          <span className="ml-2 text-sm font-normal text-gray-400">{members.length}/6</span>
        </h2>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        「ポケモン管理」で登録した中から最大6体を選びます。詳細編集は「ポケモン管理」タブで行ってください。
      </p>

      {/* 選択中（並び替え可） */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {members.map(m => (
              <SortableSlot
                key={m.id}
                member={m}
                onRemove={() => togglePartyId(m.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {members.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          まだ選ばれていません。下の候補から選んでください。
        </div>
      )}

      {/* 候補 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          候補（登録ポケモン）
        </h3>
        {registry.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            「ポケモン管理」タブからポケモンを登録してください。
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {candidates.map(m => (
            <button
              key={m.id}
              onClick={() => togglePartyId(m.id)}
              disabled={partyFull}
              className={`flex items-center gap-2 p-2 border rounded-lg text-left transition-colors ${
                partyFull
                  ? 'border-gray-200 dark:border-gray-700 opacity-40 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              } bg-white dark:bg-gray-800`}
            >
              {m.data?.sprite && (
                <img src={m.data.sprite} alt={m.data.jaName} className="w-8 h-8 object-contain" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {m.data?.jaName ?? m.jaName}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  Lv{m.level} / {m.nature}
                </div>
                {m.notes && (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={m.notes}>
                    📝 {m.notes}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
