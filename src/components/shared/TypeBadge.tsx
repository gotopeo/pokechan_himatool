import type { PokemonType } from '../../data/type-chart'

const TYPE_COLORS: Record<PokemonType, string> = {
  'ノーマル': 'bg-gray-400 text-white',
  'ほのお':   'bg-orange-500 text-white',
  'みず':     'bg-blue-500 text-white',
  'でんき':   'bg-yellow-400 text-black',
  'くさ':     'bg-green-500 text-white',
  'こおり':   'bg-cyan-400 text-black',
  'かくとう': 'bg-red-700 text-white',
  'どく':     'bg-purple-600 text-white',
  'じめん':   'bg-amber-600 text-white',
  'ひこう':   'bg-indigo-400 text-white',
  'エスパー': 'bg-pink-500 text-white',
  'むし':     'bg-lime-500 text-white',
  'いわ':     'bg-stone-500 text-white',
  'ゴースト': 'bg-violet-700 text-white',
  'ドラゴン': 'bg-blue-800 text-white',
  'あく':     'bg-gray-800 text-white',
  'はがね':   'bg-slate-400 text-white',
  'フェアリー': 'bg-rose-300 text-black',
}

interface Props {
  type: PokemonType
  size?: 'sm' | 'md'
}

export function TypeBadge({ type, size = 'md' }: Props) {
  const cls = TYPE_COLORS[type] ?? 'bg-gray-500 text-white'
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-sm'
  return (
    <span className={`pdx-tbadge inline-block rounded-full font-bold ${sizeClass} ${cls}`}>
      {type}
    </span>
  )
}

/** タイプ倍率に応じた背景色クラスを返す */
export function multiplierColor(value: number): string {
  if (value === 0)    return 'bg-gray-900 text-white'
  if (value <= 0.25)  return 'bg-blue-900 text-white'
  if (value <= 0.5)   return 'bg-blue-500 text-white'
  if (value === 1)    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  if (value <= 2)     return 'bg-red-400 text-white'
  return                     'bg-red-700 text-white'
}

export function multiplierLabel(value: number): string {
  if (value === 0)   return '×0'
  if (value === 0.25) return '×¼'
  if (value === 0.5)  return '×½'
  if (value === 1)    return '×1'
  if (value === 2)    return '×2'
  return `×${value}`
}
