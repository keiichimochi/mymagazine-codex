# 実装中つまづいた点と解決方法

## 空プロジェクトだった

`/Users/k/github/mymagazine` は空ディレクトリで、Git管理下でもなかった。

### 解決

既存スタックに合わせる必要がなかったため、まずは依存なしの静的Webアプリとして作成した。これにより `index.html` を直接開くだけで動作確認できる。

## 「雑誌生成」ではなく「世界線エンジン」が必要

毎回ゼロから記事を生成すると設定がブレるため、単発記事生成アプリにすると企画の核を外す。

### 解決

初期実装では、ヒアリング回答から固定DB、ライター人格、年表、誌面テンプレートを作る構成にした。雑誌本文はこのDBから派生する出力として扱う。

## ブラウザ操作ルール

AGENTS.md 指示により、ブラウザ操作が必要な場合は agent-browser skill を使う必要がある。

### 解決

初期実装後の表示確認では agent-browser skill を使用する。

## モバイル幅で見出しが不自然に折り返した

2カラム用の見出しレイアウトをそのままモバイルに適用したため、「編集部ヒアリング」の末尾が1文字だけ次行に回った。

### 解決

520px以下ではセクション見出しを縦配置に変更し、見出し本文が十分な横幅を使えるようにした。

## Codex App Server は単発HTTP APIではなかった

参考記事の通り、Codex App Server は `initialize`、スレッド、ターン、アイテム通知を扱う JSON-RPC 風プロトコルだった。

### 解決

ブラウザから直接 App Server を触らず、`server.js` から `codex app-server` を子プロセスとして起動し、`codex-app-server-client.js` で JSONL over stdio を扱う構成にした。

## 構造化出力スキーマで `additionalProperties` エラーが出た

App Server 経由の構造化出力では、JSON Schema の各 object に `additionalProperties:false` が必要だった。柔軟なDBとして `additionalProperties:true` を使うと `invalid_json_schema` になった。

### 解決

世界線JSONの出力形を明示的に定義し、ネストした object すべてに `additionalProperties:false` を設定した。

## スキーマなしの世界線生成は長くなりすぎた

スキーマ強制を外すと、Codexが長いJSONを自由生成し、API応答が遅くなった。

### 解決

厳密スキーマを復活させ、App Server側に構造化出力を任せた。

## 画像プロンプトの構造化出力でトップレベル配列が拒否された

Codex App Server 経由の `response_format` では、トップレベルスキーマが `type:"object"` である必要があった。`type:"array"` を指定すると `invalid_json_schema` になった。

### 解決

App Server に渡す画像プロンプト出力を `{ "prompts": [...] }` に変更した。HTTP API のレスポンスは従来通り `prompts` 配列を返すため、UI側の呼び出し形は変えていない。

## 前回生成した世界線を再利用したい

毎回ヒアリングから生成し直すと、世界線エンジンの思想に反して設定が揺れやすい。

### 解決

サーバ利用時は `data/current-worldline.json` に保存し、`GET /api/worldline/current` で読み込むようにした。`file://` で直接開いている場合は `localStorage` に保存する。

## 年表編集を雑誌生成に効かせたい

雑誌本文だけを生成すると世界線DBから切り離され、号ごとの連続性が弱くなる。

### 解決

年表エディタで編集した `worldline.timeline` を保存し、雑誌生成時に対象年以前の出来事を `timelineDigest` と各ページ本文へ反映するようにした。雑誌は `data/magazines/YYYY-MM.json` に保存する。

## 雑誌ページがテキスト中心で本物の誌面らしくなかった

ページ本文だけをカードに並べると、ゲーム雑誌特有のスクリーンショット、ハード写真、広告、図解、キャプションの密度が出なかった。

### 解決

雑誌ページに `assets`、`callouts`、`scoreBox` を追加し、各ページに複数の画像枠とキャプション、欄外メモ、評価欄を表示するようにした。画像枠は現時点では生成プロンプト付きの誌面プレースホルダーで、実画像生成パイプラインに接続できる形にしている。

## Codex生成中に進捗が見えない

Codex App Serverへのリクエストは完了までHTTP応答が返らないため、画面上では固まって見えた。

### 解決

雑誌生成開始時にページ単位の進捗表示を開始し、「Nページ目を生成中」「全体のX%」を更新するようにした。API完了後は実際の雑誌ページ表示に差し替える。

## `.env.local` の扱いを間違えるとAPIキーが漏れる

画像生成に `GEMINI_API_KEY` が必要になったが、ローカルファイルをそのままGit管理すると機密情報が公開される。

### 解決

`.gitignore` に `.env`、`.env.local`、`.env*.local` を追加した。サーバー起動時だけ `.env.local` を読み込み、ログや画面には値を出さない。Vercelでは同じキーを環境変数として設定する。

## Gemini画像生成のレスポンスは画像ファイルではなくインラインデータ

Gemini API の `generateContent` は画像をHTTPファイルとして返すのではなく、レスポンス内の `inlineData.data` にbase64で返す。

### 解決

`/api/magazine/asset-image` で `inlineData` を取り出して `generated-images/YYYY-MM/` に保存し、雑誌JSONの `asset.imageUrl` にURLを追記する設計にした。

## Beepメガドライブ風に寄せすぎると実在誌面の複製になる

添付画像の魅力は参考にしたいが、実在ロゴ、実在ゲーム画面、実在キャラクターの再現に寄せると著作物の複製になりやすい。

### 解決

プロンプトでは「Beepメガドライブ時代の密度、色帯、攻略スクショ文化を参考」としつつ、実在ロゴ・実在画面・実在キャラクターを避け、架空ハード、架空ソフト、架空UIとして生成する制約を明示した。
