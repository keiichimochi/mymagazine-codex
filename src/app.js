const seed = {
  hardware: [
    {
      id: "md3",
      name: "Mega Drive 3",
      release: 1996,
      cpu: "68000互換CPU + SH2補助演算",
      sound: "YM2612X + PCM 8ch",
      media: "GD-Cartridge",
      identity: "2D、FM音源、カートリッジ文化を限界まで延命したセガ機"
    },
    {
      id: "pcengine2",
      name: "PC Engine 2",
      release: 1995,
      cpu: "HuC6280X dual",
      sound: "波形メモリ音源 + ADPCM 6ch",
      media: "HuCard EX / Super CD-ROM2",
      identity: "小型高性能とCD文化を両立したNEC継続機"
    },
    {
      id: "saturn2d",
      name: "Sega Saturn EX",
      release: 1997,
      cpu: "dual SH2+",
      sound: "SCSP-II",
      media: "CD-ROM / RAM Cartridge",
      identity: "3D競争に飲まれず、2D格闘とアーケード移植に全振りしたサターン"
    },
    {
      id: "neogeo-evo",
      name: "NeoGeo Evolution",
      release: 1998,
      cpu: "68020 + sprite accelerator",
      sound: "YMZ280B + arcade PCM",
      media: "MVS-E cartridge",
      identity: "家庭用と業務用の境界をさらに曖昧にしたSNK機"
    }
  ],
  manufacturers: [
    {
      id: "sega_alt",
      name: "セガ第8AM統合計画室",
      stance: "アーケード文化と家庭用ハード戦争を継続させる急進派"
    },
    {
      id: "nec_he",
      name: "NECホームエレクトロニクス継続開発部",
      stance: "CD-ROMと小型ハード文化を守る技巧派"
    },
    {
      id: "snk_future",
      name: "新日本企画 第二開発局",
      stance: "格闘ゲーム、ドット絵、業務用基板を信仰する武闘派"
    }
  ],
  personas: [
    {
      id: "fm_kikuchi",
      name: "菊池FM男",
      role: "音源オタ",
      voice: "音色、発音数、PCM帯域からゲームを評価する"
    },
    {
      id: "arcade_mari",
      name: "真理アーケード",
      role: "アーケード至上主義",
      voice: "家庭用移植の入力遅延と処理落ちに厳しい"
    },
    {
      id: "segahara",
      name: "瀬賀原ハード信者",
      role: "セガ信者",
      voice: "商業的敗北より思想の先進性を評価する"
    },
    {
      id: "rpg_sawada",
      name: "沢田RPG",
      role: "RPG狂",
      voice: "世界設定、成長曲線、攻略本的な読み応えを重視する"
    },
    {
      id: "kuso_kondo",
      name: "近藤B級",
      role: "クソゲーマニア",
      voice: "怪作、未完成、謎移植の魅力を拾い上げる"
    }
  ],
  adCulture: [
    "謎の発売日未定広告",
    "開発率35%の画面写真",
    "読者プレゼントつき周辺機器広告",
    "FM音源デモCD応募券",
    "アーケード基板直系を強調する全面広告"
  ]
};

const sampleAnswers = {
  hardwareTop10: "メガドライブ\nPCエンジン\nセガサターン\nドリームキャスト\nネオジオ\nスーパーファミコン\nX68000\nゲームギア\nPC-FX\nスーパー32X",
  gamesTop20: "シャイニング・フォースII\nガンスターヒーローズ\nサンダーフォースIV\nイースI・II\nナイツ\nパンツァードラグーン\nメタルスラッグ\nベア・ナックルII\nファンタシースターIV\nグランディア\nバーチャファイター2\nストリートファイターZERO2\nタクティクスオウガ\nラングリッサーII\nアウトラン\nスペースハリアー\nソニックCD\nレイディアントシルバーガン\nドラゴンフォース\nルナ",
  genres: "SRPG\n横STG\nARPG\nベルトスクロール\nアーケード移植\n経営SLG\nADV",
  composers: "古代祐三\n崎元仁\n光田康典\nFM音源\nテクノ\nプログレ\nYMO系",
  magazineCulture: "Beep\nBeep MD\nゲーメスト\nサターンファン\nドリマガ",
  worldline: "セガ勝利世界\nNEC継続世界\nアーケード文化継続\nカセット超進化\n日本ゲーム黄金期継続",
  magazineElements: "クロスレビュー\n開発者インタビュー\nハード比較\n新作速報\n裏技\n次号予告\n読者投稿",
  mustHardware: "MD3\nPCエンジン2\nDreamcast2\nSega Neptune完成版\nNeoGeo Evolution",
  era: "1993-1998",
  tone: "技術オタ誌、BEEP的、ゲーメスト的狂気"
};

let currentWorldline = null;
let currentMagazine = null;
let magazineProgressTimer = null;

const form = document.querySelector("#hearing-form");
const summary = document.querySelector("#summary");
const magazinePanel = document.querySelector("#tab-magazine");
const libraryPanel = document.querySelector("#tab-library");
const pagePanel = document.querySelector("#tab-pages");
const dbPanel = document.querySelector("#tab-db");
const timelinePanel = document.querySelector("#tab-timeline");
const imagesPanel = document.querySelector("#tab-images");
const pipelinePanel = document.querySelector("#tab-pipeline");
const jsonOutput = document.querySelector("#json-output");
const imagePromptsButton = document.querySelector("#image-prompts-button");
const loadWorldlineButton = document.querySelector("#load-worldline-button");
const saveWorldlineButton = document.querySelector("#save-worldline-button");
const issueDateInput = document.querySelector("#issue-date");
const generateMagazineButton = document.querySelector("#generate-magazine-button");
const loadMagazineButton = document.querySelector("#load-magazine-button");
const saveMagazineButton = document.querySelector("#save-magazine-button");
const imageGenerateLimitInput = document.querySelector("#image-generate-limit");
const generateMagazineImagesButton = document.querySelector("#generate-magazine-images-button");

document.querySelector("#sample-button").addEventListener("click", () => {
  Object.entries(sampleAnswers).forEach(([name, value]) => {
    form.elements[name].value = value;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = Object.fromEntries(new FormData(form).entries());
  setBusy(true, "世界線を生成中...");
  try {
    currentWorldline = await generateWorldlineFromProvider(input);
    await saveCurrentWorldline(currentWorldline);
    render(currentWorldline);
  } catch (error) {
    currentWorldline = generateWorldline(input);
    currentWorldline.providerWarning = `サーバ生成に失敗したためブラウザ内生成へフォールバックしました: ${error.message}`;
    render(currentWorldline);
  } finally {
    setBusy(false);
  }
});

loadWorldlineButton.addEventListener("click", async () => {
  setBusy(true, "前回の世界線を読み込み中...");
  try {
    const loaded = await loadCurrentWorldline();
    if (!loaded) {
      summary.classList.remove("empty");
      summary.innerHTML = '<div class="warning">保存済みの世界線がまだありません。</div>';
      return;
    }
    currentWorldline = loaded;
    hydrateFormFromWorldline(currentWorldline);
    render(currentWorldline);
  } catch (error) {
    summary.classList.remove("empty");
    summary.innerHTML = `<div class="warning">世界線の読み込みに失敗しました: ${escapeHtml(error.message)}</div>`;
  } finally {
    setBusy(false);
  }
});

saveWorldlineButton.addEventListener("click", async () => {
  if (!currentWorldline) {
    summary.classList.remove("empty");
    summary.innerHTML = '<div class="warning">保存する世界線がありません。先に世界線を生成してください。</div>';
    return;
  }
  setBusy(true, "世界線を保存中...");
  try {
    await saveCurrentWorldline(currentWorldline);
    render({
      ...currentWorldline,
      providerWarning: `世界線を保存しました。${currentWorldline.savedAt ? `保存日時: ${currentWorldline.savedAt}` : ""}`
    });
  } catch (error) {
    summary.classList.remove("empty");
    summary.innerHTML = `<div class="warning">世界線の保存に失敗しました: ${escapeHtml(error.message)}</div>`;
  } finally {
    setBusy(false);
  }
});

imagePromptsButton.addEventListener("click", async () => {
  if (!currentWorldline) {
    const input = Object.fromEntries(new FormData(form).entries());
    currentWorldline = await generateWorldlineFromProvider(input);
    render(currentWorldline);
  }
  setBusy(true, "画像プロンプトを生成中...");
  try {
    const prompts = await generateImagePromptsFromProvider(currentWorldline);
    currentWorldline.imagePrompts = prompts;
    renderImagePrompts(prompts);
    jsonOutput.textContent = JSON.stringify(currentWorldline, null, 2);
    activateTab("images");
  } catch (error) {
    const prompts = createImagePrompts(currentWorldline).map((prompt) => ({
      ...prompt,
      warning: `サーバ生成に失敗したためブラウザ内生成へフォールバックしました: ${error.message}`
    }));
    currentWorldline.imagePrompts = prompts;
    renderImagePrompts(prompts);
    jsonOutput.textContent = JSON.stringify(currentWorldline, null, 2);
    activateTab("images");
  } finally {
    setBusy(false);
  }
});

generateMagazineButton.addEventListener("click", async () => {
  await ensureWorldline();
  if (!currentWorldline) return;
  syncTimelineFromEditor();
  await saveCurrentWorldline(currentWorldline);
  activateTab("magazine");
  startMagazineProgress();
  setBusy(true, "雑誌を生成中...");
  try {
    currentMagazine = await generateMagazineFromProvider(currentWorldline, issueDateInput.value);
    currentMagazine = await saveCurrentMagazine(currentMagazine);
    updateMagazineProgress(16, 100, "全ページの組版を完了しました。");
    renderMagazine(currentMagazine);
    jsonOutput.textContent = JSON.stringify({ worldline: currentWorldline, magazine: currentMagazine }, null, 2);
    activateTab("magazine");
  } catch (error) {
    currentMagazine = generateMagazine(currentWorldline, issueDateInput.value);
    currentMagazine.providerWarning = `サーバ生成に失敗したためブラウザ内生成へフォールバックしました: ${error.message}`;
    renderMagazine(currentMagazine);
    activateTab("magazine");
  } finally {
    stopMagazineProgress();
    setBusy(false);
  }
});

loadMagazineButton.addEventListener("click", async () => {
  setBusy(true, "雑誌を読み込み中...");
  try {
    currentMagazine = await loadCurrentMagazine(issueDateInput.value);
    if (!currentMagazine) {
      magazinePanel.innerHTML = '<div class="warning">指定年月の保存済み雑誌がありません。</div>';
      activateTab("magazine");
      return;
    }
    renderMagazine(currentMagazine);
    jsonOutput.textContent = JSON.stringify({ worldline: currentWorldline, magazine: currentMagazine }, null, 2);
    activateTab("magazine");
  } catch (error) {
    magazinePanel.innerHTML = `<div class="warning">雑誌の読み込みに失敗しました: ${escapeHtml(error.message)}</div>`;
    activateTab("magazine");
  } finally {
    setBusy(false);
  }
});

saveMagazineButton.addEventListener("click", async () => {
  if (!currentMagazine) {
    magazinePanel.innerHTML = '<div class="warning">保存する雑誌がありません。先に雑誌を生成してください。</div>';
    activateTab("magazine");
    return;
  }
  setBusy(true, "雑誌を保存中...");
  try {
    currentMagazine = await saveCurrentMagazine(currentMagazine);
    renderMagazine(currentMagazine);
    activateTab("magazine");
  } catch (error) {
    magazinePanel.innerHTML = `<div class="warning">雑誌の保存に失敗しました: ${escapeHtml(error.message)}</div>`;
    activateTab("magazine");
  } finally {
    setBusy(false);
  }
});

generateMagazineImagesButton.addEventListener("click", async () => {
  if (!currentMagazine) {
    magazinePanel.innerHTML = '<div class="warning">先に雑誌を生成または読み込んでください。</div>';
    activateTab("magazine");
    return;
  }
  if (location.protocol === "file:") {
    magazinePanel.innerHTML = '<div class="warning">実画像生成はローカル App Server 起動時のみ利用できます。npm run restart:codex か npm start で http://localhost:4173 を開いてください。</div>';
    activateTab("magazine");
    return;
  }
  const assets = collectMagazineAssets(currentMagazine);
  const limit = Math.min(Math.max(Number(imageGenerateLimitInput.value) || 1, 1), assets.length);
  setBusy(true, "雑誌画像を生成中...");
  activateTab("magazine");
  try {
    for (let index = 0; index < limit; index += 1) {
      const item = assets[index];
      const percent = Math.max(1, Math.round((index / limit) * 100));
      updateMagazineProgress(item.page.number, percent, `画像 ${index + 1}/${limit}: ${item.asset.title} を Gemini Nano Banana Pro で生成中...`);
      const result = await generateMagazineAssetFromProvider(currentMagazine, item.page, item.asset, item.assetIndex);
      item.asset.imageUrl = result.imageUrl;
      item.asset.generatedPrompt = result.prompt;
      item.asset.generatedModel = result.model;
      item.asset.generatedAt = new Date().toISOString();
      currentMagazine = await saveCurrentMagazine(currentMagazine);
    }
    updateMagazineProgress(16, 100, `画像生成を完了しました。${limit}点の素材を誌面へ反映済みです。`);
    renderMagazine(currentMagazine);
    jsonOutput.textContent = JSON.stringify({ worldline: currentWorldline, magazine: currentMagazine }, null, 2);
  } catch (error) {
    renderMagazine(currentMagazine);
    magazinePanel.insertAdjacentHTML("afterbegin", `<div class="warning">画像生成に失敗しました: ${escapeHtml(error.message)}</div>`);
  } finally {
    setBusy(false);
  }
});

document.querySelector("#copy-json").addEventListener("click", async () => {
  if (!currentWorldline) return;
  await navigator.clipboard.writeText(JSON.stringify(currentWorldline, null, 2));
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", async () => {
    activateTab(tab.dataset.tab);
    if (tab.dataset.tab === "library") await renderMagazineLibrary();
  });
});

async function generateWorldlineFromProvider(input) {
  if (location.protocol === "file:") return generateWorldline(input);
  const payload = await fetchJson("/api/worldline", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input })
  }, 240000);
  if (!payload.ok) throw new Error(payload.error || "生成に失敗しました");
  return payload.worldline;
}

async function generateImagePromptsFromProvider(worldline) {
  if (location.protocol === "file:") return createImagePrompts(worldline);
  const payload = await fetchJson("/api/image-prompts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ worldline })
  }, 240000);
  if (!payload.ok) throw new Error(payload.error || "画像プロンプト生成に失敗しました");
  return payload.prompts;
}

async function generateMagazineFromProvider(worldline, issueDate) {
  if (location.protocol === "file:") return generateMagazine(worldline, issueDate);
  const payload = await fetchJson("/api/magazine", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ worldline, issueDate })
  }, 300000);
  if (!payload.ok) throw new Error(payload.error || "雑誌生成に失敗しました");
  return payload.magazine;
}

async function generateMagazineAssetFromProvider(magazine, page, asset, assetIndex) {
  const payload = await fetchJson("/api/magazine/asset-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      issueDate: magazine.issueDate,
      pageNumber: page.number,
      assetIndex,
      page,
      asset
    })
  }, 180000);
  if (!payload.ok) throw new Error(payload.error || "画像生成に失敗しました");
  return payload;
}

function collectMagazineAssets(magazine) {
  return (magazine.pages || []).flatMap((page) => (
    (page.assets || []).map((asset, assetIndex) => ({
      page,
      asset,
      assetIndex
    }))
  ));
}

async function loadCurrentMagazine(issueDate) {
  if (location.protocol === "file:") {
    const raw = localStorage.getItem(`mymagazine.magazine.${issueDate}`);
    return raw ? JSON.parse(raw) : null;
  }
  const payload = await fetchJson(`/api/magazine?issueDate=${encodeURIComponent(issueDate)}`);
  if (!payload.ok) throw new Error(payload.error || "雑誌読み込みに失敗しました");
  return payload.magazine;
}

async function listSavedMagazines() {
  if (location.protocol === "file:") {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("mymagazine.magazine."))
      .map((key) => JSON.parse(localStorage.getItem(key)))
      .map((magazine) => ({
        issueDate: magazine.issueDate,
        title: magazine.title,
        subtitle: magazine.subtitle,
        savedAt: magazine.savedAt || null
      }))
      .sort((a, b) => String(b.issueDate).localeCompare(String(a.issueDate)));
  }
  const payload = await fetchJson("/api/magazines");
  if (!payload.ok) throw new Error(payload.error || "雑誌一覧の取得に失敗しました");
  return payload.magazines.sort((a, b) => String(b.issueDate).localeCompare(String(a.issueDate)));
}

async function saveCurrentMagazine(magazine) {
  const saved = {
    ...magazine,
    savedAt: new Date().toISOString()
  };
  currentMagazine = saved;
  if (location.protocol === "file:") {
    localStorage.setItem(`mymagazine.magazine.${saved.issueDate}`, JSON.stringify(saved));
    return saved;
  }
  const payload = await fetchJson("/api/magazine/current", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ magazine: saved })
  });
  if (!payload.ok) throw new Error(payload.error || "雑誌保存に失敗しました");
  await renderMagazineLibrary();
  return payload.magazine;
}

async function ensureWorldline() {
  if (currentWorldline) return;
  const loaded = await loadCurrentWorldline();
  if (loaded) {
    currentWorldline = loaded;
    hydrateFormFromWorldline(currentWorldline);
    render(currentWorldline);
    return;
  }
  const input = Object.fromEntries(new FormData(form).entries());
  currentWorldline = await generateWorldlineFromProvider(input);
  render(currentWorldline);
}

async function loadCurrentWorldline() {
  if (location.protocol === "file:") {
    const raw = localStorage.getItem("mymagazine.currentWorldline");
    return raw ? JSON.parse(raw) : null;
  }
  const payload = await fetchJson("/api/worldline/current");
  if (!payload.ok) throw new Error(payload.error || "読み込みに失敗しました");
  return payload.worldline;
}

async function saveCurrentWorldline(worldline) {
  const saved = {
    ...worldline,
    savedAt: new Date().toISOString()
  };
  currentWorldline = saved;
  if (location.protocol === "file:") {
    localStorage.setItem("mymagazine.currentWorldline", JSON.stringify(saved));
    return saved;
  }
  const payload = await fetchJson("/api/worldline/current", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ worldline: saved })
  });
  if (!payload.ok) throw new Error(payload.error || "保存に失敗しました");
  return payload.worldline;
}

async function fetchJson(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`API応答がタイムアウトしました: ${Math.round(timeoutMs / 1000)}秒`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function hydrateFormFromWorldline(worldline) {
  if (!worldline.sourceInput) return;
  Object.entries(worldline.sourceInput).forEach(([name, value]) => {
    if (form.elements[name]) form.elements[name].value = value;
  });
}

function setBusy(isBusy, label = "") {
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
  if (isBusy) {
    summary.classList.remove("empty");
    summary.innerHTML = `<div class="loading">${escapeHtml(label)}</div>`;
  }
}

function activateTab(name) {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
  document.querySelector(`#tab-${name}`).classList.add("active");
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
    {
      title: "1. 世界線固定",
      description: "ハード、メーカー、IP、年表、広告文化、読者層をDBに固定する。"
    },
    {
      title: "2. 号数状態生成",
      description: "対象年、発売予定、前号からの継続ニュース、読者投稿傾向を決める。"
    },
    {
      title: "3. 記事生成",
      description: "記事タイプとライター人格を指定し、口調と評価軸を固定して本文を作る。"
    },
    {
      title: "4. 画像生成",
      description: "架空スクショ、箱絵、広告、ドット絵をページ種別ごとのスタイルで生成する。"
    },
    {
      title: "5. レイアウト出力",
      description: "16ページテンプレートへ流し込み、PDF、Kindle風UI、Webマガジンへ展開する。"
    }
  ];
}

function createImagePrompts(worldline = {}) {
  const hardware = worldline.hardware?.[0] || seed.hardware[0];
  const title = worldline.title || "IF通";
  return [
    {
      title: `${title} 表紙`,
      kind: "cover",
      page: 1,
      prompt: `架空の1998年ゲーム雑誌表紙。特集は${hardware.name}。Beepメガドライブ時代の濃い広告色、巨大な特集数字、赤い斜め見出し、開発中スクリーンショット枠、誌面スキャン風の紙質。実在ロゴなし。`,
      negativePrompt: "実在企業ロゴ、実在ゲーム画面、読めない小文字の大量生成、現代スマホUI"
    },
    {
      title: `${hardware.name} 架空スクリーンショット`,
      kind: "screenshot",
      page: 4,
      prompt: `${hardware.name}向けの存在しない2DアクションRPGのスクリーンショット。攻略記事に貼られた小さな画面写真、赤ペン注釈、16-bitと32-bitの中間、鮮やかなドット絵、FM音源時代の未来感、ブラウン管キャプチャ風。`,
      negativePrompt: "既存ゲームのキャラクター、写真風、3D AAA風、実在UI"
    },
    {
      title: "音源比較 特集カット",
      kind: "feature-art",
      page: 6,
      prompt: "YM2612X、PCM 8ch、CDDAを比較する雑誌記事用イラスト。波形、チップ、カートリッジ、CD、編集部の手書き注釈、緑と水色の囲み記事、90年代ゲーム雑誌の高密度紙面。",
      negativePrompt: "実在メーカー商標、現代的なフラットUI、過度なSF背景"
    },
    {
      title: "架空周辺機器広告",
      kind: "advertisement",
      page: 12,
      prompt: `${hardware.name}用の未発売周辺機器広告。黄色い爆発マーク、赤い価格帯、音源デモCD応募券、発売日未定、開発率35%、Beepメガドライブ風の勢いある雑誌広告、実在ブランドなし。`,
      negativePrompt: "本物の商標、QRコード、現代ECサイト風"
    }
  ];
}

function generateMagazine(worldline = {}, issueDate) {
  const normalized = issueDate || "1998-04";
  const [yearText, monthText] = normalized.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const hardware = worldline.hardware?.[0] || seed.hardware[0];
  const personas = worldline.personas?.length ? worldline.personas : seed.personas;
  const timeline = relevantTimeline(worldline.timeline || [], year);
  const digest = timeline.map((item) => `${item.year}: ${item.event}`);
  const template = worldline.issueTemplate?.length ? worldline.issueTemplate : createIssueTemplate(worldline.sourceInput || {}, hardware);
  const theme = chooseMonthlyTheme(month, hardware, timeline);
  return {
    id: `${normalized}-${(worldline.title || "if").replace(/\s+/g, "-")}`,
    issueDate: normalized,
    title: `${worldline.title || "IF通"} ${year}年${month}月号`,
    subtitle: `${hardware.name}時代の${theme}`,
    coverLine: `${hardware.name}独占特集 / ${digest[0] || "ハード戦争継続中"}`,
    editorialNote: `${year}年${month}月号は、編集済み年表をもとに${hardware.name}周辺の市場、音源、広告文化を追跡する。`,
    timelineDigest: digest,
    pages: template.slice(0, 16).map((item, index) => {
      const persona = personas[index % personas.length];
      const event = timeline[index % Math.max(timeline.length, 1)];
      const eventText = event ? `${event.year}年の「${event.event}」` : "未確定の業界噂";
      return {
        number: item.number || index + 1,
        section: item.title,
        headline: `${["独占", "速報", "徹底検証", "緊急座談会", "読者騒然"][index % 5]} ${hardware.name} ${item.title}`,
        deck: `${item.description} ${eventText}を踏まえた誌面構成。`,
        body: `${persona.name}は${persona.role}の視点から、${hardware.name}の現在地を検証する。\n\n${eventText}が市場に残した影響は大きく、${item.description}\n\n本誌は設定DBと年表を参照し、毎号の出来事が次号以降にも残るように記録する。`,
        writer: persona.name,
        timelineRefs: event ? [String(event.year)] : [],
        imagePrompt: `Beepメガドライブ時代を参考にした架空1990年代日本ゲーム雑誌の${item.title}ページ。${hardware.name}、${theme}、${item.description}。色帯、攻略スクショ、赤字注釈、読者欄、広告枠を高密度に配置。実在ロゴなし、紙面スキャン風。`,
        assets: createPageAssets(item, hardware, theme, index),
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

function createPageAssets(item, hardware, theme, index) {
  const base = "Beepメガドライブ時代を参考にした架空ゲーム雑誌素材。高密度な誌面、緑/黄/赤/シアンの色帯、印刷網点、紙面スキャン、実在ロゴなし。";
  return [
    {
      kind: index === 0 ? "cover-art" : "screenshot",
      title: `${item.title} メインビジュアル`,
      caption: `${hardware.name}で動作する架空ソフトの誌面用メイン画像。`,
      prompt: `${base} ${hardware.name}、${item.title}、${theme}。架空ゲームのスクリーンショットを複数並べ、攻略矢印、小さな日本語キャプション、開発率表示、赤いBOSS見出しを入れる。`
    },
    {
      kind: index % 2 === 0 ? "hardware-photo" : "box-art",
      title: `${hardware.name} 資料写真`,
      caption: `編集部が入手したとされる${hardware.media || "試作メディア"}と周辺機器の写真風カット。`,
      prompt: `${base} 架空ハード${hardware.name}の製品写真風。カートリッジ、基板、コントローラ、箱、価格札、スペック表、90年代広告写真。`
    },
    {
      kind: index % 4 === 0 ? "advertisement" : "diagram",
      title: `${item.title} 欄外カット`,
      caption: "読者の目を止める小さな広告・図解枠。",
      prompt: `${base} ${item.title}の欄外用。小型の架空広告、スペック図、手書き矢印、黄色い速報帯、読者投稿風の顔アイコン、点線囲み、レビュー点数丸。`
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

function relevantTimeline(timeline, year) {
  const normalized = timeline
    .map((item) => ({ year: Number(item.year), event: String(item.event || "") }))
    .filter((item) => Number.isFinite(item.year) && item.event)
    .sort((a, b) => a.year - b.year);
  const scoped = normalized.filter((item) => item.year <= year);
  return scoped.length ? scoped : normalized.slice(0, 4);
}

function chooseMonthlyTheme(month, hardware, timeline) {
  const themes = ["新春ハード戦争予測", "読者が選ぶFM音源名曲", "春の新作速報", "アーケード移植完全検証", "次世代カートリッジ特集", "半期クロスレビュー総決算", "夏休み攻略増刊", "開発中止ソフト追跡", "ゲームショウIF速報", "音源チップ徹底比較", "年末商戦スクープ", "年間ベスト架空ゲーム"];
  const latest = timeline[timeline.length - 1]?.event || hardware.identity;
  return `${themes[(month - 1) % themes.length]} / ${latest}`;
}

function splitLines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function render(worldline) {
  renderSummary(worldline);
  renderPages(worldline.issueTemplate);
  renderDb(worldline);
  renderTimelineEditor(worldline);
  renderImagePrompts(worldline.imagePrompts || []);
  renderPipeline(worldline.generationPipeline);
  jsonOutput.textContent = JSON.stringify(worldline, null, 2);
}

function renderSummary(worldline) {
  summary.classList.remove("empty");
  summary.innerHTML = `
    <div class="hero-result">
      <div class="mag-title">
        <h3>${escapeHtml(worldline.title)}</h3>
        <p>${escapeHtml(worldline.tagline)}</p>
      </div>
      <div class="fact-grid">
        <div class="fact"><span>分岐点</span><strong>${escapeHtml(worldline.branchPoint)}</strong></div>
        <div class="fact"><span>創刊号コンセプト</span><strong>${escapeHtml(worldline.issueConcept)}</strong></div>
      </div>
      ${worldline.providerWarning ? `<div class="warning">${escapeHtml(worldline.providerWarning)}</div>` : ""}
      <div>
        <h3>編集方針</h3>
        <ul class="pill-list">
          ${worldline.editorialPolicy.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
      <div>
        <h3>固定ライター</h3>
        <div class="card-grid">
          ${worldline.personas.map((persona) => `
            <article class="data-card">
              <h3>${escapeHtml(persona.name)}</h3>
              <b>${escapeHtml(persona.role)}</b>
              <p>${escapeHtml(persona.voice)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderPages(pages) {
  pagePanel.innerHTML = `
    <div class="page-grid">
      ${pages.map((item) => `
        <article class="page-card">
          <span class="page-no">P.${item.number}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderDb(worldline) {
  dbPanel.innerHTML = `
    <h3>架空ハードDB</h3>
    <div class="card-grid">
      ${worldline.hardware.map((hardware) => `
        <article class="data-card">
          <h3>${escapeHtml(hardware.name)} / ${hardware.release}</h3>
          <p><b>CPU</b>${escapeHtml(hardware.cpu)}</p>
          <p><b>SOUND</b>${escapeHtml(hardware.sound)}</p>
          <p><b>MEDIA</b>${escapeHtml(hardware.media)}</p>
          <p>${escapeHtml(hardware.identity)}</p>
        </article>
      `).join("")}
    </div>
    <h3>年表</h3>
    <div class="card-grid">
      ${worldline.timeline.map((item) => `
        <article class="data-card">
          <h3>${item.year}</h3>
          <p>${escapeHtml(item.event)}</p>
        </article>
      `).join("")}
    </div>
    <h3>読者コミュニティ</h3>
    <article class="data-card">
      <h3>${escapeHtml(worldline.readerCommunity.name)}</h3>
      <p>${escapeHtml(worldline.readerCommunity.profile)}</p>
      <ul class="pill-list">
        ${worldline.readerCommunity.regularCorners.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderTimelineEditor(worldline) {
  const rows = (worldline.timeline || []).map((item, index) => timelineRow(item, index)).join("");
  timelinePanel.innerHTML = `
    <div class="timeline-actions">
      <button type="button" class="secondary" id="add-timeline-row">年表行を追加</button>
      <button type="button" id="save-timeline-button">年表を世界線に保存</button>
    </div>
    <div class="timeline-editor" id="timeline-editor">${rows}</div>
    <p class="muted">ここで編集した年表は、雑誌生成時の誌面本文・特集・年表参照に反映されます。</p>
  `;
  document.querySelector("#add-timeline-row").addEventListener("click", () => {
    const editor = document.querySelector("#timeline-editor");
    editor.insertAdjacentHTML("beforeend", timelineRow({ year: issueDateInput.value.slice(0, 4), event: "" }, editor.children.length));
  });
  document.querySelector("#save-timeline-button").addEventListener("click", async () => {
    syncTimelineFromEditor();
    await saveCurrentWorldline(currentWorldline);
    render(currentWorldline);
    activateTab("timeline");
  });
}

function timelineRow(item, index) {
  return `
    <div class="timeline-row" data-index="${index}">
      <input class="timeline-year" type="number" value="${escapeHtml(item.year)}" aria-label="年">
      <textarea class="timeline-event" rows="2" aria-label="出来事">${escapeHtml(item.event)}</textarea>
    </div>
  `;
}

function syncTimelineFromEditor() {
  const rows = [...document.querySelectorAll(".timeline-row")];
  if (!currentWorldline || !rows.length) return;
  currentWorldline.timeline = rows.map((row) => ({
    year: Number(row.querySelector(".timeline-year").value),
    event: row.querySelector(".timeline-event").value.trim()
  })).filter((item) => Number.isFinite(item.year) && item.event)
    .sort((a, b) => a.year - b.year);
}

function renderMagazine(magazine) {
  if (!magazine) {
    magazinePanel.innerHTML = '<p class="muted">年月を指定して雑誌を生成してください。</p>';
    return;
  }
  magazinePanel.innerHTML = `
    <div class="magazine-cover">
      <p class="kicker">${escapeHtml(magazine.issueDate)}</p>
      <h2>${escapeHtml(magazine.title)}</h2>
      <p>${escapeHtml(magazine.subtitle)}</p>
      <strong>${escapeHtml(magazine.coverLine)}</strong>
    </div>
    ${magazine.providerWarning ? `<div class="warning">${escapeHtml(magazine.providerWarning)}</div>` : ""}
    <article class="data-card">
      <h3>編集部より</h3>
      <p>${escapeHtml(magazine.editorialNote)}</p>
    </article>
    <h3>この号に効いている年表</h3>
    <ul class="pill-list">${(magazine.timelineDigest || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <div class="magazine-pages">
      ${(magazine.pages || []).map((page) => `
        <article class="magazine-page magazine-page-${escapeHtml(page.number)}">
          <header class="magazine-page-head">
            <span class="page-no">P.${escapeHtml(page.number)}</span>
            <p class="kicker">${escapeHtml(page.section)} / ${escapeHtml(page.writer)}</p>
            <h3>${escapeHtml(page.headline)}</h3>
            <p><b>${escapeHtml(page.deck)}</b></p>
          </header>
          <div class="magazine-layout">
            <div class="asset-stack">
              ${renderPageAssets(page)}
            </div>
            <div class="article-copy">
              <p>${escapeHtml(page.body)}</p>
              ${renderCallouts(page.callouts || [])}
              ${renderScoreBox(page.scoreBox)}
            </div>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

async function renderMagazineLibrary() {
  try {
    const magazines = await listSavedMagazines();
    if (!magazines.length) {
      libraryPanel.innerHTML = '<p class="muted">保存済み雑誌はまだありません。</p>';
      return;
    }
    libraryPanel.innerHTML = `
      <div class="library-grid">
        ${magazines.map((magazine) => `
          <button type="button" class="library-card" data-issue-date="${escapeHtml(magazine.issueDate)}">
            <span>${escapeHtml(magazine.issueDate)}</span>
            <strong>${escapeHtml(magazine.title || `${magazine.issueDate}号`)}</strong>
            <small>${escapeHtml(magazine.subtitle || "")}</small>
            <em>${escapeHtml(magazine.savedAt ? `保存: ${formatSavedAt(magazine.savedAt)}` : "")}</em>
          </button>
        `).join("")}
      </div>
    `;
    libraryPanel.querySelectorAll(".library-card").forEach((button) => {
      button.addEventListener("click", async () => {
        const issueDate = button.dataset.issueDate;
        issueDateInput.value = issueDate;
        setBusy(true, `${issueDate}号を読み込み中...`);
        try {
          currentMagazine = await loadCurrentMagazine(issueDate);
          renderMagazine(currentMagazine);
          jsonOutput.textContent = JSON.stringify({ worldline: currentWorldline, magazine: currentMagazine }, null, 2);
          activateTab("magazine");
        } finally {
          setBusy(false);
        }
      });
    });
  } catch (error) {
    libraryPanel.innerHTML = `<div class="warning">保存済み雑誌の一覧取得に失敗しました: ${escapeHtml(error.message)}</div>`;
  }
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderPageAssets(page) {
  const assets = page.assets?.length ? page.assets : [{
    kind: "screenshot",
    title: "誌面画像",
    caption: page.imagePrompt || "架空スクリーンショット",
    prompt: page.imagePrompt || ""
  }];
  return assets.map((asset, index) => `
    <figure class="asset-box asset-${escapeHtml(asset.kind)}">
      ${asset.imageUrl
        ? `<img class="asset-image" src="${escapeHtml(asset.imageUrl)}" alt="${escapeHtml(asset.title)}">`
        : `<div class="asset-art">
            <span>${escapeHtml(asset.kind)}</span>
            <strong>${escapeHtml(asset.title)}</strong>
          </div>`}
      <figcaption>${escapeHtml(asset.caption)}</figcaption>
      <p class="asset-prompt">${escapeHtml(asset.prompt)}</p>
      ${asset.generatedModel ? `<p class="asset-model">${escapeHtml(asset.generatedModel)}</p>` : ""}
    </figure>
  `).join("");
}

function renderCallouts(callouts) {
  if (!callouts.length) return "";
  return `<ul class="callout-list">${callouts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderScoreBox(scoreBox) {
  if (!scoreBox) return "";
  return `
    <div class="score-box">
      <span>${escapeHtml(scoreBox.label)}</span>
      <strong>${escapeHtml(scoreBox.score)}/10</strong>
      <p>${escapeHtml(scoreBox.note)}</p>
    </div>
  `;
}

function startMagazineProgress() {
  let page = 1;
  let percent = 5;
  updateMagazineProgress(page, percent, "誌面ラフを作成中...");
  clearInterval(magazineProgressTimer);
  magazineProgressTimer = setInterval(() => {
    percent = Math.min(95, percent + 5);
    page = Math.min(16, Math.max(1, Math.ceil(percent / 6.25)));
    const labels = ["画像枠を配置中", "本文を流し込み中", "キャプションを生成中", "欄外メモを調整中", "年表参照を反映中"];
    updateMagazineProgress(page, percent, labels[page % labels.length]);
  }, 1200);
}

function updateMagazineProgress(page, percent, detail) {
  magazinePanel.innerHTML = `
    <div class="progress-panel">
      <h3>${page}ページ目を生成中...</h3>
      <p>全体の${percent}%</p>
      <div class="progress-bar"><span style="width:${percent}%"></span></div>
      <p class="muted">${escapeHtml(detail)}</p>
    </div>
  `;
}

function stopMagazineProgress() {
  clearInterval(magazineProgressTimer);
  magazineProgressTimer = null;
}

function renderImagePrompts(prompts) {
  if (!prompts.length) {
    imagesPanel.innerHTML = '<p class="muted">世界線生成後に「画像プロンプト生成」を押すと、Codex/App Serverまたはローカル生成でプロンプトを作ります。</p>';
    return;
  }
  imagesPanel.innerHTML = `
    <div class="card-grid">
      ${prompts.map((item) => `
        <article class="data-card">
          <h3>${escapeHtml(item.title)} / P.${escapeHtml(item.page)}</h3>
          <b>${escapeHtml(item.kind)}</b>
          <p>${escapeHtml(item.prompt)}</p>
          <p><b>Negative</b>${escapeHtml(item.negativePrompt)}</p>
          ${item.warning ? `<p class="warning">${escapeHtml(item.warning)}</p>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function renderPipeline(pipeline) {
  pipelinePanel.innerHTML = `
    <div class="pipeline-grid">
      ${pipeline.map((item) => `
        <article class="pipeline-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
