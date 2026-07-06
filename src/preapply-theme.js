// Cold-load FOUC guard: runs as a blocking <script src> in <head>, before
// #root parses, so the previously-resolved theme <link> exists (and browsers
// block first paint on it) before React ever mounts. No build step — it's
// copied verbatim (not through babel/webpack's module graph), so it must run
// standalone, ahead of the app bundle and any polyfills.
// LINK_ID / STORAGE_KEY must stay in sync with StylesheetInjector.tsx, which
// adopts this link in place once the real query resolves.
(function () {
  try {
    var href = window.localStorage.getItem('stellar-theme-href');
    if (!href) return;
    var link = document.createElement('link');
    link.id = 'stellar-theme';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
  } catch {
    // localStorage unavailable (private mode, disabled) — fail open to Sublime.
  }
})();
