const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { CodexAppServerClient } = require("./codex-app-server-client");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const aiProvider = process.env.MAGAZINE_AI_PROVIDER || "local";
const codexModel = process.env.CODEX_MODEL || "gpt-5.4";
const currentWorldlinePath = path.join(root, "data/current-worldline.json");
const magazinesDir = path.join(root, "data/magazines");
const seed = JSON.parse(fs.readFileSync(path.join(root, "data/seed-worldline.json"), "utf8"));

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/status") {
      return sendJson(res, 200, {
        ok: true,
        provider: aiProvider,
        codexAvailable: await commandExists("codex"),
        note: aiProvider === "codex-app-server"
          ? "codex app-server を子プロセスとして起動し、JSONL over stdio で生成します。"
          : aiProvider === "codex-cli"
            ? "codex exec を使って単発生成します。"
            : "ローカル生成を使います。MAGAZINE_AI_PROVIDER=codex-app-server で Codex App Server 経由に切り替えられます。"
      });
    }

    if (req.method === "POST" && url.pathname === "/api/worldline") {
      const body = await readJson(req);
      const local = generateWorldline(body.input || {});
      const result = await generateWithProvider("worldline", body.input || {}, local);
      saveCurrentWorldline(result);
      return sendJson(res, 200, { ok: true, provider: aiProvider, worldline: result });
    }

    if (req.method === "GET" && url.pathname === "/api/worldline/current") {
      const worldline = loadCurrentWorldline();
      return sendJson(res, 200, { ok: true, worldline });
    }

    if (req.method === "POST" && url.pathname === "/api/worldline/current") {
      const body = await readJson(req);
      if (!body.worldline || typeof body.worldline !== "object") {
        return sendJson(res, 400, { ok: false, error: "worldline is required" });
      }
      saveCurrentWorldline(body.worldline);
      return sendJson(res, 200, { ok: true, worldline: body.worldline });
    }

    if (req.method === "POST" && url.pathname === "/api/image-prompts") {
      const body = await readJson(req);
      const localPrompts = createImagePrompts(body.worldline);
      const prompts = await generateWithProvider("image-prompts", body.worldline || {}, localPrompts);
      return sendJson(res, 200, { ok: true, provider: aiProvider, prompts });
    }

    if (req.method === "POST" && url.pathname === "/api/magazine") {
      const body = await readJson(req);
      const worldline = body.worldline || loadCurrentWorldline();
      if (!worldline) return sendJson(res, 400, { ok: false, error: "worldline is required" });
      const issueDate = normalizeIssueDate(body.issueDate);
      const local = generateMagazine(worldline, issueDate);
      const magazine = await generateWithProvider("magazine", { worldline, issueDate }, local);
      saveMagazine(magazine);
      return sendJson(res, 200, { ok: true, provider: aiProvider, magazine });
    }

    if (req.method === "GET" && url.pathname === "/api/magazine") {
      const issueDate = normalizeIssueDate(url.searchParams.get("issueDate"));
      return sendJson(res, 200, { ok: true, magazine: loadMagazine(issueDate) });
    }

    if (req.method === "POST" && url.pathname === "/api/magazine/current") {
      const body = await readJson(req);
      if (!body.magazine || typeof body.magazine !== "object") {
        return sendJson(res, 400, { ok: false, error: "magazine is required" });
      }
      saveMagazine(body.magazine);
      return sendJson(res, 200, { ok: true, magazine: body.magazine });
    }

    if (req.method === "GET" && url.pathname === "/api/magazines") {
      return sendJson(res, 200, { ok: true, magazines: listMagazines() });
    }

    return serveStatic(req, res, url.pathname);
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error.message,
      provider: aiProvider
    });
  }
});

server.listen(port, () => {
  console.log(`MyMagazine App Server: http://localhost:${port}`);
  console.log(`AI provider: ${aiProvider}`);
});

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end("Not found");
  }

  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  };
  res.writeHead(200, { "content-type": types[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function loadCurrentWorldline() {
  if (!fs.existsSync(currentWorldlinePath)) return null;
  return JSON.parse(fs.readFileSync(currentWorldlinePath, "utf8"));
}

function saveCurrentWorldline(worldline) {
  fs.mkdirSync(path.dirname(currentWorldlinePath), { recursive: true });
  fs.writeFileSync(currentWorldlinePath, `${JSON.stringify({
    ...worldline,
    savedAt: new Date().toISOString()
  }, null, 2)}\n`);
}

function normalizeIssueDate(issueDate) {
  const value = String(issueDate || "").trim();
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function magazinePath(issueDate) {
  return path.join(magazinesDir, `${normalizeIssueDate(issueDate)}.json`);
}

function loadMagazine(issueDate) {
  const filePath = magazinePath(issueDate);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveMagazine(magazine) {
  fs.mkdirSync(magazinesDir, { recursive: true });
  const issueDate = normalizeIssueDate(magazine.issueDate);
  fs.writeFileSync(magazinePath(issueDate), `${JSON.stringify({
    ...magazine,
    issueDate,
    savedAt: new Date().toISOString()
  }, null, 2)}\n`);
}

function listMagazines() {
  if (!fs.existsSync(magazinesDir)) return [];
  return fs.readdirSync(magazinesDir)
    .filter((name) => /^\d{4}-\d{2}\.json$/.test(name))
    .sort()
    .map((name) => {
      const magazine = JSON.parse(fs.readFileSync(path.join(magazinesDir, name), "utf8"));
      return {
        issueDate: magazine.issueDate,
        title: magazine.title,
        subtitle: magazine.subtitle,
        savedAt: magazine.savedAt || null
      };
    });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function commandExists(command) {
  try {
    await execFileText("which", [command], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function generateWorldlineWithCodex(input, fallback) {
  const prompt = [
    "あなたは架空ゲーム雑誌の編集長です。",
    "次のヒアリング回答と固定DBを使い、世界線エンジンJSONだけを返してください。",
    "毎回ゼロから世界観を変えず、固定ライター、ハードDB、年表、16ページ構成を維持・強化してください。",
    "出力はJSONのみ。Markdownや説明文は不要です。",
    "",
    "必須トップレベルキー:",
    "title, tagline, issueConcept, branchPoint, editorialPolicy, readerCommunity, hardware, manufacturers, personas, timeline, adCulture, issueTemplate, generationPipeline, sourceInput",
    "",
    `ヒアリング: ${JSON.stringify(input)}`,
    `固定DB: ${JSON.stringify(seed)}`,
    `ローカル生成案: ${JSON.stringify(fallback)}`
  ].join("\n");

  try {
    const output = await execFileText("codex", [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--model",
      codexModel,
      "--output-last-message",
      "-",
      prompt
    ], { timeout: 180000, maxBuffer: 1024 * 1024 * 8 });
    return parseJsonFromText(output);
  } catch (error) {
    return {
      ...fallback,
      providerWarning: `Codex CLI生成に失敗したためローカル生成へフォールバックしました: ${error.message}`
    };
  }
}

async function generateWithProvider(kind, input, fallback) {
  if (aiProvider === "local") return fallback;
  if (aiProvider === "codex-cli") {
    if (kind === "worldline") return generateWorldlineWithCodex(input, fallback);
    if (kind === "magazine") return generateMagazineWithCodex(input, fallback);
    return generateImagePromptsWithCodex(input, fallback);
  }
  if (aiProvider === "codex-app-server") {
    if (kind === "worldline") return generateWorldlineWithAppServer(input, fallback);
    if (kind === "magazine") return generateMagazineWithAppServer(input, fallback);
    return generateImagePromptsWithAppServer(input, fallback);
  }
  return fallback;
}

async function generateWorldlineWithAppServer(input, fallback) {
  const prompt = [
    "あなたは架空ゲーム雑誌の編集長です。",
    "Codex App Server 経由で、ヒアリング回答から世界線エンジンを生成してください。",
    "毎回ゼロから世界観を作り直さず、固定DBとローカル生成案を強化する形にしてください。",
    "最終回答はJSONのみ。Markdown、説明文、コードフェンスは禁止です。",
    "",
    "必須トップレベルキー:",
    "title, tagline, issueConcept, branchPoint, editorialPolicy, readerCommunity, hardware, manufacturers, personas, timeline, adCulture, issueTemplate, generationPipeline, sourceInput",
    "",
    `ヒアリング: ${JSON.stringify(input)}`,
    `固定DB: ${JSON.stringify(seed)}`,
    `ローカル生成案: ${JSON.stringify(fallback)}`
  ].join("\n");

  try {
    const output = await new CodexAppServerClient({ cwd: root, model: codexModel }).run(prompt, worldlineSchema());
    return parseJsonFromText(output);
  } catch (error) {
    return {
      ...fallback,
      providerWarning: `Codex App Server生成に失敗したためローカル生成へフォールバックしました: ${error.message}`
    };
  }
}

async function generateImagePromptsWithAppServer(worldline, fallback) {
  const prompt = [
    "あなたは1990年代ゲーム雑誌のアートディレクターです。",
    "世界線JSONをもとに、画像生成に渡すためのプロンプトを作ってください。",
    "画像そのものは生成せず、画像生成プロンプトを返してください。",
    "実在企業ロゴや実在ゲーム画面の複製は禁止です。雰囲気だけを指定してください。",
    "最終回答は {\"prompts\":[...]} のJSONオブジェクトのみ。Markdown、説明文、コードフェンスは禁止です。",
    "各 prompts 要素は title, kind, page, prompt, negativePrompt を持ちます。",
    "",
    `世界線: ${JSON.stringify(worldline)}`,
    `ローカル生成案: ${JSON.stringify(fallback)}`
  ].join("\n");

  try {
    const output = await new CodexAppServerClient({ cwd: root, model: codexModel }).run(prompt, imagePromptsSchema());
    const parsed = parseJsonFromText(output);
    if (Array.isArray(parsed)) return parsed;
    return Array.isArray(parsed.prompts) ? parsed.prompts : fallback;
  } catch (error) {
    return fallback.map((item) => ({
      ...item,
      warning: `Codex App Server生成に失敗したためローカル生成へフォールバックしました: ${error.message}`
    }));
  }
}

async function generateImagePromptsWithCodex(worldline, fallback) {
  const prompt = [
    "あなたは1990年代ゲーム雑誌のアートディレクターです。",
    "世界線JSONをもとに、架空スクリーンショット、箱絵、広告、ロゴ、ドット絵の画像生成プロンプトをJSON配列で返してください。",
    "実在企業ロゴや実在ゲーム画面の複製は避け、雰囲気だけを指定してください。",
    "出力はJSON配列のみ。各要素は title, kind, page, prompt, negativePrompt を持たせてください。",
    "",
    `世界線: ${JSON.stringify(worldline)}`,
    `ローカル生成案: ${JSON.stringify(fallback)}`
  ].join("\n");

  try {
    const output = await execFileText("codex", [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--model",
      codexModel,
      "--output-last-message",
      "-",
      prompt
    ], { timeout: 180000, maxBuffer: 1024 * 1024 * 8 });
    const parsed = parseJsonFromText(output);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback.map((item) => ({
      ...item,
      warning: `Codex CLI生成に失敗したためローカル生成へフォールバックしました: ${error.message}`
    }));
  }
}

async function generateMagazineWithAppServer(input, fallback) {
  const prompt = [
    "あなたは架空ゲーム雑誌の編集長です。",
    "世界線JSON、編集済み年表、対象年月をもとに、16ページの雑誌1号分を生成してください。",
    "年表にある出来事を必ず誌面内容に反映してください。",
    "ファミ通、Beep、ゲーメスト、サターンファンのような90年代日本ゲーム雑誌の紙面を意識し、各ページに複数の画像枠、スクリーンショット枠、ハード写真枠、広告風カット、図解カット、キャプション、欄外メモを入れてください。",
    "実在ロゴや実在ゲーム画面の複製は禁止です。架空ソフト、架空ハード、架空広告として作ってください。",
    "最終回答はJSONオブジェクトのみ。Markdown、説明文、コードフェンスは禁止です。",
    "",
    `対象年月: ${input.issueDate}`,
    `世界線: ${JSON.stringify(input.worldline)}`,
    `ローカル生成案: ${JSON.stringify(fallback)}`
  ].join("\n");

  try {
    const output = await new CodexAppServerClient({ cwd: root, model: codexModel }).run(prompt, magazineSchema());
    return parseJsonFromText(output);
  } catch (error) {
    return {
      ...fallback,
      providerWarning: `Codex App Server雑誌生成に失敗したためローカル生成へフォールバックしました: ${error.message}`
    };
  }
}

async function generateMagazineWithCodex(input, fallback) {
  const prompt = [
    "あなたは架空ゲーム雑誌の編集長です。",
    "世界線JSON、編集済み年表、対象年月をもとに、16ページの雑誌1号分をJSONで生成してください。",
    "出力はJSONのみ。",
    "",
    `対象年月: ${input.issueDate}`,
    `世界線: ${JSON.stringify(input.worldline)}`,
    `ローカル生成案: ${JSON.stringify(fallback)}`
  ].join("\n");

  try {
    const output = await execFileText("codex", [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--model",
      codexModel,
      "--output-last-message",
      "-",
      prompt
    ], { timeout: 180000, maxBuffer: 1024 * 1024 * 8 });
    return parseJsonFromText(output);
  } catch (error) {
    return {
      ...fallback,
      providerWarning: `Codex CLI雑誌生成に失敗したためローカル生成へフォールバックしました: ${error.message}`
    };
  }
}

function execFileText(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      cwd: root,
      timeout: options.timeout || 30000,
      maxBuffer: options.maxBuffer || 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}${stderr ? `\n${stderr}` : ""}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function parseJsonFromText(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```json\s*([\s\S]*?)```/) || trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) throw new Error("Codex output did not contain JSON");
    return JSON.parse(match[1]);
  }
}

function worldlineSchema() {
  const textArray = { type: "array", items: { type: "string" } };
  const hardware = {
    type: "object",
    additionalProperties: false,
    required: ["id", "name", "release", "cpu", "sound", "media", "identity"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      release: { type: "number" },
      cpu: { type: "string" },
      sound: { type: "string" },
      media: { type: "string" },
      identity: { type: "string" }
    }
  };
  const manufacturer = {
    type: "object",
    additionalProperties: false,
    required: ["id", "name", "stance"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      stance: { type: "string" }
    }
  };
  const persona = {
    type: "object",
    additionalProperties: false,
    required: ["id", "name", "role", "voice"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      role: { type: "string" },
      voice: { type: "string" }
    }
  };
  const timeline = {
    type: "object",
    additionalProperties: false,
    required: ["year", "event"],
    properties: {
      year: { type: "number" },
      event: { type: "string" }
    }
  };
  const issuePage = {
    type: "object",
    additionalProperties: false,
    required: ["number", "title", "description"],
    properties: {
      number: { type: "number" },
      title: { type: "string" },
      description: { type: "string" }
    }
  };
  const pipelineStep = {
    type: "object",
    additionalProperties: false,
    required: ["title", "description"],
    properties: {
      title: { type: "string" },
      description: { type: "string" }
    }
  };
  const sourceInput = {
    type: "object",
    additionalProperties: false,
    required: ["hardwareTop10", "gamesTop20", "genres", "composers", "magazineCulture", "worldline", "magazineElements", "mustHardware", "era", "tone"],
    properties: {
      hardwareTop10: { type: "string" },
      gamesTop20: { type: "string" },
      genres: { type: "string" },
      composers: { type: "string" },
      magazineCulture: { type: "string" },
      worldline: { type: "string" },
      magazineElements: { type: "string" },
      mustHardware: { type: "string" },
      era: { type: "string" },
      tone: { type: "string" }
    }
  };
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "tagline",
      "issueConcept",
      "branchPoint",
      "editorialPolicy",
      "readerCommunity",
      "hardware",
      "manufacturers",
      "personas",
      "timeline",
      "adCulture",
      "issueTemplate",
      "generationPipeline",
      "sourceInput"
    ],
    properties: {
      title: { type: "string" },
      tagline: { type: "string" },
      issueConcept: { type: "string" },
      branchPoint: { type: "string" },
      editorialPolicy: textArray,
      readerCommunity: {
        type: "object",
        additionalProperties: false,
        required: ["name", "profile", "regularCorners"],
        properties: {
          name: { type: "string" },
          profile: { type: "string" },
          regularCorners: textArray
        }
      },
      hardware: { type: "array", items: hardware },
      manufacturers: { type: "array", items: manufacturer },
      personas: { type: "array", items: persona },
      timeline: { type: "array", items: timeline },
      adCulture: textArray,
      issueTemplate: { type: "array", items: issuePage },
      generationPipeline: { type: "array", items: pipelineStep },
      sourceInput
    }
  };
}

function imagePromptsSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["prompts"],
    properties: {
      prompts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "kind", "page", "prompt", "negativePrompt"],
          properties: {
            title: { type: "string" },
            kind: { type: "string" },
            page: { type: "number" },
            prompt: { type: "string" },
            negativePrompt: { type: "string" }
          }
        }
      }
    }
  };
}

function magazineSchema() {
  const textArray = { type: "array", items: { type: "string" } };
  const asset = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "title", "caption", "prompt"],
    properties: {
      kind: { type: "string" },
      title: { type: "string" },
      caption: { type: "string" },
      prompt: { type: "string" }
    }
  };
  const scoreBox = {
    type: "object",
    additionalProperties: false,
    required: ["label", "score", "note"],
    properties: {
      label: { type: "string" },
      score: { type: "number" },
      note: { type: "string" }
    }
  };
  const page = {
    type: "object",
    additionalProperties: false,
    required: ["number", "section", "headline", "deck", "body", "writer", "timelineRefs", "imagePrompt", "assets", "callouts", "scoreBox"],
    properties: {
      number: { type: "number" },
      section: { type: "string" },
      headline: { type: "string" },
      deck: { type: "string" },
      body: { type: "string" },
      writer: { type: "string" },
      timelineRefs: textArray,
      imagePrompt: { type: "string" },
      assets: { type: "array", items: asset },
      callouts: textArray,
      scoreBox
    }
  };
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "issueDate", "title", "subtitle", "coverLine", "editorialNote", "timelineDigest", "pages", "worldlineTitle", "generatedAt"],
    properties: {
      id: { type: "string" },
      issueDate: { type: "string" },
      title: { type: "string" },
      subtitle: { type: "string" },
      coverLine: { type: "string" },
      editorialNote: { type: "string" },
      timelineDigest: textArray,
      pages: { type: "array", items: page },
      worldlineTitle: { type: "string" },
      generatedAt: { type: "string" }
    }
  };
}

function generateWorldline(input) {
  const tokens = tokenizeInput(input);
  const title = chooseTitle(tokens);
  const primaryHardware = chooseHardware(input.mustHardware, tokens);
  const era = input.era || "1996-1998";
  const tone = input.tone || "技術オタ誌";

  return {
    title,
    tagline: "存在しなかった1998年を毎週発行するゲーム機文化誌",
    issueConcept: `${era}の熱量で、${primaryHardware.name}を中心にハード戦争が継続する世界を記録する。`,
    branchPoint: createBranchPoint(input, primaryHardware),
    editorialPolicy: createEditorialPolicy(input, tone),
    readerCommunity: createReaderCommunity(input),
    hardware: prioritizeHardware(input.mustHardware, tokens),
    manufacturers: seed.manufacturers,
    personas: seed.personas,
    timeline: createTimeline(primaryHardware, era),
    adCulture: seed.adCulture,
    issueTemplate: createIssueTemplate(input, primaryHardware),
    generationPipeline: createPipeline(),
    sourceInput: input
  };
}

function createImagePrompts(worldline = {}) {
  const hardware = worldline.hardware?.[0] || seed.hardware[0];
  const title = worldline.title || "IF通";
  return [
    {
      title: `${title} 表紙`,
      kind: "cover",
      page: 1,
      prompt: `架空の1998年ゲーム雑誌表紙。特集は${hardware.name}。厚い見出し、赤と黄色の誌面、開発中スクリーンショット枠、実在ロゴなし、90年代日本ゲーム雑誌の印刷質感。`,
      negativePrompt: "実在企業ロゴ、実在ゲーム画面、読めない小文字の大量生成、現代スマホUI"
    },
    {
      title: `${hardware.name} 架空スクリーンショット`,
      kind: "screenshot",
      page: 4,
      prompt: `${hardware.name}向けの存在しない2DアクションRPGのスクリーンショット。16-bitと32-bitの中間、鮮やかなドット絵、FM音源時代の未来感、ブラウン管キャプチャ風。`,
      negativePrompt: "既存ゲームのキャラクター、写真風、3D AAA風、実在UI"
    },
    {
      title: "音源比較 特集カット",
      kind: "feature-art",
      page: 6,
      prompt: `YM2612X、PCM 8ch、CDDAを比較する雑誌記事用イラスト。波形、チップ、カートリッジ、CD、編集部の手書き注釈風。`,
      negativePrompt: "実在メーカー商標、現代的なフラットUI、過度なSF背景"
    },
    {
      title: "架空周辺機器広告",
      kind: "advertisement",
      page: 12,
      prompt: `${hardware.name}用の未発売周辺機器広告。音源デモCD応募券、発売日未定、開発率35%、90年代雑誌広告、実在ブランドなし。`,
      negativePrompt: "本物の商標、QRコード、現代ECサイト風"
    }
  ];
}

function generateMagazine(worldline = {}, issueDate) {
  const normalized = normalizeIssueDate(issueDate);
  const [yearText, monthText] = normalized.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const hardware = worldline.hardware?.[0] || seed.hardware[0];
  const personas = worldline.personas?.length ? worldline.personas : seed.personas;
  const timeline = relevantTimeline(worldline.timeline || [], year);
  const digest = timeline.map((item) => `${item.year}: ${item.event}`);
  const template = worldline.issueTemplate?.length ? worldline.issueTemplate : createIssueTemplate(worldline.sourceInput || {}, hardware);
  const monthTheme = chooseMonthlyTheme(month, hardware, timeline);

  return {
    id: `${normalized}-${slugify(worldline.title || "game-if")}`,
    issueDate: normalized,
    title: `${worldline.title || "IF通"} ${year}年${month}月号`,
    subtitle: `${hardware.name}時代の${monthTheme}`,
    coverLine: `${hardware.name}独占特集 / ${digest[0] || "ハード戦争継続中"}`,
    editorialNote: `${year}年${month}月号は、編集済み年表の出来事をもとに${hardware.name}周辺の市場、音源、広告文化を追跡する。`,
    timelineDigest: digest,
    pages: template.slice(0, 16).map((item, index) => {
      const persona = personas[index % personas.length];
      const event = timeline[index % Math.max(timeline.length, 1)];
      const eventText = event ? `${event.year}年の「${event.event}」` : "未確定の業界噂";
      return {
        number: item.number || index + 1,
        section: item.title,
        headline: createMagazineHeadline(item.title, hardware, monthTheme, index),
        deck: `${item.description} ${eventText}を踏まえた誌面構成。`,
        body: createMagazineBody(item, hardware, persona, eventText, worldline),
        writer: persona.name,
        timelineRefs: event ? [String(event.year)] : [],
        imagePrompt: `1990年代日本ゲーム雑誌の${item.title}ページ。${hardware.name}、${monthTheme}、${item.description}。実在ロゴなし、紙面スキャン風。`,
        assets: createPageAssets(item, hardware, monthTheme, index),
        callouts: createPageCallouts(item, hardware, eventText, index),
        scoreBox: {
          label: index % 3 === 0 ? "期待度" : index % 3 === 1 ? "技術度" : "読者熱量",
          score: 7 + (index % 4),
          note: `${persona.role}視点で${hardware.name}らしさを採点`
        }
      };
    }),
    worldlineTitle: worldline.title || "IF通",
    generatedAt: new Date().toISOString()
  };
}

function relevantTimeline(timeline, year) {
  const normalized = timeline
    .map((item) => ({ year: Number(item.year), event: String(item.event || "") }))
    .filter((item) => Number.isFinite(item.year) && item.event)
    .sort((a, b) => a.year - b.year);
  const scoped = normalized.filter((item) => item.year <= year);
  return scoped.length ? scoped : normalized.slice(0, 4);
}

function chooseMonthlyTheme(month, hardware, timeline) {
  const themes = [
    "新春ハード戦争予測",
    "読者が選ぶFM音源名曲",
    "春の新作速報",
    "アーケード移植完全検証",
    "次世代カートリッジ特集",
    "半期クロスレビュー総決算",
    "夏休み攻略増刊",
    "開発中止ソフト追跡",
    "東京ゲームショウIF速報",
    "音源チップ徹底比較",
    "年末商戦スクープ",
    "年間ベスト架空ゲーム"
  ];
  const latest = timeline[timeline.length - 1]?.event || hardware.identity;
  return `${themes[(month - 1) % themes.length]} / ${latest}`;
}

function createMagazineHeadline(section, hardware, theme, index) {
  const prefixes = ["独占", "速報", "徹底検証", "緊急座談会", "読者騒然"];
  return `${prefixes[index % prefixes.length]} ${hardware.name} ${section}`;
}

function createMagazineBody(item, hardware, persona, eventText, worldline) {
  return [
    `${persona.name}は${persona.role}の視点から、${hardware.name}の現在地を検証する。`,
    `${eventText}が市場に残した影響は大きく、${item.description}`,
    `本誌は${worldline.editorialPolicy?.[0] || "スペック表と開発者コメントを同じ熱量で扱う"}という方針で、誌面上の熱量とDBの整合性を両立させる。`
  ].join("\n\n");
}

function createPageAssets(item, hardware, theme, index) {
  const section = item.title;
  return [
    {
      kind: index === 0 ? "cover-art" : "screenshot",
      title: `${section} メインビジュアル`,
      caption: `${hardware.name}で動作する架空ソフトの誌面用メイン画像。`,
      prompt: `90年代日本ゲーム雑誌掲載用。${hardware.name}、${section}、${theme}。架空ゲームのスクリーンショット、大きなキャプション欄、印刷網点、実在ロゴなし。`
    },
    {
      kind: index % 2 === 0 ? "hardware-photo" : "box-art",
      title: `${hardware.name} 資料写真`,
      caption: `編集部が入手したとされる${hardware.media || "試作メディア"}と周辺機器の写真風カット。`,
      prompt: `架空ハード${hardware.name}の製品写真風。カートリッジ、基板、コントローラ、雑誌撮影ブース、90年代広告写真、実在ロゴなし。`
    },
    {
      kind: index % 4 === 0 ? "advertisement" : "diagram",
      title: `${section} 欄外カット`,
      caption: `読者の目を止める小さな広告・図解枠。`,
      prompt: `${section}の欄外用。小型の架空広告、スペック図、手書き矢印、黄色い速報帯、ファミ通風の紙面密度、実在ロゴなし。`
    }
  ];
}

function createPageCallouts(item, hardware, eventText, index) {
  return [
    `${hardware.sound || "音源"}の鳴りを編集部が再検証`,
    `${eventText}がこのページの裏テーマ`,
    index % 2 === 0 ? "開発率65%の画面写真に注目" : "読者投稿欄では賛否が割れそうだ"
  ];
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "magazine";
}

function tokenizeInput(input) {
  return Object.values(input)
    .join("\n")
    .toLowerCase()
    .split(/[\s,、。・/\\|]+/)
    .filter(Boolean);
}

function chooseTitle(tokens) {
  if (tokens.some((token) => token.includes("beep"))) return "電脳メガ通信";
  if (tokens.some((token) => token.includes("sega") || token.includes("セガ"))) return "SEGA∞";
  if (tokens.some((token) => token.includes("if"))) return "IF通";
  return "GAME IF";
}

function chooseHardware(mustHardware, tokens) {
  const text = `${mustHardware}\n${tokens.join("\n")}`.toLowerCase();
  return seed.hardware.find((hardware) => text.includes(hardware.id) || text.includes(hardware.name.toLowerCase()))
    || seed.hardware[0];
}

function prioritizeHardware(mustHardware, tokens) {
  const text = `${mustHardware}\n${tokens.join("\n")}`.toLowerCase();
  return [...seed.hardware].sort((a, b) => scoreHardware(b, text) - scoreHardware(a, text));
}

function scoreHardware(hardware, text) {
  let score = 0;
  if (text.includes(hardware.id)) score += 5;
  if (text.includes(hardware.name.toLowerCase())) score += 5;
  if (text.includes("セガ") && hardware.id.includes("md")) score += 3;
  if (text.includes("nec") && hardware.id.includes("pcengine")) score += 3;
  if (text.includes("snk") && hardware.id.includes("neogeo")) score += 3;
  if (text.includes("音源")) score += hardware.sound.includes("YM") ? 2 : 1;
  return score;
}

function createBranchPoint(input, hardware) {
  const branch = input.worldline || "セガ勝利世界、アーケード文化継続";
  return `1995年、${branch.split(/\n/)[0]}が現実化し、${hardware.name}が次世代3D競争ではなく音源・2D・雑誌文化を進化させた。`;
}

function createEditorialPolicy(input, tone) {
  const genres = splitLines(input.genres);
  const elements = splitLines(input.magazineElements);
  return [
    `${tone}として、スペック表と開発者コメントを同じ熱量で扱う。`,
    `${genres[0] || "アーケード移植"}を巻頭優先ジャンルにする。`,
    `${elements[0] || "クロスレビュー"}を毎号の固定企画にする。`,
    "実在史との差分を毎号の年表に追記し、設定のブレを防ぐ。",
    "音源、媒体、コントローラ、広告文体をゲーム機文化として扱う。"
  ];
}

function createReaderCommunity(input) {
  const culture = splitLines(input.magazineCulture);
  return {
    name: "メガ読者通信局",
    profile: `${culture[0] || "BEEP"}文化を引きずる投稿者が集まる、ハード戦争と裏技ハガキの共同体。`,
    regularCorners: ["読者の基板部屋", "今月のFM音色自慢", "発売中止ソフト捜索班", "クロスレビューへの反論"]
  };
}

function createTimeline(hardware, era) {
  const start = Number.parseInt(String(era).match(/\d{4}/)?.[0] || "1995", 10);
  return [
    { year: start, event: "セガとNECが2D特化路線を共同で市場に再定義する。" },
    { year: start + 1, event: `${hardware.name}発売。${hardware.media}文化が再燃。` },
    { year: start + 2, event: "アーケード完全移植を競う第二次ハード戦争が始まる。" },
    { year: start + 3, event: "雑誌付録CDに音源比較デモと開発中スクリーンショットが定着する。" }
  ];
}

function createIssueTemplate(input, hardware) {
  const elements = splitLines(input.magazineElements);
  const genres = splitLines(input.genres);
  return [
    page(1, "表紙", `${hardware.name}特集。開発率65%の架空スクショを大きく掲載。`),
    page(2, "巻頭スクープ", `${hardware.cpu}の設計思想とハード戦争の新局面。`),
    page(3, "スペック解析", `${hardware.sound}、${hardware.media}、拡張端子を図解。`),
    page(4, "新作速報", `${genres[0] || "SRPG"}新作3本を速報形式で紹介。`),
    page(5, "クロスレビュー", `${elements[0] || "クロスレビュー"}を4人の固定人格で採点。`),
    page(6, "音源特集", "FM、PCM、CDDAの鳴りを波形とコメントで比較。"),
    page(7, "開発者インタビュー", "存在しない第二開発部が語る、2D進化の思想。"),
    page(8, "攻略集中連載", `${genres[1] || "横STG"}の1面から3面までを攻略。`),
    page(9, "裏技道場", "隠しサウンドテスト、デバッグ表示、謎のPCMテスト。"),
    page(10, "アーケード通信", "基板版との差、入力遅延、処理落ちを検証。"),
    page(11, "読者投稿", "ハード戦争ハガキ、妄想周辺機器、誌面ツッコミ。"),
    page(12, "架空広告", "発売日未定の周辺機器と音源デモCD応募券。"),
    page(13, "メーカー勢力図", "セガ、NEC、SNK、任天堂のIF市場シェア。"),
    page(14, "発売予定表", "延期、仮題、開発中止寸前タイトルを含む一覧。"),
    page(15, "編集後記", "ライター人格ごとの偏った今月の一本。"),
    page(16, "次号予告", "Dreamcast2、NeoGeo Evolution、PC Engine 2の続報。")
  ];
}

function page(number, title, description) {
  return { number, title, description };
}

function createPipeline() {
  return [
    { title: "1. 世界線固定", description: "ハード、メーカー、IP、年表、広告文化、読者層をDBに固定する。" },
    { title: "2. 号数状態生成", description: "対象年、発売予定、前号からの継続ニュース、読者投稿傾向を決める。" },
    { title: "3. Codex生成", description: "Codex CLI/App Server境界から記事案、レビュー、画像プロンプトを生成する。" },
    { title: "4. 画像生成", description: "架空スクショ、箱絵、広告、ドット絵をページ種別ごとのスタイルで生成する。" },
    { title: "5. レイアウト出力", description: "16ページテンプレートへ流し込み、PDF、Kindle風UI、Webマガジンへ展開する。" }
  ];
}

function splitLines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
