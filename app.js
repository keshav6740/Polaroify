const els = {
  searchInput: document.getElementById("searchInput"),
  searchType: document.getElementById("searchType"),
  searchBtn: document.getElementById("searchBtn"),
  step1Next: document.getElementById("step1Next"),
  step2Back: document.getElementById("step2Back"),
  step2Next: document.getElementById("step2Next"),
  step3Back: document.getElementById("step3Back"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  shareNativeBtn: document.getElementById("shareNativeBtn"),
  shareWhatsappBtn: document.getElementById("shareWhatsappBtn"),
  shareInstagramBtn: document.getElementById("shareInstagramBtn"),
  wizardProgressFill: document.getElementById("wizardProgressFill"),
  statusText: document.getElementById("statusText"),
  resultsWrap: document.getElementById("resultsWrap"),
  resultsGrid: document.getElementById("resultsGrid"),
  changeSelectionBtn: document.getElementById("changeSelectionBtn"),
  downloadPngBtn: document.getElementById("downloadPngBtn"),
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
  lyricsText: document.getElementById("lyricsText"),
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
  fontSelect: document.getElementById("fontSelect"),
  toggleLyrics: document.getElementById("toggleLyrics"),
  toggleCode: document.getElementById("toggleCode"),
  togglePlayer: document.getElementById("togglePlayer"),
  toggleActions: document.getElementById("toggleActions"),
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
const DEFAULTS = {
  playerDuration: "30",
  playerProgress: "0",
  codeOpacity: "80",
  polaroidColor: "#f5f0e6",
  accentColor: "#0d0d0d",
  fontSelect: "'Space Grotesk', sans-serif",
  toggleLyrics: true,
  toggleCode: true,
  togglePlayer: true,
  toggleActions: true,
};

els.searchBtn.addEventListener("click", runSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runSearch();
});
els.changeSelectionBtn.addEventListener("click", () => expandResults());
els.downloadPngBtn.addEventListener("click", downloadPosterPng);
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
els.shareNativeBtn.addEventListener("click", nativeShare);
els.shareWhatsappBtn.addEventListener("click", shareWhatsApp);
els.shareInstagramBtn.addEventListener("click", shareInstagram);
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
  } catch {
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
  } catch {
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
    `https://scannables.scdn.co/uri/plain/png/${primaryBg}/${primaryBars}/640/${encoded}`,
    `https://scannables.scdn.co/uri/plain/png/${altBg}/${altBars}/640/${encoded}`,
    `https://scannables.scdn.co/uri/plain/jpeg/${primaryBg}/${primaryBars}/640/${encoded}`,
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
  const bg = els.polaroidColor.value;
  const accent = els.accentColor.value;
  const font = els.fontSelect.value;
  const codeOpacity = Number(els.codeOpacity.value || 55) / 100;
  const useCustom = Boolean(els.useCustomImage.checked && state.customImageUrl);

  if (title) els.previewTitle.textContent = title;
  if (artist) els.previewArtist.textContent = artist;
  els.releaseDatePreview.textContent = formatReleaseDate(date || "--");
  const previewLyrics = formatLyricsPreview(lyrics);
  els.previewLyrics.textContent = previewLyrics;
  els.previewLyrics.title = lyrics || "";
  els.coverArt.src = useCustom ? state.customImageUrl : state.spotifyCoverUrl;

  els.poster.style.background = bg;
  els.poster.style.color = accent;
  els.poster.style.fontFamily = font;
  els.poster.style.boxShadow = "0 14px 36px rgba(0, 0, 0, 0.35)";
  els.timelineFill.style.background = accent;
  els.spotifyCodeWrap.style.opacity = `${codeOpacity}`;
  updateSpotifyCode();
}

function formatLyricsPreview(lyrics) {
  const raw = String(lyrics || "").replaceAll("\r\n", "\n").trim();
  if (!raw) return "Add custom lyrics or fetch a track first.";
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 3) return lines.join("\n");
  return `${lines.slice(0, 3).join("\n")}\n...`;
}

function syncPosterVisibility() {
  els.lyricsBlock.classList.toggle("reserved-hidden", !els.toggleLyrics.checked);
  els.spotifyCodeWrap.classList.toggle("reserved-hidden", !els.toggleCode.checked);
  els.playerBar.classList.toggle("reserved-hidden", !els.togglePlayer.checked);
  els.poster.classList.toggle("compact-player", !els.togglePlayer.checked);
  els.musicActions.classList.toggle("reserved-hidden", !els.toggleActions.checked);
  els.poster.classList.toggle("compact-actions", !els.toggleActions.checked);
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
  els.toggleLyrics.checked = DEFAULTS.toggleLyrics;
  els.toggleCode.checked = DEFAULTS.toggleCode;
  els.togglePlayer.checked = DEFAULTS.togglePlayer;
  els.toggleActions.checked = DEFAULTS.toggleActions;
  els.useCustomImage.checked = false;
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
    posterTitle: els.posterTitle.value,
    posterArtist: els.posterArtist.value,
    releaseDate: els.releaseDate.value,
    lyricsText: els.lyricsText.value,
    playerDuration: els.playerDuration.value,
    playerProgress: els.playerProgress.value,
    codeOpacity: els.codeOpacity.value,
    polaroidColor: els.polaroidColor.value,
    accentColor: els.accentColor.value,
    fontSelect: els.fontSelect.value,
    toggleLyrics: els.toggleLyrics.checked,
    toggleCode: els.toggleCode.checked,
    togglePlayer: els.togglePlayer.checked,
    toggleActions: els.toggleActions.checked,
    useCustomImage: els.useCustomImage.checked,
    themeMode: state.themeMode,
  };
}

function applyPresetPayload(preset) {
  const keys = [
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
  ];
  keys.forEach((key) => {
    if (preset[key] !== undefined && els[key]) {
      els[key].value = String(preset[key]);
    }
  });
  els.toggleLyrics.checked = Boolean(preset.toggleLyrics);
  els.toggleCode.checked = Boolean(preset.toggleCode);
  els.togglePlayer.checked = Boolean(preset.togglePlayer);
  els.toggleActions.checked = preset.toggleActions === undefined ? true : Boolean(preset.toggleActions);
  els.useCustomImage.checked = Boolean(preset.useCustomImage && state.customImageUrl);
  setThemeMode(preset.themeMode === "custom" ? "custom" : "template");
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

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setStatus("Generator link copied.");
  } catch {
    setStatus("Could not copy link.");
  }
}

async function nativeShare() {
  if (!navigator.share) {
    setStatus("Native share is not supported in this browser.");
    return;
  }
  try {
    await navigator.share({
      title: "Polaroify Generator",
      text: "Create your own Spotify-style polaroid poster.",
      url: window.location.href,
    });
  } catch {
    setStatus("Share canceled.");
  }
}

function shareWhatsApp() {
  const text = encodeURIComponent(
    `Create your music poster with Polaroify: ${window.location.href}`,
  );
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  setStatus("Opening WhatsApp share.");
}

async function shareInstagram() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setStatus("Link copied. Paste it in Instagram story/bio.");
  } catch {
    setStatus("Could not copy link. Open Instagram and share manually.");
  }
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
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
].forEach((key) => {
  els[key].addEventListener("input", () => {
    if (key === "playerDuration" || key === "playerProgress") updatePlayerFromProgress();
    applyCustomizations();
  });
});

els.useCustomImage.addEventListener("change", applyCustomizations);

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
  if (!bg || !accent) return;
  setThemeMode("template");
  els.polaroidColor.value = bg;
  els.accentColor.value = accent;
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

els.btnPlayPause.addEventListener("click", () => {
  state.isPlayingVisual = !state.isPlayingVisual;
  els.btnPlayPause.innerHTML = state.isPlayingVisual ? "&#10074;&#10074;" : "&#x23F5;";
});

els.btnLiked.addEventListener("click", () => {
  state.likedVisual = !state.likedVisual;
  els.btnLiked.style.opacity = state.likedVisual ? "1" : "0.45";
});

async function downloadPosterPng() {
  if (!window.html2canvas) {
    setStatus("PNG export is unavailable right now.");
    return;
  }
  setStatus("Rendering PNG...");
  try {
    const canvas = await window.html2canvas(els.poster, {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `${slugify(els.previewTitle.textContent || "spotpost")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setStatus("PNG downloaded.");
  } catch {
    setStatus("PNG export failed. Try another cover image and retry.");
  }
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
  els.statusText.textContent = message;
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

updatePlayerFromProgress();
applyCustomizations();
refreshPresetOptions();
goToStep(1);
setThemeMode("template");
syncPosterVisibility();
els.step1Next.disabled = true;
