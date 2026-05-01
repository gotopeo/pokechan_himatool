import { useState } from 'react'
import { useParty } from '../../store/party-context'
import { PokemonCombobox } from '../shared/PokemonCombobox'
import { TypeBadge } from '../shared/TypeBadge'
import { StatMeter } from '../shared/StatMeter'
import { NATURES } from '../../data/natures'
import { ITEM_NAMES } from '../../data/items'
import { MoveCombobox } from '../shared/MoveCombobox'
import type { PartyMember, RegistryUsage, MoveData } from '../../types/pokemon'
import type { NatureName } from '../../data/natures'
import type { EVKey } from '../../types/pokemon'

const USAGE_OPTIONS: { value: RegistryUsage; label: string; badge: string }[] = [
  { value: 'both', label: '共用',   badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'own',  label: '自分用', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'opp',  label: '相手用', badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' },
]

function usageBadgeClass(usage: RegistryUsage): string {
  return USAGE_OPTIONS.find(u => u.value === usage)?.badge ?? USAGE_OPTIONS[0].badge
}

function usageLabel(usage: RegistryUsage): string {
  return USAGE_OPTIONS.find(u => u.value === usage)?.label ?? '共用'
}

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

function RegistryRow({
  member,
  inParty,
  partyFull,
  onToggleParty,
  onUpdate,
  onRemove,
  abilityJaNames,
  movesMap,
}: RegistryRowProps & {
  abilityJaNames: Record<string, string>
  movesMap: Record<string, MoveData>
}) {
  // ポケモンの movePool を MoveData[] に展開（jaNameでソート）
  const availableMoves: MoveData[] = (member.data?.movePool ?? [])
    .map(slug => movesMap[slug])
    .filter((m): m is MoveData => !!m)
    .sort((a, b) => a.jaName.localeCompare(b.jaName, 'ja'))
  const [expanded, setExpanded] = useState(false)
  const data = member.data
  const total = evTotal(member.evs)
  const overLimit = total > 66

  return (
    <div className={`pdx-ribbon-card pdx-card ${
      member.usage === 'own' ? 'pdx-role-mine'
      : member.usage === 'opp' ? 'pdx-role-opp'
      : 'pdx-role-shared'
    } ${inParty ? 'pdx-selected' : ''}`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 p-3">
        {data?.sprite && (
          <img src={data.sprite} alt={data.jaName} className="w-10 h-10 object-contain" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${usageBadgeClass(member.usage)}`}>
              {usageLabel(member.usage)}
            </span>
            <span className="font-semibold text-gray-800 dark:text-white text-sm">
              {data?.jaName ?? member.jaName}
            </span>
            <span className="text-xs text-gray-400 font-normal">
              Lv{member.level} / {member.nature}
            </span>
          </div>
          {member.notes && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={member.notes}>
              📝 {member.notes}
            </div>
          )}
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
          {/* 用途タグ */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 w-16">用途</span>
            <select
              value={member.usage}
              onChange={e => onUpdate({ usage: e.target.value as RegistryUsage })}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {USAGE_OPTIONS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </label>

          {/* 備考 */}
          <label className="flex items-start gap-2 text-sm">
            <span className="text-gray-500 w-16 pt-1">備考</span>
            <input
              type="text"
              value={member.notes}
              onChange={e => onUpdate({ notes: e.target.value })}
              placeholder="例: AS全振り、HD特殊受け、スカーフ型"
              maxLength={60}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </label>

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

          {/* 種族値メーター */}
          {member.data && (
            <div>
              <span className="text-sm text-gray-500 mb-1 block">種族値</span>
              <StatMeter stats={member.data.stats} />
            </div>
          )}

          {/* 技 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">技（最大4つ）</span>
              <span className="text-[11px] text-gray-400">
                覚える技 {availableMoves.length}個から選択
              </span>
            </div>
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map(idx => (
                <MoveCombobox
                  key={idx}
                  available={availableMoves}
                  value={member.moves[idx] ?? ''}
                  onChange={(slug) => {
                    const newMoves = [...member.moves]
                    newMoves[idx] = slug
                    onUpdate({ moves: newMoves })
                  }}
                  placeholder={`技${idx + 1}を検索...`}
                />
              ))}
            </div>
            {availableMoves.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                ⚠ 技データを読み込み中、または このポケモンの技データが取得できません。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type UsageFilter = 'all' | RegistryUsage

export function PokemonRegistry() {
  const {
    state,
    addToRegistry,
    removeFromRegistry,
    updateRegistryMember,
    togglePartyId,
  } = useParty()
  const { registry, partyIds, allPokemon, abilityJaNames, moves } = state

  const partySet = new Set(partyIds)
  const partyFull = partyIds.length >= 6

  const [usageFilter, setUsageFilter] = useState<UsageFilter>('all')
  // 'own'/'opp' フィルタは「専用 + 共用」をまとめて表示する
  const visibleRegistry = (() => {
    if (usageFilter === 'all')  return registry
    if (usageFilter === 'both') return registry.filter(m => m.usage === 'both')
    if (usageFilter === 'own')  return registry.filter(m => m.usage === 'own' || m.usage === 'both')
    return registry.filter(m => m.usage === 'opp' || m.usage === 'both')
  })()

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
        対戦で使うポケモンを事前登録します。「パーティ」チェックで自分パーティに、相手パーティへは「素早さ／ダメ計／タイプ相性」タブの相手追加から登録済みを選べます。
      </p>

      {/* 用途フィルター */}
      <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800 w-fit text-xs">
        {([
          ['all',  '全て'],
          ['own',  '自分用'],
          ['opp',  '相手用'],
          ['both', '共用'],
        ] as Array<[UsageFilter, string]>).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setUsageFilter(v)}
            className={`px-3 py-1 rounded ${
              usageFilter === v
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
            <span className="ml-1 text-[10px] text-gray-400">
              ({v === 'all' ? registry.length :
                v === 'both' ? registry.filter(m => m.usage === 'both').length :
                v === 'own' ? registry.filter(m => m.usage === 'own' || m.usage === 'both').length :
                registry.filter(m => m.usage === 'opp' || m.usage === 'both').length})
            </span>
          </button>
        ))}
      </div>

      {/* ポケモン追加 */}
      <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <p className="text-xs text-gray-400 mb-2">登録するポケモンを選択</p>
        <PokemonCombobox
          allPokemon={allPokemon}
          onChange={p => addToRegistry(p)}
          placeholder="名前・図鑑番号で検索..."
        />
      </div>

      {/* 登録一覧（フィルター適用後） */}
      <div className="space-y-3">
        {visibleRegistry.map(m => (
          <RegistryRow
            key={m.id}
            member={m}
            inParty={partySet.has(m.id)}
            partyFull={partyFull}
            onToggleParty={() => togglePartyId(m.id)}
            onUpdate={patch => updateRegistryMember(m.id, patch)}
            onRemove={() => removeFromRegistry(m.id)}
            abilityJaNames={abilityJaNames}
            movesMap={moves}
          />
        ))}
      </div>

      {registry.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          まだポケモンが登録されていません。上の検索から追加してください。
        </div>
      )}
      {registry.length > 0 && visibleRegistry.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          このフィルターに該当する登録ポケモンはありません。
        </div>
      )}
    </div>
  )
}
