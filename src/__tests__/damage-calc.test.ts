import { describe, it, expect } from 'vitest'
import { calcStat, calcDamage } from '../lib/damage-calc'
import type { DamageInput, PartyMember } from '../types/pokemon'
import type { PokemonData } from '../types/pokemon'

// テスト用ポケモンデータ
const dragoniteData: PokemonData = {
  id: 149,
  name: 'dragonite',
  jaName: 'カイリュー',
  types: ['ドラゴン', 'ひこう'],
  stats: { hp: 91, atk: 134, def: 95, spAtk: 100, spDef: 100, spd: 80 },
  abilities: [{ name: 'innerfocus', isHidden: false, slot: 1 }, { name: 'multiscale', isHidden: true, slot: 2 }],
  sprite: '',
  weight: 2100,
}

const tyranitarData: PokemonData = {
  id: 248,
  name: 'tyranitar',
  jaName: 'バンギラス',
  types: ['いわ', 'あく'],
  stats: { hp: 100, atk: 134, def: 110, spAtk: 95, spDef: 100, spd: 61 },
abilities: [{ name: 'sandstream', isHidden: false, slot: 1 }],
  sprite: '',
  weight: 2020,
}

const garchompData: PokemonData = {
  id: 445,
  name: 'garchomp',
  jaName: 'ガブリアス',
  types: ['ドラゴン', 'じめん'],
  stats: { hp: 108, atk: 130, def: 95, spAtk: 80, spDef: 85, spd: 102 },
  abilities: [{ name: 'sandveil', isHidden: false, slot: 1 }, { name: 'roughskin', isHidden: true, slot: 2 }],
  sprite: '',
  weight: 950,
}

function makeMember(data: PokemonData, evs: Partial<PartyMember['evs']> = {}, nature: PartyMember['nature'] = 'がんばりや'): PartyMember {
  return {
    id: 'test',
    pokemonName: data.name,
    jaName: data.jaName,
    level: 50,
    nature,
    ability: data.abilities[0].name,
    item: 'なし',
    moves: [],
    evs: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, ...evs },
    isMega: false,
    usage: 'both',
    notes: '',
    data,
  }
}

describe('ステータス実数値計算（ポケチャン: 1pt=+1）', () => {
  it('HP: カイリュー Lv50 HP無振り → 166', () => {
    // floor((91×2 + 31) × 50/100 + 50 + 10) + 0
    // = floor(213×0.5 + 60) = floor(106.5 + 60) = 166
    const hp = calcStat(91, 0, 50, 1, true)
    expect(hp).toBe(166)
  })

  it('HP: カイリュー Lv50 HP32振り → 198', () => {
    const hp = calcStat(91, 32, 50, 1, true)
    expect(hp).toBe(166 + 32)
  })

  it('A実数値: いじっぱりカイリュー A32振り Lv50', () => {
    // floor(floor((134×2 + 31) × 50/100 + 5) × 1.1) + 32
    // = floor(floor(299×0.5 + 5) × 1.1) + 32
    // = floor(154 × 1.1) + 32 = floor(169.4) + 32 = 169 + 32 = 201
    const atk = calcStat(134, 32, 50, 1.1)
    expect(atk).toBe(201)
  })

  it('B実数値: ずぶといガブリアス B0振り Lv50 → 126', () => {
    // floor(floor((95×2 + 31) × 50/100 + 5) × 1.1) + 0
    // = floor(floor(110.5 + 5) × 1.1) = floor(115 × 1.1) = floor(126.5) = 126
    const def = calcStat(95, 0, 50, 1.1)
    expect(def).toBe(126)
  })

  it('1ポイント = +1実数値（線形性）', () => {
    const a = calcStat(100, 0, 50, 1)
    const b = calcStat(100, 1, 50, 1)
    const c = calcStat(100, 16, 50, 1)
    const d = calcStat(100, 32, 50, 1)
    expect(b - a).toBe(1)
    expect(c - a).toBe(16)
    expect(d - a).toBe(32)
  })
})

describe('ダメージ計算', () => {
  it('乱数16通りが存在する', () => {
    const attacker = makeMember(dragoniteData, { atk: 32 }, 'いじっぱり')
    const defender = makeMember(tyranitarData, { def: 32, hp: 32 }, 'ずぶとい')

    const input: DamageInput = {
      attacker,
      defender,
      moveName: 'じしん',
      atkRank: 0,
      defRank: 0,
      spAtkRank: 0,
      spDefRank: 0,
      weather: 'なし',
      field: 'なし',
      wallActive: false,
      isCrit: false,
      defenderHpRatio: 1,
      attackerIsMega: false,
    }

    const result = calcDamage(input)
    expect(result.rolls).toHaveLength(16)
    expect(result.rolls.every(r => r > 0)).toBe(true)
  })

  it('乱数の最大値 >= 最小値', () => {
    const attacker = makeMember(dragoniteData, { atk: 32 }, 'いじっぱり')
    const defender = makeMember(garchompData, {}, 'おくびょう')

    const input: DamageInput = {
      attacker,
      defender,
      moveName: 'じしん',
      atkRank: 0,
      defRank: 0,
      spAtkRank: 0,
      spDefRank: 0,
      weather: 'なし',
      field: 'なし',
      wallActive: false,
      isCrit: false,
      defenderHpRatio: 1,
      attackerIsMega: false,
    }

    const result = calcDamage(input)
    expect(result.maxDamage).toBeGreaterThanOrEqual(result.minDamage)
  })

  it('乱数の平均値は最小〜最大の間', () => {
    const attacker = makeMember(dragoniteData, { atk: 32 }, 'いじっぱり')
    const defender = makeMember(garchompData)

    const input: DamageInput = {
      attacker,
      defender,
      moveName: 'じしん',
      atkRank: 0,
      defRank: 0,
      spAtkRank: 0,
      spDefRank: 0,
      weather: 'なし',
      field: 'なし',
      wallActive: false,
      isCrit: false,
      defenderHpRatio: 1,
      attackerIsMega: false,
    }

    const result = calcDamage(input)
    expect(result.averageDamage).toBeGreaterThanOrEqual(result.minDamage)
    expect(result.averageDamage).toBeLessThanOrEqual(result.maxDamage)
  })

  it('タイプ無効技はダメージ0', () => {
    const attacker = makeMember(garchompData, { atk: 32 }, 'いじっぱり')
    const defender = makeMember(dragoniteData)  // ひこうタイプ → じめん無効

    const input: DamageInput = {
      attacker,
      defender,
      moveName: 'じしん',
      atkRank: 0,
      defRank: 0,
      spAtkRank: 0,
      spDefRank: 0,
      weather: 'なし',
      field: 'なし',
      wallActive: false,
      isCrit: false,
      defenderHpRatio: 1,
      attackerIsMega: false,
    }

    const result = calcDamage(input)
    expect(result.maxDamage).toBe(0)
  })

  it('急所時はダメージが増加する', () => {
    const attacker = makeMember(dragoniteData, { atk: 32 }, 'いじっぱり')
    const defender = makeMember(tyranitarData, { def: 32, hp: 32 }, 'ずぶとい')

    const baseInput: DamageInput = {
      attacker, defender, moveName: 'じしん',
      atkRank: 0, defRank: 0, spAtkRank: 0, spDefRank: 0,
      weather: 'なし', field: 'なし', wallActive: false, isCrit: false,
      defenderHpRatio: 1, attackerIsMega: false,
    }
    const critInput = { ...baseInput, isCrit: true }

    const base = calcDamage(baseInput)
    const crit = calcDamage(critInput)
    expect(crit.maxDamage).toBeGreaterThan(base.maxDamage)
  })

  it('はれ時のほのお技は威力1.5倍になる', () => {
    const attacker = makeMember(dragoniteData, { spAtk: 32 }, 'ひかえめ')
    const defender = makeMember(garchompData)

    const normalInput: DamageInput = {
      attacker, defender, moveName: 'かえんほうしゃ',
      atkRank: 0, defRank: 0, spAtkRank: 0, spDefRank: 0,
      weather: 'なし', field: 'なし', wallActive: false, isCrit: false,
      defenderHpRatio: 1, attackerIsMega: false,
    }
    const sunInput = { ...normalInput, weather: 'はれ' as const }

    const normal = calcDamage(normalInput)
    const sun    = calcDamage(sunInput)
    // 晴れ時は約1.5倍
    expect(sun.maxDamage).toBeGreaterThan(normal.maxDamage)
  })
})
