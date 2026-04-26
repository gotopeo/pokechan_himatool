export interface Item {
  name: string
  speedMultiplier?: number    // こだわりスカーフ等
  attackMultiplier?: number   // こだわりハチマキ等
  spAtkMultiplier?: number    // こだわりメガネ等
  defenseMultiplier?: number
  spDefMultiplier?: number
  hpBonus?: number            // たべのこし等（計算には不使用）
  description?: string
}

export const ITEMS: Item[] = [
  { name: 'なし' },
  { name: 'こだわりスカーフ',   speedMultiplier: 1.5 },
  { name: 'こだわりハチマキ',   attackMultiplier: 1.5 },
  { name: 'こだわりメガネ',     spAtkMultiplier: 1.5 },
  { name: 'しんかのきせき',     defenseMultiplier: 1.5, spDefMultiplier: 1.5 },
  { name: 'ライフオーブ',       description: '技の威力1.3倍・使用者にダメージ' },
  { name: 'たべのこし',         description: '毎ターン最大HP1/16回復' },
  { name: 'くろいヘドロ',       description: '毒タイプ:毎ターン回復/それ以外:ダメージ' },
  { name: 'メンタルハーブ',     description: '1回限り束縛・魅了・挑発を回復' },
  { name: 'きあいのタスキ',     description: 'HP満タン時に耐える' },
  { name: 'きあいのハチマキ',   description: '急所確率アップ' },
  { name: 'するどいキバ',       description: '急所確率アップ' },
  { name: 'ひかりのこな',       speedMultiplier: 1.2 },
  { name: 'くろいてっきゅう',   speedMultiplier: 0.5, description: '地面技が当たるようになる' },
  { name: 'ひこうのプレート',   description: 'ひこうタイプ技の威力1.2倍' },
  { name: 'もくたん',           description: 'ほのおタイプ技の威力1.2倍' },
  { name: 'しんぴのしずく',     description: 'みずタイプ技の威力1.2倍' },
  { name: 'じしゃく',           description: 'でんきタイプ技の威力1.2倍' },
  { name: 'きせきのタネ',       description: 'くさタイプ技の威力1.2倍' },
  { name: 'とけないこおり',     description: 'こおりタイプ技の威力1.2倍' },
  { name: 'くろおび',           description: 'かくとうタイプ技の威力1.2倍' },
  { name: 'どくバリ',           description: 'どくタイプ技の威力1.2倍' },
  { name: 'やわらかいすな',     description: 'じめんタイプ技の威力1.2倍' },
  { name: 'するどいくちばし',   description: 'ひこうタイプ技の威力1.2倍（くちばしのみ）' },
  { name: 'ねじれスプーン',     description: 'エスパータイプ技の威力1.2倍' },
  { name: 'ぎんのこな',         description: 'むしタイプ技の威力1.2倍' },
  { name: 'かたいいし',         description: 'いわタイプ技の威力1.2倍' },
  { name: 'のろいのおふだ',     description: 'ゴーストタイプ技の威力1.2倍' },
  { name: 'りゅうのキバ',       description: 'ドラゴンタイプ技の威力1.2倍' },
  { name: 'くろいメガネ',       description: 'あくタイプ技の威力1.2倍' },
  { name: 'メタルコート',       description: 'はがねタイプ技の威力1.2倍' },
  { name: 'ようせいのはね',     description: 'フェアリータイプ技の威力1.2倍' },
  { name: 'ノーマルジュエル',   description: 'ノーマルタイプ技の威力1.3倍（1回限り）' },
  { name: 'とつげきチョッキ',   spDefMultiplier: 1.5, description: '変化技が使えなくなる' },
  { name: 'アッキのみ',         description: '物理技で被弾時に防御1段階アップ（1回限り）' },
  { name: 'ロゼルのみ',         description: '特殊技で被弾時に特防1段階アップ（1回限り）' },
  { name: 'ウイのみ',           description: 'HP 1/2以下で素早さ1段階アップ（1回限り）' },
  { name: 'サトシのきぼう',     description: '特殊' },
]

export const ITEM_MAP: Record<string, Item> = Object.fromEntries(
  ITEMS.map(i => [i.name, i])
)

export const ITEM_NAMES = ITEMS.map(i => i.name)
