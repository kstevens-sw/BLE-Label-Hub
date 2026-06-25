/**
 * Theme system for BLE Label Hub
 * Uses <html data-theme> attribute + CSS custom properties
 */

const THEMES = {
  default: {
    name: 'Default',
    colorScheme: 'light',
    variables: {
      '--surface-page': '#f6f1ea',
      '--surface-workspace': '#efe5d9',
      '--surface-primary': '#fffdf9',
      '--surface-secondary': '#f7efe6',
      '--surface-elevated': '#fffdf9',
      '--text-primary': '#26231f',
      '--text-secondary': '#6d655e',
      '--text-muted': '#938a81',
      '--border-default': '#ddd4c7',
      '--border-strong': '#cdbfae',
      '--accent-primary': '#b65f45',
      '--accent-hover': '#984b35',
      '--accent-soft': '#f3dfd6',
      '--status-success': '#4f6b5b',
      '--status-warning': '#9d7337',
      '--status-error': '#a1443e',
      '--shadow-soft': '0 8px 18px rgba(83, 65, 49, 0.06)',
      '--shadow-elevated': '0 18px 38px rgba(83, 65, 49, 0.1)',
    },
  },
  solarized_dark: {
    name: 'Solarized Dark',
    colorScheme: 'dark',
    variables: {
      '--surface-page': '#002b36',
      '--surface-workspace': '#073642',
      '--surface-primary': '#002b36',
      '--surface-secondary': '#073642',
      '--surface-elevated': '#0a4050',
      '--text-primary': '#839496',
      '--text-secondary': '#586e75',
      '--text-muted': '#485d63',
      '--border-default': '#0a505f',
      '--border-strong': '#0a6075',
      '--accent-primary': '#b58900',
      '--accent-hover': '#cb4b16',
      '--accent-soft': '#0a4a52',
      '--status-success': '#859900',
      '--status-warning': '#b58900',
      '--status-error': '#dc322f',
      '--shadow-soft': '0 8px 18px rgba(0, 0, 0, 0.3)',
      '--shadow-elevated': '0 18px 38px rgba(0, 0, 0, 0.4)',
    },
  },
  nord_dark: {
    name: 'Nord Dark',
    colorScheme: 'dark',
    variables: {
      '--surface-page': '#2e3440',
      '--surface-workspace': '#262c36',
      '--surface-primary': '#2e3440',
      '--surface-secondary': '#3b4252',
      '--surface-elevated': '#434c5e',
      '--text-primary': '#eceff4',
      '--text-secondary': '#d8dee9',
      '--text-muted': '#4c566a',
      '--border-default': '#4c566a',
      '--border-strong': '#616e88',
      '--accent-primary': '#88c0d0',
      '--accent-hover': '#8fbcbb',
      '--accent-soft': '#354054',
      '--status-success': '#a3be8c',
      '--status-warning': '#ebcb8b',
      '--status-error': '#bf616a',
      '--shadow-soft': '0 8px 18px rgba(0, 0, 0, 0.3)',
      '--shadow-elevated': '0 18px 38px rgba(0, 0, 0, 0.4)',
    },
  },
  one_dark: {
    name: 'One Dark',
    colorScheme: 'dark',
    variables: {
      '--surface-page': '#282c34',
      '--surface-workspace': '#21252b',
      '--surface-primary': '#282c34',
      '--surface-secondary': '#2c313a',
      '--surface-elevated': '#353b45',
      '--text-primary': '#abb2bf',
      '--text-secondary': '#828997',
      '--text-muted': '#5c6370',
      '--border-default': '#3e4451',
      '--border-strong': '#5c6370',
      '--accent-primary': '#56b6c2',
      '--accent-hover': '#4aa6b2',
      '--accent-soft': '#2c3544',
      '--status-success': '#98c379',
      '--status-warning': '#e5c07b',
      '--status-error': '#e06c75',
      '--shadow-soft': '0 8px 18px rgba(0, 0, 0, 0.35)',
      '--shadow-elevated': '0 18px 38px rgba(0, 0, 0, 0.45)',
    },
  },
};

const STORAGE_KEY = 'app_theme';

/**
 * Apply a theme by name. Updates <html data-theme>, color-scheme,
 * and CSS custom properties. Persists to localStorage.
 * @param {string} name - Theme key from THEMES
 */
function applyTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;

  const html = document.documentElement;
  html.setAttribute('data-theme', name);
  html.style.colorScheme = theme.colorScheme || 'light';

  for (const [prop, value] of Object.entries(theme.variables)) {
    document.documentElement.style.setProperty(prop, value);
  }

  localStorage.setItem(STORAGE_KEY, name);
}

/**
 * Get available theme options for UI select elements
 * @returns {Array<{value: string, label: string}>}
 */
function getThemeOptions() {
  return Object.entries(THEMES).map(([value, theme]) => ({
    value,
    label: theme.name,
  }));
}

/**
 * Load and apply saved theme, or default
 */
function loadSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const name = saved && THEMES[saved] ? saved : 'default';
  applyTheme(name);
  return name;
}

export { THEMES, applyTheme, getThemeOptions, loadSavedTheme, STORAGE_KEY };
