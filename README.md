# MyMagazine

架空ゲーム業界シミュレーションを核にした、IF世界線ゲーム雑誌のプロトタイプです。

このアプリは、編集部ヒアリングの回答から以下を生成します。

- 雑誌タイトル案
- 世界線設定
- 編集方針
- 固定ライター人格
- 16ページ構成
- 架空ハード / メーカー / 年表 / 広告文化 DB
- AI生成パイプライン案
- 前回保存した世界線の読み込み
- 年月指定の雑誌生成
- 雑誌の保存・読み込み
- 保存済み雑誌一覧からの1クリック読み込み
- 世界線の年表表示・編集

## 使い方

ローカル生成だけなら `index.html` を直接開けます。

```bash
open /Users/k/github/mymagazine/index.html
```

Codex App Server 経由で生成する場合は、Codex CLI にログイン済みの状態でサーバを起動します。

```bash
npm run start:codex
```

既存サーバを止めて起動し直す場合は、これだけで再起動できます。

```bash
npm run restart:codex
```

その後、ブラウザで開きます。

```text
http://localhost:4173
```

生成モード:

- `npm start`: ローカル生成
- `npm run start:codex`: `codex app-server` を子プロセス起動し、JSONL over stdio で生成
- `npm run start:codex-exec`: `codex exec` による単発生成

## 構成

- `index.html`: アプリ本体
- `src/styles.css`: UIスタイル
- `src/app.js`: 世界線エンジンと生成ロジック
- `server.js`: 静的配信と生成API
- `codex-app-server-client.js`: Codex App Server JSONL クライアント
- `data/seed-worldline.json`: 初期世界線DB
- `data/current-worldline.json`: 前回保存した世界線。生成または保存操作で作成
- `data/magazines/YYYY-MM.json`: 年月ごとの保存済み雑誌
- `docs/requirements.md`: 機能要件定義
- `docs/architecture.md`: アーキテクチャ設計
- `docs/ui-spec.md`: UIデザイン仕様
- `docs/api-spec.md`: API仕様
- `docs/tasks.md`: 実装タスク一覧
- `docs/knowhow.md`: 実装中の知見

## 現在の位置づけ

まずは「毎回ゼロから世界観を作らない」ための固定された世界線エンジンを作る段階です。
今後は PDF 出力、実画像生成、継続号数管理、YouTube / Kindle 連動へ拡張できます。
