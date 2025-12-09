// Theme engine: apply saved theme, provide API to toggle/set theme, and inject minimal dark CSS
(function () {
  const THEME_KEY = 'attendy_theme';
  const LINK_ID = 'attendy-dark-link';
  // Resolve CSS path relative to the executing script so it works from any window location
  let CSS_PATH = '../package/zesty-design/dark-theme.css';
  try {
    const scriptSrc = (document.currentScript && document.currentScript.src) || (function () { const s = document.getElementsByTagName('script'); return s[s.length - 1] && s[s.length - 1].src; })();
    if (scriptSrc) {
      // compute URL relative to script file
      const resolved = new URL('../zesty-design/dark-theme.css', scriptSrc).href;
      CSS_PATH = resolved;
    }
  } catch (e) { /* keep default relative path */ }

  function loadLink() {
    if (document.getElementById(LINK_ID)) return document.getElementById(LINK_ID);
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.id = LINK_ID;
    l.href = CSS_PATH;
    (document.head || document.documentElement).appendChild(l);
    return l;
  }

  function removeLink() {
    const el = document.getElementById(LINK_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function prefersDark() {
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }

  function getTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      // fallback to system preference by default
      return prefersDark() ? 'dark' : 'light';
    } catch (e) { return prefersDark() ? 'dark' : 'light'; }
  }

  function applyTheme(theme) {
    try {
      if (theme === 'dark') {
        loadLink();
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        removeLink();
      }
    } catch (e) { console.warn('applyTheme failed', e); }
  }

  function setTheme(theme) {
    try {
      if (theme !== 'dark' && theme !== 'light') theme = 'light';
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    } catch (e) { console.warn('setTheme failed', e); }
  }

  function toggleTheme() { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

  // watch system preference changes when user hasn't explicitly set a theme
  try {
    const mm = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mm && mm.addEventListener) {
      mm.addEventListener('change', e => {
        try {
          if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
        } catch (err) { /* ignore */ }
      });
    }
  } catch (e) { /* ignore */ }

  // apply initial theme
  try { applyTheme(getTheme()); } catch (e) { /* ignore */ }

  window.attendyTheme = { setTheme, getTheme, toggleTheme, applyTheme };
})();
