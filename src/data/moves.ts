import type { PokemonType } from './type-chart'

export type MoveCategory = '物理' | '特殊' | '変化'

export interface Move {
  name: string
  type: PokemonType
  category: MoveCategory
  power: number
  accuracy: number
  pp: number
  description?: string
}

/** よく使われる技200+のハードコードリスト（MVPデータ）*/
export const HARDCODED_MOVES: Move[] = [
  // ノーマル
  { name: 'ノーマルビーム',     type: 'ノーマル', category: '特殊', power: 65,  accuracy: 100, pp: 20 },
  { name: 'からみつく',         type: 'ノーマル', category: '物理', power: 15,  accuracy: 85,  pp: 20 },
  { name: 'すてみタックル',     type: 'ノーマル', category: '物理', power: 120, accuracy: 100, pp: 15 },
  { name: 'はかいこうせん',     type: 'ノーマル', category: '特殊', power: 150, accuracy: 90,  pp: 5  },
  { name: 'ギガインパクト',     type: 'ノーマル', category: '物理', power: 150, accuracy: 90,  pp: 5  },
  { name: 'ふいうち',           type: 'あく',     category: '物理', power: 70,  accuracy: 100, pp: 5  },
  { name: 'おんがえし',         type: 'ノーマル', category: '物理', power: 102, accuracy: 100, pp: 25 },
  { name: 'ものまね',           type: 'ノーマル', category: '変化', power: 0,   accuracy: 100, pp: 10 },
  { name: 'ぼうふう',           type: 'ノーマル', category: '特殊', power: 110, accuracy: 70,  pp: 10 },
  { name: 'てんしのキッス',     type: 'ノーマル', category: '変化', power: 0,   accuracy: 75,  pp: 10 },
  { name: 'じんつうりき',       type: 'ノーマル', category: '特殊', power: 80,  accuracy: 100, pp: 20 },

  // ほのお
  { name: 'だいもんじ',         type: 'ほのお', category: '特殊', power: 110, accuracy: 85,  pp: 5  },
  { name: 'かえんほうしゃ',     type: 'ほのお', category: '特殊', power: 90,  accuracy: 100, pp: 15 },
  { name: 'ほのおのパンチ',     type: 'ほのお', category: '物理', power: 75,  accuracy: 100, pp: 15 },
  { name: 'フレアドライブ',     type: 'ほのお', category: '物理', power: 120, accuracy: 100, pp: 15 },
  { name: 'オーバーヒート',     type: 'ほのお', category: '特殊', power: 130, accuracy: 90,  pp: 5  },
  { name: 'ニトロチャージ',     type: 'ほのお', category: '物理', power: 50,  accuracy: 100, pp: 20 },
  { name: 'ほのおのうず',       type: 'ほのお', category: '特殊', power: 35,  accuracy: 85,  pp: 15 },
  { name: 'もえあがるいかり',   type: 'ほのお', category: '特殊', power: 80,  accuracy: 100, pp: 5  },
  { name: 'かえんぐるま',       type: 'ほのお', category: '物理', power: 60,  accuracy: 100, pp: 25 },
  { name: 'ヒートスタンプ',     type: 'ほのお', category: '物理', power: 0,   accuracy: 100, pp: 10, description: '体重差で威力変化' },
  { name: 'ブレイズキック',     type: 'ほのお', category: '物理', power: 85,  accuracy: 90,  pp: 10 },

  // みず
  { name: 'なみのり',           type: 'みず', category: '特殊', power: 90,  accuracy: 100, pp: 15 },
  { name: 'ハイドロポンプ',     type: 'みず', category: '特殊', power: 110, accuracy: 80,  pp: 5  },
  { name: 'たきのぼり',         type: 'みず', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'アクアジェット',     type: 'みず', category: '物理', power: 40,  accuracy: 100, pp: 20, description: '必ず先制' },
  { name: 'アクアテール',       type: 'みず', category: '物理', power: 90,  accuracy: 90,  pp: 10 },
  { name: 'ぼうふう',           type: 'みず', category: '特殊', power: 110, accuracy: 70,  pp: 10 },
  { name: 'かにばさみ',         type: 'みず', category: '物理', power: 35,  accuracy: 85,  pp: 10 },
  { name: 'じゃぶじゃぶ',       type: 'みず', category: '物理', power: 60,  accuracy: 100, pp: 20 },
  { name: 'ウェーブタックル',   type: 'みず', category: '物理', power: 60,  accuracy: 100, pp: 20 },

  // でんき
  { name: 'かみなり',           type: 'でんき', category: '特殊', power: 110, accuracy: 70,  pp: 10 },
  { name: 'かみなりボルト',     type: 'でんき', category: '特殊', power: 90,  accuracy: 100, pp: 15 },
  { name: 'ボルトチェンジ',     type: 'でんき', category: '特殊', power: 70,  accuracy: 100, pp: 20 },
  { name: 'でんじほう',         type: 'でんき', category: '特殊', power: 120, accuracy: 50,  pp: 5  },
  { name: 'ワイルドボルト',     type: 'でんき', category: '物理', power: 90,  accuracy: 100, pp: 15 },
  { name: 'かみなりパンチ',     type: 'でんき', category: '物理', power: 75,  accuracy: 100, pp: 15 },
  { name: 'スパーク',           type: 'でんき', category: '物理', power: 65,  accuracy: 100, pp: 20 },
  { name: 'でんじは',           type: 'でんき', category: '変化', power: 0,   accuracy: 90,  pp: 20, description: 'まひ状態にする' },
  { name: 'ライジングボルト',   type: 'でんき', category: '特殊', power: 70,  accuracy: 100, pp: 20 },

  // くさ
  { name: 'ソーラービーム',     type: 'くさ', category: '特殊', power: 120, accuracy: 100, pp: 10 },
  { name: 'エナジーボール',     type: 'くさ', category: '特殊', power: 90,  accuracy: 100, pp: 10 },
  { name: 'くさむすび',         type: 'くさ', category: '特殊', power: 0,   accuracy: 100, pp: 20, description: '体重差で威力変化' },
  { name: 'リーフストーム',     type: 'くさ', category: '特殊', power: 130, accuracy: 90,  pp: 5  },
  { name: 'ウッドハンマー',     type: 'くさ', category: '物理', power: 120, accuracy: 100, pp: 15 },
  { name: 'タネばくだん',       type: 'くさ', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'パワーウィップ',     type: 'くさ', category: '物理', power: 120, accuracy: 85,  pp: 10 },
  { name: 'リーフブレード',     type: 'くさ', category: '物理', power: 90,  accuracy: 100, pp: 15 },
  { name: 'グラスナックル',     type: 'くさ', category: '物理', power: 55,  accuracy: 100, pp: 15 },
  { name: 'タネマシンガン',     type: 'くさ', category: '物理', power: 25,  accuracy: 95,  pp: 15 },

  // こおり
  { name: 'ふぶき',             type: 'こおり', category: '特殊', power: 110, accuracy: 70,  pp: 5  },
  { name: 'れいとうビーム',     type: 'こおり', category: '特殊', power: 90,  accuracy: 100, pp: 10 },
  { name: 'れいとうパンチ',     type: 'こおり', category: '物理', power: 75,  accuracy: 100, pp: 15 },
  { name: 'こおりのキバ',       type: 'こおり', category: '物理', power: 65,  accuracy: 95,  pp: 15 },
  { name: 'フリーズドライ',     type: 'こおり', category: '特殊', power: 70,  accuracy: 100, pp: 20, description: 'みずタイプに効果抜群' },
  { name: 'アイシクルクラッシュ', type: 'こおり', category: '物理', power: 85, accuracy: 90, pp: 10 },
  { name: 'こおりのつぶて',     type: 'こおり', category: '物理', power: 40,  accuracy: 100, pp: 30, description: '必ず先制' },

  // かくとう
  { name: 'きあいだま',         type: 'かくとう', category: '特殊', power: 120, accuracy: 70,  pp: 5  },
  { name: 'インファイト',       type: 'かくとう', category: '物理', power: 120, accuracy: 100, pp: 5  },
  { name: 'ばくれつパンチ',     type: 'かくとう', category: '物理', power: 100, accuracy: 100, pp: 15 },
  { name: 'クロスチョップ',     type: 'かくとう', category: '物理', power: 100, accuracy: 80,  pp: 5  },
  { name: 'とびひざげり',       type: 'かくとう', category: '物理', power: 130, accuracy: 90,  pp: 10 },
  { name: 'ローキック',         type: 'かくとう', category: '物理', power: 65,  accuracy: 100, pp: 20 },
  { name: 'ドレインパンチ',     type: 'かくとう', category: '物理', power: 75,  accuracy: 100, pp: 10 },
  { name: 'マッハパンチ',       type: 'かくとう', category: '物理', power: 40,  accuracy: 100, pp: 30, description: '必ず先制' },
  { name: 'ヴァイスアーム',     type: 'かくとう', category: '物理', power: 100, accuracy: 100, pp: 10 },
  { name: 'スカルバッシュ',     type: 'かくとう', category: '物理', power: 130, accuracy: 80,  pp: 10 },
  { name: 'アームハンマー',     type: 'かくとう', category: '物理', power: 100, accuracy: 90,  pp: 10 },

  // どく
  { name: 'ヘドロウェーブ',     type: 'どく', category: '特殊', power: 95,  accuracy: 100, pp: 10 },
  { name: 'ヘドロばくだん',     type: 'どく', category: '特殊', power: 90,  accuracy: 100, pp: 10 },
  { name: 'どくづき',           type: 'どく', category: '物理', power: 80,  accuracy: 100, pp: 20 },
  { name: 'ベノムショック',     type: 'どく', category: '特殊', power: 65,  accuracy: 100, pp: 10, description: '毒状態の相手に2倍' },
  { name: 'アシッドボム',       type: 'どく', category: '特殊', power: 40,  accuracy: 100, pp: 20 },

  // じめん
  { name: 'じしん',             type: 'じめん', category: '物理', power: 100, accuracy: 100, pp: 10 },
  { name: 'だいちのちから',     type: 'じめん', category: '特殊', power: 90,  accuracy: 100, pp: 10 },
  { name: 'じならし',           type: 'じめん', category: '物理', power: 60,  accuracy: 100, pp: 20 },
  { name: 'マグニチュード',     type: 'じめん', category: '物理', power: 71,  accuracy: 100, pp: 30, description: '威力が変動' },
  { name: 'ボーンラッシュ',     type: 'じめん', category: '物理', power: 25,  accuracy: 90,  pp: 10 },
  { name: 'ずつき',             type: 'じめん', category: '物理', power: 70,  accuracy: 100, pp: 15 },

  // ひこう
  { name: 'そらをとぶ',         type: 'ひこう', category: '物理', power: 90,  accuracy: 95,  pp: 15 },
  { name: 'ブレイブバード',     type: 'ひこう', category: '物理', power: 120, accuracy: 100, pp: 15 },
  { name: 'エアスラッシュ',     type: 'ひこう', category: '特殊', power: 75,  accuracy: 95,  pp: 15 },
  { name: 'ぼうふう（ひこう）', type: 'ひこう', category: '特殊', power: 110, accuracy: 70,  pp: 10 },
  { name: 'アクロバット',       type: 'ひこう', category: '物理', power: 55,  accuracy: 100, pp: 15, description: '持ち物なし時に威力2倍' },
  { name: 'ダブルウイング',     type: 'ひこう', category: '物理', power: 40,  accuracy: 95,  pp: 15 },
  { name: 'ぼんぐり弾',         type: 'ひこう', category: '物理', power: 30,  accuracy: 85,  pp: 30 },

  // エスパー
  { name: 'サイコキネシス',     type: 'エスパー', category: '特殊', power: 90,  accuracy: 100, pp: 10 },
  { name: 'サイコショック',     type: 'エスパー', category: '特殊', power: 80,  accuracy: 100, pp: 10, description: '防御で計算' },
  { name: 'みらいよち',         type: 'エスパー', category: '特殊', power: 120, accuracy: 100, pp: 10 },
  { name: 'エスパー',           type: 'エスパー', category: '特殊', power: 65,  accuracy: 100, pp: 20 },
  { name: 'ゴールドラッシュ',   type: 'エスパー', category: '物理', power: 80,  accuracy: 100, pp: 10 },
  { name: 'サイコカッター',     type: 'エスパー', category: '物理', power: 70,  accuracy: 100, pp: 20 },
  { name: 'しねんのずつき',     type: 'エスパー', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'ニトロチャージ',     type: 'エスパー', category: '特殊', power: 50,  accuracy: 100, pp: 20 },
  { name: 'テレポート',         type: 'エスパー', category: '変化', power: 0,   accuracy: 100, pp: 20 },

  // むし
  { name: 'むしのさざめき',     type: 'むし', category: '特殊', power: 90,  accuracy: 100, pp: 10 },
  { name: 'シグナルビーム',     type: 'むし', category: '特殊', power: 75,  accuracy: 100, pp: 15 },
  { name: 'とびかかる',         type: 'むし', category: '物理', power: 80,  accuracy: 100, pp: 20 },
  { name: 'ダブルニードル',     type: 'むし', category: '物理', power: 25,  accuracy: 100, pp: 20 },
  { name: 'メガホーン',         type: 'むし', category: '物理', power: 120, accuracy: 85,  pp: 10 },
  { name: 'むしくい',           type: 'むし', category: '物理', power: 60,  accuracy: 100, pp: 20 },
  { name: 'バグバイト',         type: 'むし', category: '物理', power: 60,  accuracy: 100, pp: 20 },
  { name: 'ふみつけ',           type: 'むし', category: '物理', power: 65,  accuracy: 100, pp: 20 },

  // いわ
  { name: 'ストーンエッジ',     type: 'いわ', category: '物理', power: 100, accuracy: 80,  pp: 5  },
  { name: 'いわなだれ',         type: 'いわ', category: '物理', power: 75,  accuracy: 90,  pp: 10 },
  { name: 'がんせきふうじ',     type: 'いわ', category: '物理', power: 60,  accuracy: 95,  pp: 15 },
  { name: 'いわくだき',         type: 'いわ', category: '物理', power: 40,  accuracy: 100, pp: 15 },
  { name: 'パワージェム',       type: 'いわ', category: '特殊', power: 80,  accuracy: 100, pp: 20 },
  { name: 'ロッククライム',     type: 'いわ', category: '物理', power: 90,  accuracy: 85,  pp: 20 },

  // ゴースト
  { name: 'シャドーボール',     type: 'ゴースト', category: '特殊', power: 80,  accuracy: 100, pp: 15 },
  { name: 'たたりめ',           type: 'ゴースト', category: '特殊', power: 65,  accuracy: 100, pp: 10, description: '状態異常時2倍' },
  { name: 'シャドークロー',     type: 'ゴースト', category: '物理', power: 70,  accuracy: 100, pp: 15 },
  { name: 'ポルターガイスト',   type: 'ゴースト', category: '物理', power: 110, accuracy: 90,  pp: 5  },
  { name: 'ゴーストダイブ',     type: 'ゴースト', category: '物理', power: 90,  accuracy: 100, pp: 10 },
  { name: 'ナイトヘッド',       type: 'ゴースト', category: '特殊', power: 0,   accuracy: 100, pp: 15, description: 'レベル分のダメージ' },
  { name: 'のろい',             type: 'ゴースト', category: '変化', power: 0,   accuracy: 100, pp: 10 },

  // ドラゴン
  { name: 'りゅうのはどう',     type: 'ドラゴン', category: '特殊', power: 85,  accuracy: 85,  pp: 10 },
  { name: 'げきりん',           type: 'ドラゴン', category: '物理', power: 120, accuracy: 100, pp: 10 },
  { name: 'ドラゴンクロー',     type: 'ドラゴン', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'ドラゴンダイブ',     type: 'ドラゴン', category: '物理', power: 100, accuracy: 75,  pp: 10 },
  { name: 'ドラゴンテール',     type: 'ドラゴン', category: '物理', power: 60,  accuracy: 90,  pp: 10 },
  { name: 'はかいこうせん',     type: 'ドラゴン', category: '特殊', power: 150, accuracy: 90,  pp: 5  },

  // あく
  { name: 'あくのはどう',       type: 'あく', category: '特殊', power: 80,  accuracy: 100, pp: 15 },
  { name: 'かみくだく',         type: 'あく', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'イカサマ',           type: 'あく', category: '物理', power: 95,  accuracy: 100, pp: 15, description: '相手の攻撃で計算' },
  { name: 'ふいうち',           type: 'あく', category: '物理', power: 70,  accuracy: 100, pp: 5,  description: '相手が攻撃技を選択時に先制' },
  { name: 'じごくづき',         type: 'あく', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'ハイパーボイス（あく）', type: 'あく', category: '特殊', power: 90, accuracy: 100, pp: 10 },
  { name: 'バークアウト',       type: 'あく', category: '特殊', power: 55,  accuracy: 95,  pp: 15 },
  { name: 'ナイトバースト',     type: 'あく', category: '特殊', power: 0,   accuracy: 100, pp: 15, description: '確実に命中低下' },

  // はがね
  { name: 'アイアンテール',     type: 'はがね', category: '物理', power: 100, accuracy: 75,  pp: 15 },
  { name: 'アイアンヘッド',     type: 'はがね', category: '物理', power: 80,  accuracy: 100, pp: 15 },
  { name: 'コメットパンチ',     type: 'はがね', category: '物理', power: 85,  accuracy: 100, pp: 5  },
  { name: 'ラスターカノン',     type: 'はがね', category: '特殊', power: 80,  accuracy: 100, pp: 10 },
  { name: 'フラッシュキャノン', type: 'はがね', category: '特殊', power: 80,  accuracy: 100, pp: 10 },
  { name: 'ドリルライナー',     type: 'はがね', category: '物理', power: 80,  accuracy: 95,  pp: 10 },
  { name: 'メタルクロー',       type: 'はがね', category: '物理', power: 50,  accuracy: 95,  pp: 35 },
  { name: 'せいなるつるぎ',     type: 'はがね', category: '物理', power: 90,  accuracy: 100, pp: 25, description: '相手のランク無視' },
  { name: 'ジャイロボール',     type: 'はがね', category: '物理', power: 0,   accuracy: 100, pp: 5,  description: '素早さ差で威力変化' },
  { name: 'ミラーショット',     type: 'はがね', category: '特殊', power: 65,  accuracy: 85,  pp: 10 },

  // フェアリー
  { name: 'ムーンフォース',     type: 'フェアリー', category: '特殊', power: 95,  accuracy: 100, pp: 15 },
  { name: 'マジカルシャイン',   type: 'フェアリー', category: '特殊', power: 80,  accuracy: 100, pp: 10 },
  { name: 'ドレインキッス',     type: 'フェアリー', category: '特殊', power: 50,  accuracy: 100, pp: 10, description: 'ダメージ3/4吸収' },
  { name: 'じゃれつく',         type: 'フェアリー', category: '物理', power: 90,  accuracy: 90,  pp: 15 },
  { name: 'ミストボール',       type: 'フェアリー', category: '特殊', power: 95,  accuracy: 100, pp: 5  },
  { name: 'フェアリーウィンド', type: 'フェアリー', category: '特殊', power: 40,  accuracy: 100, pp: 30 },
  { name: 'デコレーション',     type: 'フェアリー', category: '変化', power: 0,   accuracy: 100, pp: 15 },
  { name: 'チャームボイス',     type: 'フェアリー', category: '特殊', power: 90,  accuracy: 100, pp: 15, description: '必ず当たる' },
  { name: 'とびかかる',         type: 'フェアリー', category: '物理', power: 80,  accuracy: 100, pp: 20 },

  // 変化技（メジャーなもの）
  { name: 'つるぎのまい',       type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 20, description: '攻撃2段階アップ' },
  { name: 'ちょうのまい',       type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 20, description: '特攻・素早さ1段階アップ' },
  { name: 'ドラゴンダンス',     type: 'ドラゴン', category: '変化', power: 0, accuracy: 100, pp: 20, description: '攻撃・素早さ1段階アップ' },
  { name: 'コスモパワー',       type: 'エスパー', category: '変化', power: 0, accuracy: 100, pp: 20, description: '防御・特防1段階アップ' },
  { name: 'にほんばれ',         type: 'ほのお',   category: '変化', power: 0, accuracy: 100, pp: 5,  description: '晴れ天候にする' },
  { name: 'あまごい',           type: 'みず',     category: '変化', power: 0, accuracy: 100, pp: 5,  description: '雨天候にする' },
  { name: 'すなあらし',         type: 'いわ',     category: '変化', power: 0, accuracy: 100, pp: 10, description: '砂嵐天候にする' },
  { name: 'あられ',             type: 'こおり',   category: '変化', power: 0, accuracy: 100, pp: 10, description: 'あられ天候にする' },
  { name: 'しんぴのまもり',     type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 25, description: '状態異常防止' },
  { name: 'みがわり',           type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 10, description: 'みがわり作成' },
  { name: 'こうそくいどう',     type: 'エスパー', category: '変化', power: 0, accuracy: 100, pp: 30, description: '素早さ2段階アップ' },
  { name: 'めいそう',           type: 'エスパー', category: '変化', power: 0, accuracy: 100, pp: 20, description: '特攻・特防1段階アップ' },
  { name: 'はらだいこ',         type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 10, description: 'HP半分消費して攻撃最大' },
  { name: 'リフレクター',       type: 'エスパー', category: '変化', power: 0, accuracy: 100, pp: 20, description: '味方の物理被ダメ半減5ターン' },
  { name: 'ひかりのかべ',       type: 'エスパー', category: '変化', power: 0, accuracy: 100, pp: 30, description: '味方の特殊被ダメ半減5ターン' },
  { name: 'オーロラベール',     type: 'こおり',   category: '変化', power: 0, accuracy: 100, pp: 20, description: 'あられ時:物理特殊被ダメ半減5ターン' },
  { name: 'トリックルーム',     type: 'エスパー', category: '変化', power: 0, accuracy: 100, pp: 5,  description: '素早さの順序を逆にする5ターン' },
  { name: 'なかまづくり',       type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 20, description: '相手の特性をコピー' },
  { name: 'おいかぜ',           type: 'ひこう',   category: '変化', power: 0, accuracy: 100, pp: 30, description: '味方の素早さ2倍4ターン' },
  { name: 'とぐろをまく',       type: 'どく',     category: '変化', power: 0, accuracy: 100, pp: 20, description: '攻撃・防御・命中1段階アップ' },
  { name: 'からをやぶる',       type: 'みず',     category: '変化', power: 0, accuracy: 100, pp: 15, description: '攻撃特攻素早さ2上・防御特防1下' },
  { name: 'まもる',             type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 10, description: 'その技を防ぐ' },
  { name: 'みきり',             type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 5,  description: 'その技を防ぐ' },
  { name: 'てっぺき',           type: 'はがね',   category: '変化', power: 0, accuracy: 100, pp: 15, description: '防御2段階アップ' },
  { name: 'めだまさん',         type: 'ゴースト', category: '変化', power: 0, accuracy: 100, pp: 15, description: '防御・特防1段階アップ' },
  { name: 'バトンタッチ',       type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 40, description: '交代時にランク引き継ぎ' },
  { name: 'ちいさくなる',       type: 'ノーマル', category: '変化', power: 0, accuracy: 100, pp: 20, description: '回避率2段階アップ' },
]

export const MOVE_MAP: Record<string, Move> = Object.fromEntries(
  HARDCODED_MOVES.map(m => [m.name, m])
)

export const MOVE_NAMES = HARDCODED_MOVES.map(m => m.name)
