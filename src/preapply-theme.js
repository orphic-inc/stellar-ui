// Cold-load FOUC guard: runs as a blocking <script src> in <head>, before
// #root parses, so the previously-resolved theme <link> exists (and browsers
// block first paint on it) before React ever mounts. No build step — it's
// copied verbatim (not through babel/webpack's module graph), so it must run
// standalone, ahead of the app bundle and any polyfills.
// LINK_ID / STORAGE_KEY must stay in sync with StylesheetInjector.tsx, which
// adopts this link in place once the real query resolves.
(function () {
  // The recovery hatch (#449): `?notheme=1` keeps member themes off in this tab.
  // Keep the key and parameter in sync with src/utils/themeHatch.ts.
  var off = /(?:^|[?&])notheme=1(?:&|$)/.test(window.location.search);
  try {
    if (off) window.sessionStorage.setItem('stellar-notheme', '1');
    else off = window.sessionStorage.getItem('stellar-notheme') === '1';
  } catch {
    // sessionStorage unavailable: the parameter alone still counts.
  }
  if (off) return;
  try {
    var href = window.localStorage.getItem('stellar-theme-href');
    if (!href) return;
    var link = document.createElement('link');
    link.id = 'stellar-theme';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    // A registry sheet needs the session cookie, so once the session has lapsed
    // it answers 401 and fires `error`. Drop the link and its key, so the next
    // login creates a fresh link, which fetches (#379). Kept, it was adopted in
    // place with an unchanged href, which never refetches. Only while the link
    // still holds THIS href: StylesheetInjector, which writes the link and the
    // key together, may have moved both on already.
    link.onerror = function () {
      if (link.getAttribute('href') !== href) return;
      link.remove();
      window.localStorage.removeItem('stellar-theme-href');
    };
    document.head.appendChild(link);
  } catch {
    // localStorage unavailable (private mode, disabled) — fail open to Sublime.
  }
})();
