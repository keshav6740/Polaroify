const THEME_KEY = "spotpost_theme_v1";
const DARK = "dark";
const LIGHT = "light";

function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === DARK || saved === LIGHT) return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? DARK : LIGHT;
}

function updateThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.setAttribute("content", theme === LIGHT ? "#f4efe8" : "#050507");
}

function setTheme(theme, options = {}) {
  const next = theme === LIGHT ? LIGHT : DARK;
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeColor(next);
  syncToggle(next);
  if (options.animate) animateThemeTransition();
}

function syncToggle(theme) {
  const isLight = theme === LIGHT;
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(isLight));
    btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    btn.setAttribute("title", `Theme: ${capitalize(theme)}`);
    const label = btn.querySelector(".theme-toggle-label");
    if (label) label.textContent = "Theme";
    const value = btn.querySelector(".theme-toggle-value");
    if (value) value.textContent = isLight ? "Light" : "Dark";
  });
}

function initThemeToggles() {
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || DARK;
      setTheme(current === DARK ? LIGHT : DARK, { animate: true });
    });
  });
}

function animateThemeTransition() {
  document.documentElement.classList.add("theme-transition");
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 320);
}

function capitalize(value) {
  const safe = String(value || "");
  return safe ? safe[0].toUpperCase() + safe.slice(1) : "";
}

const initialTheme = getSavedTheme();
document.documentElement.setAttribute("data-theme", initialTheme);
updateThemeColor(initialTheme);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    syncToggle(initialTheme);
    initThemeToggles();
  });
} else {
  syncToggle(initialTheme);
  initThemeToggles();
}
