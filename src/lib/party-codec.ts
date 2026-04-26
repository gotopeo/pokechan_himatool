import LZString from 'lz-string'
import type { PartyMember } from '../types/pokemon'

const CODEC_VERSION = 1

interface SerializedMember {
  n: string    // pokemonName
  j: string    // jaName
  lv: number
  na: string   // nature
  ab: string   // ability
  it: string   // item
  mv: string[] // moves
  ev: number[] // [hp, atk, def, spAtk, spDef, spd]
  mg: boolean  // isMega
}

interface SerializedParty {
  v: number
  members: SerializedMember[]
}

export function encodeParty(members: PartyMember[]): string {
  const payload: SerializedParty = {
    v: CODEC_VERSION,
    members: members.map(m => ({
      n:  m.pokemonName,
      j:  m.jaName,
      lv: m.level,
      na: m.nature,
      ab: m.ability,
      it: m.item,
      mv: m.moves,
      ev: [m.evs.hp, m.evs.atk, m.evs.def, m.evs.spAtk, m.evs.spDef, m.evs.spd],
      mg: m.isMega,
    })),
  }
  const json = JSON.stringify(payload)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeParty(encoded: string): Omit<PartyMember, 'id'>[] | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const payload: SerializedParty = JSON.parse(json)
    if (payload.v !== CODEC_VERSION) return null

    return payload.members.map(m => ({
      pokemonName: m.n,
      jaName:      m.j,
      level:       m.lv,
      nature:      m.na as PartyMember['nature'],
      ability:     m.ab,
      item:        m.it,
      moves:       m.mv,
      evs: {
        hp:    m.ev[0] ?? 0,
        atk:   m.ev[1] ?? 0,
        def:   m.ev[2] ?? 0,
        spAtk: m.ev[3] ?? 0,
        spDef: m.ev[4] ?? 0,
        spd:   m.ev[5] ?? 0,
      },
      isMega: m.mg,
    }))
  } catch {
    return null
  }
}

/** URLハッシュにパーティをエンコードして設定 */
export function writePartyToHash(members: PartyMember[]): void {
  if (members.length === 0) {
    history.replaceState(null, '', location.pathname + location.search)
    return
  }
  const encoded = encodeParty(members)
  history.replaceState(null, '', `#party=${encoded}`)
}

/** URLハッシュからパーティを復元 */
export function readPartyFromHash(): Omit<PartyMember, 'id'>[] | null {
  const hash = location.hash
  const match = hash.match(/^#party=(.+)$/)
  if (!match) return null
  return decodeParty(match[1])
}
