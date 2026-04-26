# pokechan-tool

ぽけちゃん対戦用サポートツール（React + TypeScript + Vite）。

## 機能

- **ダメージ計算** — 攻撃側・防御側のパーティを入力してダメージ範囲を計算
- **素早さ比較** — S実数値・アイテム・状態を考慮した行動順の確認
- **タイプ相性表** — 攻撃/防御両面の相性を一覧表示
- **パーティ共有** — URLにパーティをエンコードして共有

## セットアップ

```bash
npm install      # 依存パッケージのインストール
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm test         # テスト実行
npm run build    # 本番ビルド（dist/ に出力）
```

## レギュレーション変更時の編集箇所

### 使用可能ポケモンが変わったとき

`src/data/regulation-m-a.ts`

`REGULATION_MA_POKEMON` 配列に図鑑番号（`dexNumber`）を追加・削除する。

```ts
export const REGULATION_MA_POKEMON: RegulationEntry[] = [
  { dexNumber: 1,   name: 'フシギダネ' },
  // ↑ ここに追加・削除
];
```

### タイプ相性が変わったとき（ほぼないが）

`src/data/type-chart.ts` の `TYPE_CHART` オブジェクトを編集する。

### 新しい技を追加したいとき

`src/data/moves.ts` の `HARDCODED_MOVES` 配列に追記する。PokeAPIにない技や、ぽけちゃん独自の調整がある技はここで管理する。

## ぽけちゃん固有ルール

| 項目 | ぽけちゃんルール |
|------|----------------|
| 個体値 | 常に31固定（入力不要） |
| メガシンカ | 使用可能 |
| テラスタル / ダイマックス | 使用不可 |
| まひ（行動不能率） | 12.5%（本家25%と異なる） |
| こおり（回復確率） | 毎ターン25%、かつ **3ターン目に必ず回復** |
| TOD（時間切れ引き分け） | 引き分け扱い・レート変動なし |
