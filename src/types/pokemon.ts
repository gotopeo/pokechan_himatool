import type { PokemonType } from '../data/type-chart'
import type { NatureName } from '../data/natures'

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spAtk: number
  spDef: number
  spd: number
}

export interface PokemonAbility {
  name: string
  isHidden: boolean
  slot: number
}

/** PokéAPI から取得・キャッシュするポケモンデータ */
export interface PokemonData {
  id: number
  name: string          // PokéAPI英語スラッグ (e.g. "charizard")
  jaName: string        // 日本語名 (e.g. "リザードン")
  types: PokemonType[]
  stats: BaseStats
  abilities: PokemonAbility[]
  sprite: string        // front_default URL
  weight: number        // 10g単位
  megaOf?: string       // メガシンカ前のname (e.g. "charizard")
  megaForms?: string[]  // メガ進化後のname一覧
}

export type EVKey = 'hp' | 'atk' | 'def' | 'spAtk' | 'spDef' | 'spd'

export interface EVs {
  hp: number
  atk: number
  def: number
  spAtk: number
  spDef: number
  spd: number
}

/** 登録ポケモンの用途タグ */
export type RegistryUsage = 'own' | 'opp' | 'both'

/** パーティ1匹分のデータ */
export interface PartyMember {
  id: string            // ユニークID (UUID)
  pokemonName: string   // PokéAPI slug
  jaName: string
  level: number
  nature: NatureName
  ability: string
  item: string
  moves: string[]       // 最大4つ
  evs: EVs
  isMega: boolean       // メガシンカ後で計算するか
  /** 用途タグ（自分用/相手用/共用、デフォルト: both） */
  usage: RegistryUsage
  /** 備考（型のメモ。例: 「AS全振り」「物理スカーフ型」） */
  notes: string
  // ポケモンデータへの参照（ロード済み）
  data?: PokemonData
  megaData?: PokemonData
}

/** ランク補正 (-6 〜 +6) */
export type RankModifier = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Weather = 'なし' | 'はれ' | 'あめ' | 'すなあらし' | 'あられ'
export type Field   = 'なし' | 'エレキフィールド' | 'グラスフィールド' | 'サイコフィールド' | 'ミストフィールド'

/** ダメージ計算の入力 */
export interface DamageInput {
  attacker: PartyMember
  defender: PartyMember
  moveName: string
  atkRank: RankModifier
  defRank: RankModifier
  spAtkRank: RankModifier
  spDefRank: RankModifier
  weather: Weather
  field: Field
  wallActive: boolean       // リフレクター/ひかりのかべ
  isCrit: boolean
  defenderHpRatio: number   // 0〜1（残りHP割合）
  attackerIsMega: boolean
}

/** ダメージ計算結果 */
export interface DamageResult {
  rolls: number[]           // 乱数16通りのダメージ値
  minDamage: number
  maxDamage: number
  averageDamage: number
  minPercent: number
  maxPercent: number
  averagePercent: number
  koChance: number          // 0〜100（%）
  koDescription: string     // "確定1発" | "乱数1発(x%)" | "確定2発" | etc.
  defenderMaxHp: number
}

/** 素早さ計算の入力 */
export interface SpeedInput {
  member: PartyMember
  spdEV: number
  spdRank: RankModifier
  hasParalysis: boolean
  isTrickRoom: boolean
}
