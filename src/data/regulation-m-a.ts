/**
 * ポケモンチャンピオンズ 使用可能ポケモンリスト（レギュレーションM-A）
 * 出典: MetaVGC / Serebii / Bulbapedia / ゲームウィズ
 *
 * ゲーム内実装数: 通常ポケモン218種（地方変種含む）+ メガシンカ60種 = 合計278種
 * ただし以下9種は未実装: メガライチュウX/Y, メタグロス, オーロンゲ,
 *   ガチグマ, パーモット, ヘイラッシャ, シャリタツ, カミッチュ
 *
 * レギュレーション変更時はこのファイルのみ差し替えること。
 */

// ---------------------------------------------------------------------------
// 通常ポケモン（PokéAPIスラッグ）
// ---------------------------------------------------------------------------
export const REGULATION_POKEMON: string[] = [
  // ── 第一世代（カントー） ──────────────────────────
  'venusaur',              // フシギバナ
  'charizard',             // リザードン
  'blastoise',             // カメックス
  'beedrill',              // スピアー
  'pidgeot',               // ピジョット
  'arbok',                 // アーボック
  'pikachu',               // ピカチュウ
  'raichu',                // ライチュウ
  'raichu-alola',          // アローラライチュウ
  'clefable',              // ピクシー
  'ninetales',             // キュウコン
  'ninetales-alola',       // アローラキュウコン
  'arcanine',              // ウインディ
  'arcanine-hisui',        // ヒスイウインディ
  'alakazam',              // フーディン
  'machamp',               // カイリキー
  'victreebel',            // ウツボット
  'slowbro',               // ヤドラン
  'slowbro-galar',         // ガラルヤドラン
  'gengar',                // ゲンガー
  'kangaskhan',            // ガルーラ
  'starmie',               // スターミー
  'pinsir',                // カイロス
  'tauros',                // ケンタロス
  'tauros-paldea-combat-breed', // パルデアケンタロス（かくとう）
  'tauros-paldea-blaze-breed',  // パルデアケンタロス（ほのお）
  'tauros-paldea-aqua-breed',   // パルデアケンタロス（みず）
  'gyarados',              // ギャラドス
  'ditto',                 // メタモン
  'vaporeon',              // シャワーズ
  'jolteon',               // サンダース
  'flareon',               // ブースター
  'aerodactyl',            // プテラ
  'snorlax',               // カビゴン
  'dragonite',             // カイリュー

  // ── 第二世代（ジョウト） ──────────────────────────
  'meganium',              // メガニウム
  'typhlosion',            // バクフーン
  'typhlosion-hisui',      // ヒスイバクフーン
  'feraligatr',            // オーダイル
  'ariados',               // アリアドス
  'ampharos',              // デンリュウ
  'azumarill',             // マリルリ
  'politoed',              // ニョロトノ
  'espeon',                // エーフィ
  'umbreon',               // ブラッキー
  'slowking',              // ヤドキング
  'slowking-galar',        // ガラルヤドキング
  'forretress',            // フォレトス
  'steelix',               // ハガネール
  'scizor',                // ハッサム
  'heracross',             // ヘラクロス
  'skarmory',              // エアームド
  'houndoom',              // ヘルガー
  'tyranitar',             // バンギラス

  // ── 第三世代（ホウエン） ──────────────────────────
  'pelipper',              // ペリッパー
  'gardevoir',             // サーナイト
  'sableye',               // ヤミラミ
  'aggron',                // ボスゴドラ
  'medicham',              // チャーレム
  'manectric',             // ライボルト
  'sharpedo',              // サメハダー
  'camerupt',              // バクーダ
  'torkoal',               // コータス
  'altaria',               // チルタリス
  'milotic',               // ミロカロス
  'castform',              // ポワルン
  'castform-rainy',        // ポワルン（あまみずのすがた）
  'castform-sunny',        // ポワルン（たいようのすがた）
  'castform-snowy',        // ポワルン（ゆきぐものすがた）
  'banette',               // ジュペッタ
  'chimecho',              // チリーン
  'absol',                 // アブソル
  'glalie',                // オニゴーリ

  // ── 第四世代（シンオウ） ──────────────────────────
  'torterra',              // ドダイトス
  'infernape',             // ゴウカザル
  'empoleon',              // エンペルト
  'luxray',                // レントラー
  'roserade',              // ロズレイド
  'rampardos',             // ラムパルド
  'bastiodon',             // トリデプス
  'lopunny',               // ミミロップ
  'spiritomb',             // ミカルゲ
  'garchomp',              // ガブリアス
  'lucario',               // ルカリオ
  'hippowdon',             // カバルドン
  'toxicroak',             // ドクロッグ
  'abomasnow',             // ユキノオー
  'weavile',               // マニューラ
  'rhyperior',             // ドサイドン
  'leafeon',               // リーフィア
  'glaceon',               // グレイシア
  'gliscor',               // グライオン
  'mamoswine',             // マンムー
  'gallade',               // エルレイド
  'froslass',              // ユキメノコ
  'rotom',                 // ロトム
  'rotom-heat',            // ヒートロトム
  'rotom-wash',            // ウォッシュロトム
  'rotom-frost',           // フロストロトム
  'rotom-fan',             // スピンロトム
  'rotom-mow',             // カットロトム

  // ── 第五世代（イッシュ） ──────────────────────────
  'serperior',             // ジャローダ
  'emboar',                // エンブオー
  'samurott',              // ダイケンキ
  'samurott-hisui',        // ヒスイダイケンキ
  'watchog',               // ミルホッグ
  'liepard',               // レパルダス
  'simisage',              // ヤナッキー
  'simisear',              // バオッキー
  'simipour',              // ヒヤッキー
  'excadrill',             // ドリュウズ
  'audino',                // タブンネ
  'conkeldurr',            // ローブシン
  'whimsicott',            // エルフーン
  'krookodile',            // ワルビアル
  'cofagrigus',            // デスカーン
  'garbodor',              // ダストダス
  'zoroark',               // ゾロアーク
  'zoroark-hisui',         // ヒスイゾロアーク
  'reuniclus',             // ランクルス
  'vanilluxe',             // バイバニラ
  'emolga',                // エモンガ
  'chandelure',            // シャンデラ
  'beartic',               // ツンベアー
  'stunfisk',              // マッギョ
  'stunfisk-galar',        // ガラルマッギョ
  'golurk',                // ゴルーグ
  'hydreigon',             // サザンドラ
  'volcarona',             // ウルガモス

  // ── 第六世代（カロス） ──────────────────────────
  'chesnaught',            // ブリガロン
  'delphox',               // マフォクシー
  'greninja',              // ゲッコウガ
  'diggersby',             // ホルード
  'talonflame',            // ファイアロー
  'vivillon',              // ビビヨン
  'floette',               // フラエッテ
  'florges',               // フラージェス
  'pangoro',               // ゴロンダ
  'furfrou',               // トリミアン
  'meowstic-male',         // ニャオニクス（オス）
  'meowstic-female',       // ニャオニクス（メス）
  'aegislash-shield',      // ギルガルド（シールドフォルム）
  'aromatisse',            // アロマティッセ
  'slurpuff',              // ペロリーム
  'clawitzer',             // ブロスター
  'heliolisk',             // エレザード
  'tyrantrum',             // ガチゴラス
  'aurorus',               // アマルルガ
  'sylveon',               // ニンフィア
  'hawlucha',              // ルチャブル
  'dedenne',               // デデンネ
  'goodra',                // ヌメルゴン
  'goodra-hisui',          // ヒスイヌメルゴン
  'klefki',                // クレッフィ
  'trevenant',             // オーロット
  'gourgeist-average',     // パンプジン
  'avalugg',               // クレベース
  'noivern',               // オンバーン

  // ── 第七世代（アローラ） ──────────────────────────
  'decidueye',             // ジュナイパー
  'decidueye-hisui',       // ヒスイジュナイパー
  'incineroar',            // ガオガエン
  'primarina',             // アシレーヌ
  'toucannon',             // ドデカバシ
  'crabominable',          // ケケンカニ
  'lycanroc-midday',       // ルガルガン（まひるのすがた）
  'lycanroc-midnight',     // ルガルガン（まよなかのすがた）
  'lycanroc-dusk',         // ルガルガン（たそがれのすがた）
  'toxapex',               // ドヒドイデ
  'mudsdale',              // バンバドロ
  'araquanid',             // オニシズクモ
  'salazzle',              // エンニュート
  'tsareena',              // アマージョ
  'oranguru',              // ヤレユータン
  'passimian',             // ナゲツケサル
  'mimikyu-disguised',     // ミミッキュ
  'drampa',                // ジジーロン
  'kommo-o',               // ジャラランガ

  // ── 第八世代（ガラル・ヒスイ） ──────────────────────────
  'corviknight',           // アーマーガア
  'flapple',               // アップリュー
  'appletun',              // タルップル
  'sandaconda',            // サダイジャ
  'polteageist',           // ポットデス
  'hatterene',             // ブリムオン
  'mr-rime',               // バリコオル
  'runerigus',             // デスバーン
  'alcremie',              // マホイップ
  'morpeko-full-belly',    // モルペコ
  'dragapult',             // ドラパルト
  'wyrdeer',               // アヤシシ
  'kleavor',               // バサギリ
  'basculegion-male',      // イダイトウ（オス）
  'basculegion-female',    // イダイトウ（メス）
  'sneasler',              // オオニューラ

  // ── 第九世代（パルデア） ──────────────────────────
  'meowscarada',           // マスカーニャ
  'skeledirge',            // ラウドボーン
  'quaquaval',             // ウェーニバル
  'maushold-family-of-three', // イッカネズミ（3匹家族）
  'maushold-family-of-four', // イッカネズミ（4匹家族）
  'garganacl',             // キョジオーン
  'armarouge',             // グレンアルマ
  'ceruledge',             // ソウブレイズ
  'bellibolt',             // ハラバリー
  'scovillain',            // スコヴィラン
  'espathra',              // クエスパトラ
  'tinkaton',              // デカヌチャン
  'palafin-zero',          // イルカマン（ナイーブフォルム）
  'palafin-hero',          // イルカマン（マイティフォルム）
  'orthworm',              // ミミズズ
  'glimmora',              // キラフロル
  'farigiraf',             // リキキリン
  'kingambit',             // ドドゲザン
  'sinistcha',             // ヤバソチャ
  'archaludon',            // ブリジュラス
  // 'hydrapple',          // カミッチュ（※GameWith情報では未実装）

  // ── ベースポケモン（メガ進化専用・本体リスト補完） ──────────────────────────
  'ferrothorn',            // ナットレイ（メガナットレイのベース）
  'salamence',             // ボーマンダ（メガボーマンダのベース）
  'rayquaza',              // レックウザ（メガレックウザのベース）
  'latias',                // ラティアス（メガラティアスのベース）
  'latios',                // ラティオス（メガラティオスのベース）
]

// ---------------------------------------------------------------------------
// メガ進化形態（PokéAPIに存在するもの）
// ---------------------------------------------------------------------------
export const MEGA_FORMS: string[] = [
  // 第一世代
  'venusaur-mega',         // メガフシギバナ
  'charizard-mega-x',      // メガリザードン(X)
  'charizard-mega-y',      // メガリザードン(Y)
  'blastoise-mega',        // メガカメックス
  'beedrill-mega',         // メガスピアー
  'pidgeot-mega',          // メガピジョット
  'alakazam-mega',         // メガフーディン
  'slowbro-mega',          // メガヤドラン
  'gengar-mega',           // メガゲンガー
  'kangaskhan-mega',       // メガガルーラ
  'pinsir-mega',           // メガカイロス
  'gyarados-mega',         // メガギャラドス
  'aerodactyl-mega',       // メガプテラ
  // 第二世代
  'ampharos-mega',         // メガデンリュウ
  'scizor-mega',           // メガハッサム
  'heracross-mega',        // メガヘラクロス
  'houndoom-mega',         // メガヘルガー
  'tyranitar-mega',        // メガバンギラス
  // 第三世代
  'gardevoir-mega',        // メガサーナイト
  'sableye-mega',          // メガヤミラミ
  'aggron-mega',           // メガボスゴドラ
  'medicham-mega',         // メガチャーレム
  'manectric-mega',        // メガライボルト
  'sharpedo-mega',         // メガサメハダー
  'camerupt-mega',         // メガバクーダ
  'altaria-mega',          // メガチルタリス
  'banette-mega',          // メガジュペッタ
  'absol-mega',            // メガアブソル
  'glalie-mega',           // メガオニゴーリ
  // 第四世代
  'garchomp-mega',         // メガガブリアス
  'lucario-mega',          // メガルカリオ
  'abomasnow-mega',        // メガユキノオー
  'lopunny-mega',          // メガミミロップ
  'gallade-mega',          // メガエルレイド
  'steelix-mega',          // メガハガネール
  // 第六世代（伝説）
  'latias-mega',           // メガラティアス
  'latios-mega',           // メガラティオス
  'rayquaza-mega',         // メガレックウザ
  // その他
  'salamence-mega',        // メガボーマンダ
  'audino-mega',           // メガタブンネ
]

// ---------------------------------------------------------------------------
// ポケモンチャンピオンズ独自メガ進化（PokéAPIに存在しない）
// タイプ・ステータスは別途ハードコード対応予定
// ---------------------------------------------------------------------------
export const CHAMPIONS_EXCLUSIVE_MEGAS: { slug: string; jaName: string; base: string }[] = [
  { slug: 'victreebel-mega',       jaName: 'メガウツボット',         base: 'victreebel' },
  { slug: 'skarmory-mega',         jaName: 'メガエアームド',         base: 'skarmory' },
  { slug: 'emboar-mega',           jaName: 'メガエンブオー',         base: 'emboar' },
  { slug: 'feraligatr-mega',       jaName: 'メガオーダイル',         base: 'feraligatr' },
  { slug: 'dragonite-mega',        jaName: 'メガカイリュー',         base: 'dragonite' },
  { slug: 'greninja-mega',         jaName: 'メガゲッコウガ',         base: 'greninja' },
  { slug: 'golurk-mega',           jaName: 'メガゴルーグ',           base: 'golurk' },
  { slug: 'chandelure-mega',       jaName: 'メガシャンデラ',         base: 'chandelure' },
  { slug: 'serperior-mega',        jaName: 'メガジャローダ',         base: 'serperior' },
  { slug: 'cofagrigus-mega',       jaName: 'メガデスカーン',         base: 'cofagrigus' },
  { slug: 'furfrou-mega',          jaName: 'メガトリミアン',         base: 'furfrou' },
  { slug: 'ferrothorn-mega',       jaName: 'メガナットレイ',         base: 'ferrothorn' },
  { slug: 'meowstic-mega-male',    jaName: 'メガニャオニクス(オス)', base: 'meowstic-male' },
  { slug: 'meowstic-mega-female',  jaName: 'メガニャオニクス(メス)', base: 'meowstic-female' },
  { slug: 'mamoswine-mega',        jaName: 'メガマンムー',           base: 'mamoswine' },
  // 以下は未確認・要検証（ゲーム内60種に対し上記で55種のため残り5種が存在するはず）
  // { slug: 'meganium-mega',      jaName: 'メガメガニウム',         base: 'meganium' },
  // { slug: 'luxray-mega',        jaName: 'メガレントラー',         base: 'luxray' },
]

/** 開発時の少数サブセット */
export const DEV_SUBSET_IDS: number[] = [6, 9, 3, 25, 149, 212, 248, 445, 642, 150]
