(function () {
  try {
    var stored = localStorage.getItem('theme-storage');
    var theme = 'system';
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.state && parsed.state.theme) {
        theme = parsed.state.theme;
      }
    }
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0f172a';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#ffffff';
    }
  } catch (e) {
    console.error('Theme init failed', e);
  }
})();
