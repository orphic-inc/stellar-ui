# `src/assets/` — bundled assets

Assets **imported in components** (`import x from '...'`). Webpack content-hashes
these at build time — they have **no stable URL**. Use for static UI chrome.

```
assets/
  logos/          # per-stylesheet wordmarks: {stylesheet}-logo.png (+ -hover.png)
  iconography/    # UI icons rendered in JSX: bookmark.png, signal-on.png, …
  avatars/        # default.png (fallback), seeded.png (devTools seeded users)
```

```tsx
import bookmarkIcon from '../../assets/iconography/bookmark.png';
<img src={bookmarkIcon} alt="bookmark" />;
```

## When NOT to use `assets/`

If an asset is referenced by a **URL string** — a fixed `src` path, CSS `url()`,
or a `<link href>` — it must be **served verbatim**, not bundled.

Per-stylesheet served assets (fonts, background images referenced from theme CSS)
**no longer live here for built-in themes** (ui#168). A built-in's imagery is
stored in the api's content-addressed asset store and referenced from its CSS as
`/api/asset/<sha256>` (stellar-api ADR-0026) — bytes and CSS are served by the
same api that owns them, so a reference is verifiable from where it resolves.

The one exception is `postmod`, still under `src/stylesheets/postmod/images/`
and served at `/stylesheets/` until its migration unblocks (stellar-api #343).
It is the last tenant of that mechanism; when it goes, so do the webpack
`CopyPlugin` and devServer `static` entries that exist to serve it.

**Avatars are bundled** (`avatars/`), not served. The API can't reference a
hashed bundle by URL, so for devTools-seeded users it stamps the sentinel
string `'seeded'` and `utils/avatar.ts` maps it to the bundled `seeded.png`;
null/empty maps to `default.png`; a real external URL passes through.

**Rule of thumb:** `import` it → `assets/`. Referenced by a fixed URL from a
**built-in** theme's CSS → the api asset store, addressed as `/api/asset/<hash>`,
not this repo.
