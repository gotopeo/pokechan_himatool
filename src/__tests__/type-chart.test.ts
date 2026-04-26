import { describe, it, expect } from 'vitest'
import { getTypeMatchup, getDefensiveMatchup } from '../data/type-chart'

describe('タイプ相性表', () => {
  it('ほのお→くさ = ×2', () => {
    expect(getTypeMatchup('ほのお', 'くさ')).toBe(2)
  })

  it('みず→ほのお = ×2', () => {
    expect(getTypeMatchup('みず', 'ほのお')).toBe(2)
  })

  it('でんき→じめん = ×0（免疫）', () => {
    expect(getTypeMatchup('でんき', 'じめん')).toBe(0)
  })

  it('ノーマル→ゴースト = ×0（免疫）', () => {
    expect(getTypeMatchup('ノーマル', 'ゴースト')).toBe(0)
  })

  it('かくとう→ゴースト = ×0（免疫）', () => {
    expect(getTypeMatchup('かくとう', 'ゴースト')).toBe(0)
  })

  it('フェアリー→ドラゴン = ×2', () => {
    expect(getTypeMatchup('フェアリー', 'ドラゴン')).toBe(2)
  })

  it('ドラゴン→フェアリー = ×0（免疫）', () => {
    expect(getTypeMatchup('ドラゴン', 'フェアリー')).toBe(0)
  })

  it('いわ→ひこう = ×2', () => {
    expect(getTypeMatchup('いわ', 'ひこう')).toBe(2)
  })

  it('ほのお→みず = ×0.5', () => {
    expect(getTypeMatchup('ほのお', 'みず')).toBe(0.5)
  })

  it('2タイプ防御: ほのお→くさ/どく = ×2×1 = ×2', () => {
    expect(getDefensiveMatchup('ほのお', 'くさ', 'どく')).toBe(2)
  })

  it('2タイプ弱点: いわ→ほのお/ひこう = ×2×2 = ×4', () => {
    expect(getDefensiveMatchup('いわ', 'ほのお', 'ひこう')).toBe(4)
  })

  it('2タイプ打ち消し: でんき→みず/じめん = ×2×0 = ×0', () => {
    expect(getDefensiveMatchup('でんき', 'みず', 'じめん')).toBe(0)
  })

  it('2タイプ耐性: みず→みず/くさ = ×0.5×0.5 = ×0.25', () => {
    expect(getDefensiveMatchup('みず', 'みず', 'くさ')).toBe(0.25)
  })
})
