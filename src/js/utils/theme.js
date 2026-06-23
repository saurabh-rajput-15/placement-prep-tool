// Theme management — light / dark mode with localStorage persistence

const THEME_KEY = 'placementPrepTool_theme';

/** @type {'light' | 'dark'} */
let _currentTheme = 'light';

/**
 * @returns {'light' | 'dark'}
 */
export function getTheme() {
  return _currentTheme;
}

/**
 * @param {'light' | 'dark'} theme
 */
function applyTheme(theme) {
  _currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  updateToggleButtons();
}

/**
 * Sync all theme toggle buttons in the DOM.
 */
function updateToggleButtons() {
  const isDark = _currentTheme === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    const icon = btn.querySelector('.theme-toggle__icon');
    const label = btn.querySelector('.theme-toggle__label');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
  });
}

/**
 * Load saved theme or fall back to system preference.
 * Call once during boot (before first paint if possible via inline script).
 */
export function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
      return;
    }
  } catch {
    // localStorage blocked — use system preference only
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

/**
 * Toggle between light and dark mode.
 */
export function toggleTheme() {
  const next = _currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Theme still applies in-memory for this session
  }
}

/**
 * Create a theme toggle button element.
 * @returns {HTMLButtonElement}
 */
export function createThemeToggleButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('data-theme-toggle', '');
  btn.innerHTML =
    '<span class="theme-toggle__icon" aria-hidden="true">🌙</span>' +
    '<span class="theme-toggle__label">Dark</span>';
  btn.addEventListener('click', toggleTheme);
  updateToggleButtons();
  return btn;
}
