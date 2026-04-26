import { getDefensiveMatchup, type PokemonType } from '../data/type-chart'
import type { PokemonData } from '../types/pokemon'

/** 特性による相性無効・軽減の定義 */
interface AbilityTypeEffect {
  ability: string
  atkType: PokemonType
  multiplier: number
}

const ABILITY_TYPE_EFFECTS: AbilityTypeEffect[] = [
  // 完全無効
  { ability: 'levitate',      atkType: 'じめん',   multiplier: 0 },   // ふゆう
  { ability: 'flashfire',     atkType: 'ほのお',   multiplier: 0 },   // もらいび
  { ability: 'waterabsorb',   atkType: 'みず',     multiplier: 0 },   // ちょすい
  { ability: 'voltabsorb',    atkType: 'でんき',   multiplier: 0 },   // ちくでん
  { ability: 'sapsipper',     atkType: 'くさ',     multiplier: 0 },   // そうしょく
  { ability: 'lightningrod',  atkType: 'でんき',   multiplier: 0 },   // ひらいしん
  { ability: 'stormdrain',    atkType: 'みず',     multiplier: 0 },   // よびみず
  { ability: 'soundproof',    atkType: 'ノーマル', multiplier: 0 },   // ぼうおん（音技）
  // 軽減
  { ability: 'heatproof',     atkType: 'ほのお',   multiplier: 0.5 }, // たいねつ
  { ability: 'thickfat',      atkType: 'ほのお',   multiplier: 0.5 }, // あついしぼう
  { ability: 'thickfat',      atkType: 'こおり',   multiplier: 0.5 }, // あついしぼう
  { ability: 'dryskin',       atkType: 'みず',     multiplier: 0 },   // かんそうはだ（みず無効）
  { ability: 'dryskin',       atkType: 'ほのお',   multiplier: 1.25 }, // かんそうはだ（ほのお）
  // 効果抜群軽減（ハードロック/フィルター）→ 0.75倍 はダメ計側で処理
  { ability: 'wonderguard',   atkType: 'ノーマル', multiplier: 0 },   // ふしぎなまもり（placeholder）
]

/** 特性英語名→日本語名マップ（表示用） */
export const ABILITY_JA: Record<string, string> = {
  levitate:      'ふゆう',
  flashfire:     'もらいび',
  waterabsorb:   'ちょすい',
  voltabsorb:    'ちくでん',
  sapsipper:     'そうしょく',
  lightningrod:  'ひらいしん',
  stormdrain:    'よびみず',
  soundproof:    'ぼうおん',
  heatproof:     'たいねつ',
  thickfat:      'あついしぼう',
  dryskin:       'かんそうはだ',
  hardrock:      'ハードロック',
  filter:        'フィルター',
  solidrock:     'ソリッドロック',
  wonderguard:   'ふしぎなまもり',
  intimidate:    'いかく',
  multiscale:    'マルチスケイル',
  roughskin:     'さめはだ',
  ironbarbs:     'てつのとげ',
  naturalcure:   'しぜんかいふく',
  regenerator:   'さいせいりょく',
  magicbounce:   'マジックミラー',
  trace:         'トレース',
  torrent:       'げきりゅう',
  blaze:         'もうか',
  overgrow:      'しんりょく',
  swarm:         'むしのしらせ',
  speed_boost:   'かそく',
  beastboost:    'じゅうてん',
  intrepidsword: 'ふとうのけん',
  dauntlessshield:'きれいなからだ',
}

/**
 * 特性補正を加味したタイプ倍率を返す
 * @param atkType 攻撃タイプ
 * @param def ディフェンダーのポケモンデータ（現在の特性込み）
 * @param defAbility 使用する特性名（英語）
 */
export function getEffectivenessWithAbility(
  atkType: PokemonType,
  def: PokemonData,
  defAbility: string
): number {
  const [type1, type2] = def.types
  let base = getDefensiveMatchup(atkType, type1, type2)

  // 特性補正
  const abilityEffect = ABILITY_TYPE_EFFECTS.find(
    e => e.ability === defAbility && e.atkType === atkType
  )
  if (abilityEffect) {
    base = base === 0 ? 0 : base * abilityEffect.multiplier
    if (abilityEffect.multiplier === 0) base = 0
  }

  return base
}

/** パーティ6匹のタイプ相性スコア計算結果 */
export interface TypeMatrixRow {
  atkType: PokemonType
  /** 各メンバーのその攻撃タイプへの被ダメ倍率 */
  memberMultipliers: number[]
  /** 弱点スコア: 弱点持ちポケモン数 − 耐性持ちポケモン数 */
  score: number
}

export function calcTypeMatrix(
  members: Array<{ data: PokemonData; ability: string; isMega: boolean; megaData?: PokemonData }>,
  TYPES: PokemonType[]
): TypeMatrixRow[] {
  return TYPES.map(atkType => {
    const memberMultipliers = members.map(m => {
      const pokeData = m.isMega && m.megaData ? m.megaData : m.data
      return getEffectivenessWithAbility(atkType, pokeData, m.ability)
    })

    const weakCount    = memberMultipliers.filter(v => v >= 2).length
    const resistCount  = memberMultipliers.filter(v => v <= 0.5 && v > 0).length
    const immuneCount  = memberMultipliers.filter(v => v === 0).length

    return {
      atkType,
      memberMultipliers,
      score: weakCount - (resistCount + immuneCount),
    }
  })
}
