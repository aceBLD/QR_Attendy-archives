// Initialize theme toggle on settings page
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  try {
    if (!toggle) return;
    // prefer the explicit saved theme; if none saved, follow system preference (theme.js handles fallback)
    const current = (window.attendyTheme && window.attendyTheme.getTheme) ? window.attendyTheme.getTheme() : (localStorage.getItem('attendy_theme'));
    toggle.checked = (current === 'dark');
    // use BroadcastChannel to notify other windows (dashboard) about theme changes
    const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('attendy_channel') : null;
    toggle.addEventListener('change', () => {
      try {
        if (toggle.checked) {
          window.attendyTheme && window.attendyTheme.setTheme && window.attendyTheme.setTheme('dark');
          if (bc) bc.postMessage({ type: 'theme-changed', theme: 'dark' });
        } else {
          window.attendyTheme && window.attendyTheme.setTheme && window.attendyTheme.setTheme('light');
          if (bc) bc.postMessage({ type: 'theme-changed', theme: 'light' });
        }
      } catch (e) { console.warn('theme toggle error', e); }
    });

    // when settings window is closed, notify other windows to refresh
    window.addEventListener('beforeunload', () => {
      try { if (bc) bc.postMessage({ type: 'settings-closed' }); } catch (e) { /* ignore */ }
    });
  } catch (e) {
    console.warn('Failed to init theme toggle', e);
  }
});
