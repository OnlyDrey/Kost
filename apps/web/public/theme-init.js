// Applies dark mode class before first render to prevent flash of wrong theme.
// Loaded as an external script so it works with a strict Content-Security-Policy
// (no 'unsafe-inline' required).
try {
  var s = localStorage.getItem('settings');
  var theme = s ? JSON.parse(s).theme : null;
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
