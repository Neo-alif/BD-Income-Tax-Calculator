/* Light and dark switch, shared by every page. The choice is remembered in the browser. */
(function () {
  var btn = document.getElementById('themeBtn');
  var label = document.getElementById('themeLabel');
  if (!btn) return;
  var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  function apply(t) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    label.textContent = t === 'dark' ? 'Light' : 'Dark';
  }
  apply(theme);
  btn.addEventListener('click', function () {
    apply(theme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('bdtax-theme', theme); } catch (err) {}
  });
})();
