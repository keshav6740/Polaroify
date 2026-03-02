const els = {
  searchInput: document.getElementById("searchInput"),
  searchType: document.getElementById("searchType"),
  searchBtn: document.getElementById("searchBtn"),
  step1Next: document.getElementById("step1Next"),
  step2Back: document.getElementById("step2Back"),
  step2Next: document.getElementById("step2Next"),
  step3Back: document.getElementById("step3Back"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  shareSocialBtn: document.getElementById("shareSocialBtn"),
  wizardProgressFill: document.getElementById("wizardProgressFill"),
  statusText: document.getElementById("statusText"),
  resultsWrap: document.getElementById("resultsWrap"),
  resultsGrid: document.getElementById("resultsGrid"),
  changeSelectionBtn: document.getElementById("changeSelectionBtn"),
  downloadPngBtn: document.getElementById("downloadPngBtn"),
  orderHdBtn: document.getElementById("orderHdBtn"),
  downloadHdBtn: document.getElementById("downloadHdBtn"),
  ownerLookupWrap: document.getElementById("ownerLookupWrap"),
  ownerOrderId: document.getElementById("ownerOrderId"),
  loadOrderBtn: document.getElementById("loadOrderBtn"),
  ownerStatus: document.getElementById("ownerStatus"),
  resetDefaultsBtn: document.getElementById("resetDefaultsBtn"),
  presetName: document.getElementById("presetName"),
  savePresetBtn: document.getElementById("savePresetBtn"),
  presetSelect: document.getElementById("presetSelect"),
  loadPresetBtn: document.getElementById("loadPresetBtn"),
  deletePresetBtn: document.getElementById("deletePresetBtn"),
  poster: document.getElementById("poster"),
  coverArt: document.getElementById("coverArt"),
  previewTitle: document.getElementById("previewTitle"),
  previewArtist: document.getElementById("previewArtist"),
  explicitBadge: document.getElementById("explicitBadge"),
  posterTitle: document.getElementById("posterTitle"),
  posterArtist: document.getElementById("posterArtist"),
  releaseDate: document.getElementById("releaseDate"),
  releaseDatePreview: document.getElementById("releaseDatePreview"),
  lyricsLineCount: document.getElementById("lyricsLineCount"),
  lyricsText: document.getElementById("lyricsText"),
  lyricsFitHint: document.getElementById("lyricsFitHint"),
  previewLyrics: document.getElementById("previewLyrics"),
  playerDuration: document.getElementById("playerDuration"),
  playerProgress: document.getElementById("playerProgress"),
  codeOpacity: document.getElementById("codeOpacity"),
  colorTemplates: document.getElementById("colorTemplates"),
  colorTemplatesWrap: document.getElementById("colorTemplatesWrap"),
  themeModeTemplate: document.getElementById("themeModeTemplate"),
  themeModeCustom: document.getElementById("themeModeCustom"),
  customColorWrap: document.getElementById("customColorWrap"),
  polaroidColor: document.getElementById("polaroidColor"),
  accentColor: document.getElementById("accentColor"),
  customImageInput: document.getElementById("customImageInput"),
  useCustomImage: document.getElementById("useCustomImage"),
  imageFit: document.getElementById("imageFit"),
  fontSelect: document.getElementById("fontSelect"),
  contrastWarning: document.getElementById("contrastWarning"),
  toggleLyrics: document.getElementById("toggleLyrics"),
  toggleCode: document.getElementById("toggleCode"),
  togglePlayer: document.getElementById("togglePlayer"),
  toggleActions: document.getElementById("toggleActions"),
  toggleDate: document.getElementById("toggleDate"),
  lyricsBlock: document.getElementById("lyricsBlock"),
  spotifyCodeWrap: document.getElementById("spotifyCodeWrap"),
  playerBar: document.getElementById("playerBar"),
  musicActions: document.querySelector(".music-actions"),
  spotifyCode: document.getElementById("spotifyCode"),
  timelineFill: document.getElementById("timelineFill"),
  timeLabel: document.getElementById("timeLabel"),
  btnPlayPause: document.getElementById("btnPlayPause"),
  btnLiked: document.getElementById("btnLiked"),
};

const state = {
  selected: null,
  codeUri: "",
  codeFallbackStep: 0,
  codeCandidates: [],
  isPlayingVisual: false,
  likedVisual: true,
  spotifyCoverUrl: "",
  customImageUrl: "",
  currentStep: 1,
  themeMode: "template",
};

const PRESET_STORAGE_KEY = "spotpost_presets_v1";
const FREE_EXPORT_SCALE = 2;
const HD_EXPORT_SCALE = 2;
const HD_EXPORT_PRICE = 19;
const ORDER_WHATSAPP_NUMBER = "919265684017";
const OWNER_QUERY_FLAG = "owner";
const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const SUPPORTS_DOWNLOAD_ATTR =
  typeof HTMLAnchorElement !== "undefined" &&
  "download" in HTMLAnchorElement.prototype;
const DEFAULTS = {
  playerDuration: "30",
  playerProgress: "0",
  codeOpacity: "80",
  polaroidColor: "#f5f0e6",
  accentColor: "#0d0d0d",
  fontSelect: "'Space Grotesk', sans-serif",
  lyricsLineCount: "3",
  toggleLyrics: true,
  toggleCode: true,
  togglePlayer: true,
  toggleActions: true,
  toggleDate: true,
};

els.searchBtn.addEventListener("click", runSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runSearch();
});
els.changeSelectionBtn.addEventListener("click", () => expandResults());
els.downloadPngBtn.addEventListener("click", downloadPosterPng);
els.orderHdBtn?.addEventListener("click", orderHdOnWhatsApp);
els.downloadHdBtn?.addEventListener("click", downloadOwnerHdPng);
els.loadOrderBtn?.addEventListener("click", loadOrderByOwnerInput);
els.ownerOrderId?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadOrderByOwnerInput();
});
els.step1Next.addEventListener("click", () => {
  if (!state.selected) {
    setStatus("Select a song first to continue.");
    return;
  }
  goToStep(2);
});
els.step2Back.addEventListener("click", () => goToStep(1));
els.step2Next.addEventListener("click", () => goToStep(3));
els.step3Back.addEventListener("click", () => goToStep(2));
els.resetDefaultsBtn.addEventListener("click", resetToDefaults);
els.savePresetBtn.addEventListener("click", savePreset);
els.loadPresetBtn.addEventListener("click", loadPreset);
els.deletePresetBtn.addEventListener("click", deletePreset);
els.copyLinkBtn.addEventListener("click", copyShareLink);
els.shareSocialBtn.addEventListener("click", shareSocial);
els.themeModeTemplate.addEventListener("click", () => setThemeMode("template"));
els.themeModeCustom.addEventListener("click", () => setThemeMode("custom"));

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");
    if (!tab) return;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document
      .querySelectorAll(".tab-panel")
      .forEach((panel) =>
        panel.classList.toggle("active", panel.getAttribute("data-panel") === tab),
      );
  });
});

async function runSearch() {
  const q = els.searchInput.value.trim();
  if (!q) {
    setStatus("Type a song or album name.");
    return;
  }

  let type = els.searchType.value;
  if (type === "both") type = "track,album";

  setStatus("Searching Spotify...");
  els.resultsGrid.innerHTML = "";
  expandResults(false);

  try {
    const url = new URL("/api/search", window.location.origin);
    url.searchParams.set("q", q);
    url.searchParams.set("type", type);
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const { data, text } = await readJsonOrText(response);

    if (!response.ok) {
      setStatus(data?.error?.message || text || `Spotify error: ${response.status}`);
      return;
    }
    if (!data) {
      setStatus("Server returned an invalid response.");
      return;
    }

    const tracks = data.tracks?.items || [];
    const albums = data.albums?.items || [];
    const combined = [
      ...tracks.map((item) => ({ ...item, __kind: "track" })),
      ...albums.map((item) => ({ ...item, __kind: "album" })),
    ];

    if (!combined.length) {
      setStatus("No matches found.");
      return;
    }

    renderResults(combined);
    setStatus(`Found ${combined.length} result(s). Pick one.`);
  } catch (err) {
    console.warn("Search error:", err);
    setStatus("Network error while searching Spotify.");
  }
}

function renderResults(items) {
  els.resultsGrid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const item of items) {
    const isTrack = item.__kind === "track";
    const image = isTrack ? item.album?.images?.[0]?.url : item.images?.[0]?.url;
    const title = item.name || "Untitled";
    const artists = (item.artists || []).map((a) => a.name).join(", ");
    const date = isTrack ? item.album?.release_date || "--" : item.release_date || "--";

    const card = document.createElement("button");
    card.className = "result-card";
    card.type = "button";
    card.innerHTML = `
      <img src="${image || ""}" alt="${escapeHtml(title)} cover" />
      <div class="result-meta">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(artists || "Unknown artist")}</p>
        <p>${escapeHtml(item.__kind.toUpperCase())} - ${escapeHtml(date)}</p>
      </div>
    `;
    card.addEventListener("click", () => selectItem(item));
    fragment.appendChild(card);
  }

  els.resultsGrid.appendChild(fragment);
}

async function selectItem(item) {
  const isTrack = item.__kind === "track";
  const title = item.name || "Untitled";
  const artists = (item.artists || []).map((a) => a.name).join(", ") || "Unknown";
  const date = isTrack ? item.album?.release_date : item.release_date;
  const cover = isTrack ? item.album?.images?.[0]?.url : item.images?.[0]?.url;
  const uri = item.uri || "";
  const isExplicit = isTrack && item.explicit === true;

  state.selected = item;
  state.codeUri = uri;
  state.spotifyCoverUrl = cover || "";
  els.playerProgress.value = "0";
  els.coverArt.src = state.spotifyCoverUrl;
  els.previewTitle.textContent = title;
  els.previewArtist.textContent = artists;
  els.explicitBadge.classList.toggle("hidden", !isExplicit);
  els.posterTitle.value = title;
  els.posterArtist.value = artists;
  els.releaseDate.value = date || "--";
  els.releaseDatePreview.textContent = formatReleaseDate(date || "--");

  if (isTrack && Number.isFinite(item.duration_ms)) {
    const seconds = Math.max(1, Math.round(item.duration_ms / 1000));
    els.playerDuration.value = String(seconds);
  }

  updateSpotifyCode();
  updatePlayerFromProgress();

  collapseResults();
  setStatus(`${isTrack ? "Track" : "Album"} selected. Loading lyrics...`);

  if (isTrack) {
    await fetchAndSetLyrics(title, artists);
    setStatus(
      `Track selected. Duration auto-set to ${els.playerDuration.value}s from Spotify.`,
    );
  } else {
    els.lyricsText.value = "";
    els.previewLyrics.textContent = "No default lyrics for albums. Add your own text.";
    setStatus("Album selected. Duration remains editable.");
  }

  applyCustomizations();
  els.step1Next.disabled = false;
}

async function fetchAndSetLyrics(trackName, artistName) {
  try {
    const url = new URL("/api/lyrics", window.location.origin);
    url.searchParams.set("track", trackName);
    url.searchParams.set("artist", artistName);
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const { data, text } = await readJsonOrText(response);

    if (!response.ok || !data?.lyrics) {
      els.lyricsText.value = "";
      els.previewLyrics.textContent = "Lyrics unavailable. Add your own lyrics or quote.";
      setStatus(data?.error?.message || text || "Lyrics unavailable for this track.");
      return;
    }

    els.lyricsText.value = data.lyrics;
    els.previewLyrics.textContent = data.lyrics;
    setStatus(`Track selected. Lyrics loaded from ${data.source || "provider"}.`);
  } catch (err) {
    console.warn("Lyrics fetch error:", err);
    els.lyricsText.value = "";
    els.previewLyrics.textContent = "Lyrics unavailable. Add your own lyrics or quote.";
    setStatus("Could not fetch lyrics for this song.");
  }
}

function collapseResults() {
  els.resultsWrap.classList.add("collapsed");
  els.changeSelectionBtn.classList.remove("hidden");
}

function expandResults(clearMessage = true) {
  els.resultsWrap.classList.remove("collapsed");
  els.changeSelectionBtn.classList.add("hidden");
  if (clearMessage) setStatus("Search and pick a track or album.");
}

function updatePlayerFromProgress() {
  const duration = Number(els.playerDuration.value) || 30;
  const progress = Number(els.playerProgress.value) || 0;
  const currentSec = Math.round((duration * progress) / 100);
  els.timelineFill.style.width = `${progress}%`;
  els.timeLabel.textContent = `${formatTime(currentSec)} / ${formatTime(duration)}`;
}

function updateSpotifyCode() {
  if (!state.codeUri) {
    els.spotifyCode.removeAttribute("src");
    state.codeCandidates = [];
    return;
  }

  const encoded = encodeURIComponent(state.codeUri);
  const raw = state.codeUri;
  const bgHex = (els.polaroidColor.value || "#F5F0E6").replace("#", "").toUpperCase();
  const darkBg = isDarkHexColor(bgHex);
  const primaryBg = bgHex;
  const primaryBars = darkBg ? "white" : "black";
  const altBg = darkBg ? "000000" : "F5F0E6";
  const altBars = primaryBars;
  state.codeCandidates = [
    `/api/spotify-code?uri=${encoded}&bg=${primaryBg}&bars=${primaryBars}`,
    `/api/spotify-code?uri=${encoded}&bg=${altBg}&bars=${altBars}`,
    `https://scannables.scdn.co/uri/plain/png/${primaryBg}/${primaryBars}/640/${encoded}`,
    `https://scannables.scdn.co/uri/plain/png/${altBg}/${altBars}/640/${encoded}`,
    `https://scannables.scdn.co/uri/plain/png/${primaryBg}/${primaryBars}/640/${raw}`,
    `https://scannables.scdn.co/uri/plain/png/${altBg}/${altBars}/640/${raw}`,
  ];

  state.codeFallbackStep = 0;
  els.spotifyCodeWrap.style.display = "";
  els.spotifyCode.src = state.codeCandidates[0];
}

els.spotifyCode.addEventListener("error", () => {
  if (!state.codeUri || !state.codeCandidates.length) return;
  state.codeFallbackStep += 1;

  const next = state.codeCandidates[state.codeFallbackStep];
  if (next) {
    els.spotifyCode.src = next;
    return;
  }

  els.spotifyCodeWrap.style.display = "none";
  els.toggleCode.checked = false;
  setStatus("Spotify code could not be loaded from Spotify servers.");
});

els.spotifyCode.addEventListener("load", () => {
  els.spotifyCodeWrap.style.display = "";
  els.toggleCode.checked = true;
});

function applyCustomizations() {
  const title = els.posterTitle.value.trim();
  const artist = els.posterArtist.value.trim();
  const date = els.releaseDate.value.trim();
  const lyrics = els.lyricsText.value.trim();
  const lyricsLineCount = Number.parseInt(els.lyricsLineCount?.value || "3", 10);
  const bg = els.polaroidColor.value;
  const accent = els.accentColor.value;
  const font = els.fontSelect.value;
  const codeOpacity = Number(els.codeOpacity.value || 55) / 100;
  const useCustom = Boolean(els.useCustomImage.checked && state.customImageUrl);
  const fitMode = els.imageFit?.value || "cover";

  if (title) els.previewTitle.textContent = title;
  if (artist) els.previewArtist.textContent = artist;
  els.releaseDatePreview.textContent = formatReleaseDate(date || "--");
  const previewLyrics = formatLyricsPreview(lyrics, lyricsLineCount);
  els.previewLyrics.textContent = previewLyrics;
  els.previewLyrics.title = lyrics || "";
  updateLyricsFitHint(lyrics, lyricsLineCount);
  els.coverArt.src = useCustom ? state.customImageUrl : state.spotifyCoverUrl;
  els.coverArt.style.objectFit = fitMode;

  els.poster.style.background = bg;
  els.poster.style.color = accent;
  els.poster.style.fontFamily = font;
  els.poster.style.boxShadow = "0 14px 36px rgba(0, 0, 0, 0.35)";
  els.timelineFill.style.background = accent;
  els.spotifyCodeWrap.style.opacity = `${codeOpacity}`;
  els.poster.classList.toggle("lyrics-lines-4", lyricsLineCount === 4);
  els.poster.classList.toggle("lyrics-lines-5", lyricsLineCount === 5);

  if (els.contrastWarning) {
    const ratio = getContrastRatio(bg, accent);
    els.contrastWarning.classList.toggle("hidden", ratio >= 3.0);
  }

  updateSpotifyCode();
}

function formatLyricsPreview(lyrics, maxLines = 3) {
  const raw = String(lyrics || "").replaceAll("\r\n", "\n").trim();
  if (!raw) return "Add custom lyrics or fetch a track first.";
  const limit = Math.max(1, Math.min(8, Number(maxLines) || 3));
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= limit) return lines.join("\n");
  return `${lines.slice(0, limit).join("\n")}\n...`;
}

function updateLyricsFitHint(lyrics, lineCount) {
  if (!els.lyricsFitHint) return;
  const limit = Number(lineCount) || 3;
  const lines = String(lyrics || "")
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
  const hasLongLines = lines.some((line) => line.length > 34 || line.split(/\s+/).length > 8);
  const showHint = limit >= 5 && hasLongLines;
  els.lyricsFitHint.classList.toggle("hidden", !showHint);
}

function syncPosterVisibility() {
  els.lyricsBlock.classList.toggle("reserved-hidden", !els.toggleLyrics.checked);
  els.spotifyCodeWrap.classList.toggle("reserved-hidden", !els.toggleCode.checked);
  els.playerBar.classList.toggle("reserved-hidden", !els.togglePlayer.checked);
  els.poster.classList.toggle("compact-player", !els.togglePlayer.checked);
  els.musicActions.classList.toggle("reserved-hidden", !els.toggleActions.checked);
  els.poster.classList.toggle("compact-actions", !els.toggleActions.checked);
  els.releaseDatePreview.classList.toggle("reserved-hidden", !els.toggleDate.checked);
}

function setThemeMode(mode) {
  state.themeMode = mode === "custom" ? "custom" : "template";
  const isCustom = state.themeMode === "custom";
  els.themeModeTemplate.classList.toggle("active-mode", !isCustom);
  els.themeModeCustom.classList.toggle("active-mode", isCustom);
  els.colorTemplatesWrap.classList.toggle("hidden", isCustom);
  els.customColorWrap.classList.toggle("hidden", !isCustom);
}

function goToStep(step) {
  state.currentStep = step;
  [1, 2, 3].forEach((num) => {
    const el = document.getElementById(`step${num}`);
    if (el) el.classList.toggle("active", num === step);
    const nav = document.querySelector(`[data-step-nav="${num}"]`);
    if (nav) nav.classList.toggle("active", num === step);
    const indicator = document.querySelector(`[data-step-indicator="${num}"]`);
    if (indicator) {
      indicator.classList.toggle("active", num === step);
      indicator.classList.toggle("done", num < step);
    }
  });
  if (els.wizardProgressFill) {
    const width = step === 1 ? 33 : step === 2 ? 66 : 100;
    els.wizardProgressFill.style.width = `${width}%`;
  }
}

function resetToDefaults() {
  els.playerDuration.value = state.selected?.__kind === "track" && Number.isFinite(state.selected.duration_ms)
    ? String(Math.max(1, Math.round(state.selected.duration_ms / 1000)))
    : DEFAULTS.playerDuration;
  els.playerProgress.value = DEFAULTS.playerProgress;
  els.codeOpacity.value = DEFAULTS.codeOpacity;
  els.polaroidColor.value = DEFAULTS.polaroidColor;
  els.accentColor.value = DEFAULTS.accentColor;
  els.fontSelect.value = DEFAULTS.fontSelect;
  if (els.lyricsLineCount) els.lyricsLineCount.value = DEFAULTS.lyricsLineCount;
  els.toggleLyrics.checked = DEFAULTS.toggleLyrics;
  els.toggleCode.checked = DEFAULTS.toggleCode;
  els.togglePlayer.checked = DEFAULTS.togglePlayer;
  els.toggleActions.checked = DEFAULTS.toggleActions;
  els.toggleDate.checked = DEFAULTS.toggleDate;
  els.useCustomImage.checked = false;
  if (els.imageFit) els.imageFit.value = "cover";
  setThemeMode("template");
  els.customImageInput.value = "";
  state.customImageUrl = "";
  state.isPlayingVisual = false;
  state.likedVisual = true;
  els.btnPlayPause.innerHTML = "&#x23F5;";
  els.btnLiked.style.opacity = "1";

  if (state.selected) {
    const isTrack = state.selected.__kind === "track";
    const selectedArtists = (state.selected.artists || []).map((a) => a.name).join(", ") || "Unknown";
    const selectedDate = isTrack ? state.selected.album?.release_date : state.selected.release_date;
    els.posterTitle.value = state.selected.name || "";
    els.posterArtist.value = selectedArtists;
    els.releaseDate.value = selectedDate || "--";
  }

  syncPosterVisibility();
  updatePlayerFromProgress();
  applyCustomizations();
  setStatus("Defaults restored.");
}

function readStoredPresets() {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredPresets(presets) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function getCurrentPresetPayload() {
  return {
    polaroidColor: els.polaroidColor.value,
    accentColor: els.accentColor.value,
    fontSelect: els.fontSelect.value,
    lyricsLineCount: els.lyricsLineCount?.value || "3",
    themeMode: state.themeMode,
  };
}

function applyPresetPayload(preset) {
  const keys = [
    "polaroidColor",
    "accentColor",
    "fontSelect",
    "lyricsLineCount",
  ];
  keys.forEach((key) => {
    if (preset[key] !== undefined && els[key]) {
      els[key].value = String(preset[key]);
    }
  });
  setThemeMode(preset.themeMode === "custom" ? "custom" : "template");
  applyCustomizations();
}

function getCurrentOrderSnapshot() {
  return {
    title: els.posterTitle.value.trim(),
    artist: els.posterArtist.value.trim(),
    releaseDate: els.releaseDate.value.trim(),
    lyricsText: els.lyricsText.value,
    playerDuration: els.playerDuration.value,
    playerProgress: els.playerProgress.value,
    codeOpacity: els.codeOpacity.value,
    polaroidColor: els.polaroidColor.value,
    accentColor: els.accentColor.value,
    fontSelect: els.fontSelect.value,
    lyricsLineCount: els.lyricsLineCount?.value || "3",
    themeMode: state.themeMode,
    toggleLyrics: Boolean(els.toggleLyrics.checked),
    toggleCode: Boolean(els.toggleCode.checked),
    togglePlayer: Boolean(els.togglePlayer.checked),
    toggleActions: Boolean(els.toggleActions.checked),
    toggleDate: Boolean(els.toggleDate.checked),
    imageFit: els.imageFit?.value || "cover",
    useCustomImage: Boolean(els.useCustomImage.checked),
    customImageUrl: state.customImageUrl || "",
    spotifyCoverUrl: state.spotifyCoverUrl || "",
    codeUri: state.codeUri || "",
    explicit: !els.explicitBadge.classList.contains("hidden"),
    createdAt: new Date().toISOString(),
  };
}

function applyOrderSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;

  if (snapshot.title !== undefined) els.posterTitle.value = String(snapshot.title || "");
  if (snapshot.artist !== undefined) els.posterArtist.value = String(snapshot.artist || "");
  if (snapshot.releaseDate !== undefined) els.releaseDate.value = String(snapshot.releaseDate || "--");
  if (snapshot.lyricsText !== undefined) els.lyricsText.value = String(snapshot.lyricsText || "");

  if (snapshot.playerDuration !== undefined) els.playerDuration.value = String(snapshot.playerDuration || "30");
  if (snapshot.playerProgress !== undefined) els.playerProgress.value = String(snapshot.playerProgress || "0");
  if (snapshot.codeOpacity !== undefined) els.codeOpacity.value = String(snapshot.codeOpacity || "80");
  if (snapshot.polaroidColor !== undefined) els.polaroidColor.value = String(snapshot.polaroidColor || "#f5f0e6");
  if (snapshot.accentColor !== undefined) els.accentColor.value = String(snapshot.accentColor || "#0d0d0d");
  if (snapshot.fontSelect !== undefined) els.fontSelect.value = String(snapshot.fontSelect || DEFAULTS.fontSelect);
  if (snapshot.lyricsLineCount !== undefined && els.lyricsLineCount) {
    els.lyricsLineCount.value = String(snapshot.lyricsLineCount || "3");
  }
  if (snapshot.imageFit !== undefined && els.imageFit) els.imageFit.value = String(snapshot.imageFit || "cover");

  state.themeMode = snapshot.themeMode === "custom" ? "custom" : "template";
  setThemeMode(state.themeMode);

  els.toggleLyrics.checked = snapshot.toggleLyrics !== false;
  els.toggleCode.checked = snapshot.toggleCode !== false;
  els.togglePlayer.checked = snapshot.togglePlayer !== false;
  els.toggleActions.checked = snapshot.toggleActions !== false;
  els.toggleDate.checked = snapshot.toggleDate !== false;

  state.spotifyCoverUrl = String(snapshot.spotifyCoverUrl || "");
  state.customImageUrl = String(snapshot.customImageUrl || "");
  state.codeUri = String(snapshot.codeUri || "");
  els.useCustomImage.checked = Boolean(snapshot.useCustomImage && state.customImageUrl);

  if (snapshot.explicit === true) els.explicitBadge.classList.remove("hidden");
  if (snapshot.explicit === false) els.explicitBadge.classList.add("hidden");

  updateSpotifyCode();
  syncPosterVisibility();
  updatePlayerFromProgress();
  applyCustomizations();
}

function refreshPresetOptions() {
  const presets = readStoredPresets();
  els.presetSelect.innerHTML = "";
  if (!presets.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No presets saved";
    els.presetSelect.appendChild(opt);
    return;
  }
  presets.forEach((preset) => {
    const opt = document.createElement("option");
    opt.value = preset.name;
    opt.textContent = preset.name;
    els.presetSelect.appendChild(opt);
  });
}

function savePreset() {
  const name = els.presetName.value.trim();
  if (!name) {
    setStatus("Enter a preset name first.");
    return;
  }
  const presets = readStoredPresets().filter((p) => p.name !== name);
  presets.push({ name, data: getCurrentPresetPayload() });
  writeStoredPresets(presets);
  refreshPresetOptions();
  els.presetSelect.value = name;
  setStatus(`Preset "${name}" saved.`);
}

function loadPreset() {
  const name = els.presetSelect.value;
  const preset = readStoredPresets().find((p) => p.name === name);
  if (!preset) {
    setStatus("Select a saved preset first.");
    return;
  }
  applyPresetPayload(preset.data || {});
  setStatus(`Preset "${name}" loaded.`);
}

function deletePreset() {
  const name = els.presetSelect.value;
  if (!name) {
    setStatus("Select a preset to delete.");
    return;
  }
  const presets = readStoredPresets().filter((p) => p.name !== name);
  writeStoredPresets(presets);
  refreshPresetOptions();
  setStatus(`Preset "${name}" deleted.`);
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (err) {
    console.warn("Async clipboard unavailable:", err);
  }

  try {
    const temp = document.createElement("textarea");
    temp.value = value;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.top = "-9999px";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(temp);
    return copied;
  } catch (err) {
    console.warn("Legacy clipboard fallback failed:", err);
    return false;
  }
}

function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  if (!SUPPORTS_DOWNLOAD_ATTR || IS_IOS) {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      URL.revokeObjectURL(url);
      return false;
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return "preview";
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  return "download";
}

async function copyShareLink() {
  const copied = await copyTextToClipboard(window.location.href);
  if (copied) {
    setStatus("Generator link copied.");
  } else {
    setStatus("Could not copy link.");
  }
}

async function shareSocial() {
  await sharePosterToApp();
}

async function sharePosterToApp() {
  const shareText = "Created with Polaroify";
  try {
    const blob = await renderPosterBlob({ scale: HD_EXPORT_SCALE });
    if (!blob) throw new Error("Poster image unavailable");
    if (navigator.share) {
      const file = new File([blob], "polaroify-poster.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Polaroify Poster",
          text: shareText,
          files: [file],
        });
        setStatus("Poster shared. Pick WhatsApp or Instagram in the share sheet.");
        return;
      }
      await navigator.share({
        title: "Polaroify Poster",
        text: shareText,
        url: window.location.href,
      });
      setStatus("Share sheet opened.");
      return;
    }
  } catch (err) {
    console.warn("Share error:", err);
  }

  const copied = await copyTextToClipboard(window.location.href);
  if (copied) {
    setStatus("Share sheet not available. Link copied; share the downloaded poster on WhatsApp/Instagram.");
  } else {
    setStatus("Share sheet not available. Download poster and share it manually.");
  }
}

[
  "posterTitle",
  "posterArtist",
  "releaseDate",
  "lyricsText",
  "playerDuration",
  "playerProgress",
  "codeOpacity",
  "polaroidColor",
  "accentColor",
  "fontSelect",
  "lyricsLineCount",
].forEach((key) => {
  els[key].addEventListener("input", () => {
    if (key === "playerDuration" || key === "playerProgress") updatePlayerFromProgress();
    applyCustomizations();
  });
});

els.lyricsLineCount?.addEventListener("change", applyCustomizations);

els.useCustomImage.addEventListener("change", applyCustomizations);
if (els.imageFit) els.imageFit.addEventListener("change", applyCustomizations);

els.customImageInput.addEventListener("change", () => {
  const file = els.customImageInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.customImageUrl = String(reader.result || "");
    els.useCustomImage.checked = true;
    applyCustomizations();
    setStatus("Custom image applied.");
  };
  reader.readAsDataURL(file);
});

els.colorTemplates.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest(".template-btn");
  if (!btn) return;
  const bg = btn.getAttribute("data-bg");
  const accent = btn.getAttribute("data-accent");
  const font = btn.getAttribute("data-font");
  if (!bg || !accent) return;
  setThemeMode("template");
  els.polaroidColor.value = bg;
  els.accentColor.value = accent;
  if (font) els.fontSelect.value = font;
  syncPosterVisibility();
  applyCustomizations();
});

els.toggleLyrics.addEventListener("change", () => {
  syncPosterVisibility();
});
els.toggleCode.addEventListener("change", () => {
  syncPosterVisibility();
});
els.togglePlayer.addEventListener("change", () => {
  syncPosterVisibility();
});
els.toggleActions.addEventListener("change", () => {
  syncPosterVisibility();
});
els.toggleDate.addEventListener("change", () => {
  syncPosterVisibility();
});

els.btnPlayPause.addEventListener("click", () => {
  state.isPlayingVisual = !state.isPlayingVisual;
  els.btnPlayPause.innerHTML = state.isPlayingVisual ? "&#10074;&#10074;" : "&#x23F5;";
});

els.btnLiked.addEventListener("click", () => {
  state.likedVisual = !state.likedVisual;
  els.btnLiked.style.opacity = state.likedVisual ? "1" : "0.45";
});

async function downloadPosterPng() {
  setStatus("Rendering high-quality PNG...");
  try {
    const blob = await renderPosterBlob({ scale: FREE_EXPORT_SCALE });
    if (!blob) throw new Error("PNG export failed");
    const mode = triggerBlobDownload(
      blob,
      `${slugify(els.previewTitle.textContent || "polaroify")}.png`,
    );
    if (!mode) throw new Error("Download could not be started");
    if (mode === "preview") {
      setStatus("Preview opened in a new tab. Long-press the image and save to Photos.");
      return;
    }
    setStatus("High-quality PNG downloaded.");
  } catch (err) {
    console.error(err);
    setStatus("PNG export failed. Try another cover image and retry.");
  }
}

async function orderHdOnWhatsApp() {
  setStatus("Preparing order details...");
  const clientOrderId = generateOrderId();
  try {
    const snapshot = await buildOrderSnapshotForUpload();
    const response = await fetch("/api/order-snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id: clientOrderId, snapshot }),
    });
    const { data, text } = await readJsonOrText(response);
    if (!response.ok || !data?.id) {
      throw new Error(data?.error?.message || text || "Could not save order snapshot.");
    }

    const baseUrl = `${window.location.origin}/generator.html?order=${encodeURIComponent(data.id)}`;
    const ownerUrl = `${baseUrl}&${OWNER_QUERY_FLAG}=1`;
    const message = buildHdOrderMessage({ orderId: data.id, customerUrl: baseUrl, ownerUrl });
    const base = ORDER_WHATSAPP_NUMBER
      ? `https://wa.me/${ORDER_WHATSAPP_NUMBER}`
      : "https://wa.me/";
    const url = `${base}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("Opened WhatsApp with saved customization link.");
  } catch (error) {
    console.warn("WhatsApp order setup failed:", error);
    const fallback = buildHdOrderMessage({ orderId: "", customerUrl: window.location.href, ownerUrl: "" });
    const base = ORDER_WHATSAPP_NUMBER
      ? `https://wa.me/${ORDER_WHATSAPP_NUMBER}`
      : "https://wa.me/";
    const url = `${base}?text=${encodeURIComponent(fallback)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("Opened WhatsApp with basic details (snapshot save failed).");
  }
}

function buildHdOrderMessage({ orderId, customerUrl, ownerUrl }) {
  const title = (els.previewTitle.textContent || "").trim() || "Untitled";
  const artist = (els.previewArtist.textContent || "").trim() || "Unknown artist";
  const date = (els.releaseDatePreview.textContent || "--").trim();
  const lines = [
    `Hi, I want HD no-watermark export (Rs ${HD_EXPORT_PRICE}).`,
    `Order ID: ${orderId || "NOT_SAVED"}`,
    `Song: ${title}`,
    `Artist: ${artist}`,
    `Release label: ${date}`,
    `Order Link: ${customerUrl}`,
  ];
  if (ownerUrl) lines.push(`Owner HD Link: ${ownerUrl}`);
  return lines.join("\n");
}

async function downloadOwnerHdPng() {
  setStatus("Rendering owner HD export...");
  try {
    const blob = await renderPosterBlob({ scale: HD_EXPORT_SCALE });
    if (!blob) throw new Error("HD PNG export failed");
    const mode = triggerBlobDownload(
      blob,
      `${slugify(els.previewTitle.textContent || "polaroify")}-hd.png`,
    );
    if (!mode) throw new Error("Download could not be started");
    if (mode === "preview") {
      setStatus("HD export opened in a new tab. Long-press the image and save to Photos.");
      return;
    }
    setStatus("Owner HD PNG downloaded (no watermark).");
  } catch (err) {
    console.error(err);
    setStatus("Owner HD PNG export failed.");
  }
}

async function renderPosterBlob(options = {}) {
  const scale = Number(options.scale) > 0 ? Number(options.scale) : 2;
  const watermarkText = String(options.watermarkText || "").trim();
  const watermarkOpacity = Number(options.watermarkOpacity || 0.18);

  // Convert all cross-origin images to data URIs first
  const images = els.poster.querySelectorAll('img');
  const origSrcs = [];
  for (const img of images) {
    origSrcs.push(img.src);
    if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
      try {
        const resp = await fetch(img.src, {
          mode: "cors",
          credentials: "omit",
          cache: "force-cache",
        });
        const blob = await resp.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch (e) {
        console.warn('Could not inline image:', img.src, e);
      }
    }
  }

  try {
    // Use a canvas to render the poster
    const canvas = document.createElement('canvas');
    const w = els.poster.offsetWidth;
    const h = els.poster.offsetHeight;
    canvas.width = w * scale;
    canvas.height = h * scale;

    // Use dom-to-image to get a SVG data URL, then paint onto canvas
    if (window.domtoimage) {
      const dataUrl = await window.domtoimage.toPng(els.poster, {
        width: w * scale,
        height: h * scale,
        cacheBust: true,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: w + 'px',
          height: h + 'px'
        }
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((r, rej) => { img.onload = r; img.onerror = rej; });
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(img, 0, 0);
      if (watermarkText) applyWatermark(ctx, canvas.width, canvas.height, watermarkText, watermarkOpacity);
      return canvasToPngBlob(canvas);
    }
    return null;
  } finally {
    // Restore original sources
    const imgs = els.poster.querySelectorAll('img');
    imgs.forEach((img, i) => {
      if (origSrcs[i]) img.src = origSrcs[i];
    });
  }
}

function applyWatermark(ctx, width, height, text, opacity) {
  ctx.save();
  const fontSize = Math.max(20, Math.round(width / 14));
  ctx.globalAlpha = Math.max(0.08, Math.min(0.35, opacity));
  ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  // Dual-tone watermark keeps visibility on both light and dark themes.
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = Math.max(1, Math.round(fontSize / 18));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const stepX = Math.round(width * 0.52);
  const stepY = Math.round(height * 0.24);
  for (let y = -height; y <= height; y += stepY) {
    for (let x = -width; x <= width; x += stepX) {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

async function readJsonOrText(response) {
  const raw = await response.text();
  try {
    return { data: JSON.parse(raw), text: "" };
  } catch {
    return { data: null, text: raw.slice(0, 180).trim() };
  }
}

function formatTime(seconds) {
  const sec = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatReleaseDate(input) {
  const raw = String(input || "").trim();
  if (!raw || raw === "--") return "--";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-");
    return `${d}-${m}-${y}`;
  }
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-");
    return `01-${m}-${y}`;
  }
  if (/^\d{4}$/.test(raw)) {
    return `01-01-${raw}`;
  }
  return raw;
}

function slugify(value) {
  return String(value || "spotpost")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function setStatus(message) {
  if (els.statusText) els.statusText.textContent = message;
  if (els.ownerStatus) els.ownerStatus.textContent = message;
}

async function canvasToPngBlob(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob) return blob;
  const dataUrl = canvas.toDataURL("image/png");
  const resp = await fetch(dataUrl);
  return resp.blob();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isDarkHexColor(hex) {
  const safe = /^[A-F0-9]{6}$/i.test(hex) ? hex : "F5F0E6";
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 140;
}

function getLuminanceFromHex(hex) {
  const safe = hex.replace("#", "");
  const valid = /^[A-F0-9]{6}$/i.test(safe) ? safe : "F5F0E6";
  const r = parseInt(valid.slice(0, 2), 16) / 255;
  const g = parseInt(valid.slice(2, 4), 16) / 255;
  const b = parseInt(valid.slice(4, 6), 16) / 255;
  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminanceFromHex(hex1);
  const lum2 = getLuminanceFromHex(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function isOwnerModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get(OWNER_QUERY_FLAG) === "1";
}

function generateOrderId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeOrderId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-f0-9]/g, "")
    .slice(0, 16);
}

async function compressImageDataUrl(dataUrl, maxEdge = 1080, quality = 0.82) {
  const src = String(dataUrl || "");
  if (!src.startsWith("data:image/")) return src;
  const img = new Image();
  img.src = src;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return src;

  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", quality);
}

async function buildOrderSnapshotForUpload() {
  const snapshot = getCurrentOrderSnapshot();
  if (snapshot.useCustomImage && snapshot.customImageUrl) {
    try {
      snapshot.customImageUrl = await compressImageDataUrl(snapshot.customImageUrl, 1080, 0.82);
    } catch (error) {
      console.warn("Custom image compression failed; using original image data.", error);
    }
  }
  return snapshot;
}

async function loadOrderSnapshotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order");
  if (!orderId) return;
  if (els.ownerOrderId) els.ownerOrderId.value = String(orderId);
  await loadOrderSnapshotById(orderId);
}

async function loadOrderSnapshotById(orderId) {
  const cleanId = normalizeOrderId(orderId);
  if (!/^[a-f0-9]{16}$/.test(cleanId)) {
    setStatus("Invalid order ID. Use the 16-character code from WhatsApp.");
    return false;
  }

  try {
    setStatus("Loading saved order customization...");
    const response = await fetch(`/api/order-snapshots/${encodeURIComponent(cleanId)}`, {
      headers: { Accept: "application/json" },
    });
    const { data, text } = await readJsonOrText(response);
    if (!response.ok || !data?.snapshot) {
      throw new Error(data?.error?.message || text || "Order snapshot not found.");
    }
    applyOrderSnapshot(data.snapshot);
    goToStep(3);
    setStatus("Saved customization loaded. Ready for HD export.");
    return true;
  } catch (error) {
    console.warn("Could not load order snapshot:", error);
    setStatus("Could not load this Order ID.");
    return false;
  }
}

async function loadOrderByOwnerInput() {
  if (!isOwnerModeFromUrl()) {
    setStatus("Owner mode required.");
    return;
  }
  await loadOrderSnapshotById(els.ownerOrderId?.value || "");
}

updatePlayerFromProgress();
applyCustomizations();
refreshPresetOptions();
goToStep(1);
setThemeMode("template");
syncPosterVisibility();
els.step1Next.disabled = true;
if (isOwnerModeFromUrl()) {
  document.body.classList.add("owner-mode");
  els.downloadHdBtn?.classList.remove("hidden");
  els.ownerLookupWrap?.classList.remove("hidden");
  goToStep(3);
}
loadOrderSnapshotFromUrl();
