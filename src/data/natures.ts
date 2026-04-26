export type NatureName =
  | 'がんばりや' | 'さみしがり' | 'ゆうかん' | 'いじっぱり' | 'やんちゃ'
  | 'ずぶとい' | 'すなお' | 'のんき' | 'わんぱく' | 'のうてんき'
  | 'ひかえめ' | 'おっとり' | 'れいせい' | 'てれや' | 'うっかりや'
  | 'おだやか' | 'おとなしい' | 'なまいき' | 'しんちょう' | 'きまぐれ'
  | 'おくびょう' | 'せっかち' | 'ようき' | 'むじゃき' | 'たのしがり'

export interface Nature {
  name: NatureName
  up: 'A' | 'B' | 'C' | 'D' | 'S' | null
  down: 'A' | 'B' | 'C' | 'D' | 'S' | null
  multiplierA: number
  multiplierB: number
  multiplierC: number
  multiplierD: number
  multiplierS: number
}

function makeNature(
  name: NatureName,
  up: 'A' | 'B' | 'C' | 'D' | 'S' | null,
  down: 'A' | 'B' | 'C' | 'D' | 'S' | null
): Nature {
  const muls = { A: 1, B: 1, C: 1, D: 1, S: 1 }
  if (up) muls[up] = 1.1
  if (down) muls[down] = 0.9
  return {
    name,
    up,
    down,
    multiplierA: muls.A,
    multiplierB: muls.B,
    multiplierC: muls.C,
    multiplierD: muls.D,
    multiplierS: muls.S,
  }
}

export const NATURES: Nature[] = [
  makeNature('がんばりや', null, null),
  makeNature('さみしがり', 'A', 'B'),
  makeNature('ゆうかん',   'A', 'S'),
  makeNature('いじっぱり', 'A', 'C'),
  makeNature('やんちゃ',   'A', 'D'),
  makeNature('ずぶとい',   'B', 'A'),
  makeNature('すなお',     null, null),
  makeNature('のんき',     'B', 'S'),
  makeNature('わんぱく',   'B', 'C'),
  makeNature('のうてんき', 'B', 'D'),
  makeNature('ひかえめ',   'C', 'A'),
  makeNature('おっとり',   'C', 'B'),
  makeNature('れいせい',   'C', 'S'),
  makeNature('てれや',     null, null),
  makeNature('うっかりや', 'C', 'D'),
  makeNature('おだやか',   'D', 'A'),
  makeNature('おとなしい', 'D', 'B'),
  makeNature('なまいき',   'D', 'S'),
  makeNature('しんちょう', 'D', 'C'),
  makeNature('きまぐれ',   null, null),
  makeNature('おくびょう', 'S', 'A'),
  makeNature('せっかち',   'S', 'B'),
  makeNature('ようき',     'S', 'C'),
  makeNature('むじゃき',   'S', 'D'),
  makeNature('たのしがり', null, null),
]

export const NATURE_MAP: Record<NatureName, Nature> = Object.fromEntries(
  NATURES.map(n => [n.name, n])
) as Record<NatureName, Nature>
