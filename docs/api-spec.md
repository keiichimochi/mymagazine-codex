# API仕様

ローカル App Server が静的配信と生成APIを提供する。

生成プロバイダは `MAGAZINE_AI_PROVIDER` で切り替える。

- `local`: ブラウザ / Node 内の決定的ローカル生成
- `codex-app-server`: `codex app-server` を子プロセス起動し、JSONL over stdio で Codex ハーネスを利用
- `codex-cli`: `codex exec` による単発生成

参考にした App Server の前提:

- `initialize` でハンドシェイクする
- `thread/start` でスレッドを作る
- `turn/start` でユーザー入力を渡す
- `item/agentMessage/delta` と `item/completed` から応答を集める
- `turn/completed` で完了判定する

## `generateWorldline(input)`

### 入力

```json
{
  "hardwareTop10": "メガドライブ\\nPCエンジン...",
  "gamesTop20": "シャイニング・フォース...",
  "genres": "SRPG\\n横STG...",
  "composers": "古代祐三...",
  "magazineCulture": "Beep MD...",
  "worldline": "セガ勝利世界...",
  "magazineElements": "クロスレビュー...",
  "mustHardware": "MD3...",
  "era": "1993-1996",
  "tone": "技術オタ誌..."
}
```

### 出力

```json
{
  "title": "IF通",
  "tagline": "存在しなかった1998年を毎週発行するゲーム機文化誌",
  "branchPoint": "1995年、セガが2D/音源特化路線を放棄しなかった",
  "editorialPolicy": [],
  "personas": [],
  "hardware": [],
  "manufacturers": [],
  "timeline": [],
  "issueTemplate": []
}
```

## 将来API

## `GET /api/status`

### 出力

```json
{
  "ok": true,
  "provider": "codex-app-server",
  "codexAvailable": true,
  "note": "codex app-server を子プロセスとして起動し、JSONL over stdio で生成します。"
}
```

## `POST /api/worldline`

### 入力

```json
{
  "input": {
    "hardwareTop10": "メガドライブ...",
    "gamesTop20": "シャイニング・フォース...",
    "genres": "SRPG...",
    "composers": "古代祐三...",
    "magazineCulture": "Beep MD...",
    "worldline": "セガ勝利世界...",
    "magazineElements": "クロスレビュー...",
    "mustHardware": "MD3...",
    "era": "1993-1998",
    "tone": "技術オタ誌"
  }
}
```

### 出力

```json
{
  "ok": true,
  "provider": "codex-app-server",
  "worldline": {}
}
```

生成成功時、この世界線は `data/current-worldline.json` にも保存される。

## `GET /api/worldline/current`

前回保存した世界線を取得する。

### 出力

```json
{
  "ok": true,
  "worldline": {}
}
```

保存済みデータがない場合、`worldline` は `null`。

## `POST /api/worldline/current`

現在の世界線を保存する。

### 入力

```json
{
  "worldline": {}
}
```

### 出力

```json
{
  "ok": true,
  "worldline": {}
}
```

## `POST /api/image-prompts`

### 入力

```json
{
  "worldline": {}
}
```

## `POST /api/magazine`

年月と世界線から雑誌1号分を生成し、`data/magazines/YYYY-MM.json` に保存する。

### 入力

```json
{
  "issueDate": "1998-04",
  "worldline": {}
}
```

### 出力

```json
{
  "ok": true,
  "provider": "local",
  "magazine": {
    "issueDate": "1998-04",
    "title": "電脳メガ通信 1998年4月号",
    "pages": []
  }
}
```

## `GET /api/magazine?issueDate=YYYY-MM`

指定年月の保存済み雑誌を取得する。未保存の場合は `magazine:null`。

## `POST /api/magazine/current`

現在の雑誌JSONを保存する。

## `GET /api/magazines`

保存済み雑誌の一覧を取得する。

### 出力

```json
{
  "ok": true,
  "provider": "codex-app-server",
  "prompts": [
    {
      "title": "電脳メガ通信 表紙",
      "kind": "cover",
      "page": 1,
      "prompt": "...",
      "negativePrompt": "..."
    }
  ]
}
```

### `POST /api/worldlines`

ヒアリング回答から世界線を作成する。

### `POST /api/issues`

世界線IDと号数を指定して一号分を生成する。

### `POST /api/pages/:pageId/assets`

ページに必要な架空スクショ、広告、箱絵を生成する。

### `GET /api/worldlines/:id`

固定世界線DBを取得する。
