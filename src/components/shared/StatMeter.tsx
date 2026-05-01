import type { BaseStats } from '../../types/pokemon'

interface Props {
  stats: BaseStats
  /** バー色（cssで上書きされない場合のフォールバック）。'mine' / 'opp' / 'shared' */
  role?: 'mine' | 'opp' | 'shared'
  /** バーのスケール上限（デフォルト 200=高種族値が満タンになる程度） */
  max?: number
}

const KEYS: { key: keyof BaseStats; label: string }[] = [
  { key: 'hp',    label: 'H' },
  { key: 'atk',   label: 'A' },
  { key: 'def',   label: 'B' },
  { key: 'spAtk', label: 'C' },
  { key: 'spDef', label: 'D' },
  { key: 'spd',   label: 'S' },
]

const ROLE_VAR: Record<NonNullable<Props['role']>, string> = {
  mine:   'var(--role-mine)',
  opp:    'var(--role-opp)',
  shared: 'var(--role-shared)',
}

/**
 * 種族値を Pokégear LCD 風の6マスメーターで表示するコンポーネント。
 * カードに役割色を反映するため、外側 .pdx-role-* と組み合わせると --role-accent で着色される。
 */
export function StatMeter({ stats, role, max = 200 }: Props) {
  const accent = role ? ROLE_VAR[role] : 'var(--role-accent, var(--lcd-deep))'
  return (
    <div className="pdx-statmeter">
      {KEYS.map(({ key, label }) => {
        const v = stats[key]
        const pct = Math.min(100, (v / max) * 100)
        return (
          <div key={key} className="pdx-stat-cell">
            <span className="lbl">{label}</span>
            <span className="val">{v}</span>
            <span className="bar" style={{ width: `${pct}%`, background: accent }} />
          </div>
        )
      })}
    </div>
  )
}
