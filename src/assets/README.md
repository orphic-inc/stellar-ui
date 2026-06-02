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
live alongside their CSS in `src/stylesheets/{stylesheet}/images/`, served at
`/stylesheets/`.

**Avatars are bundled** (`avatars/`), not served. The API can't reference a
hashed bundle by URL, so for devTools-seeded users it stamps the sentinel
string `'seeded'` and `utils/avatar.ts` maps it to the bundled `seeded.png`;
null/empty maps to `default.png`; a real external URL passes through.

**Rule of thumb:** `import` it → `assets/`. Referenced by a fixed URL from theme
CSS → `stylesheets/{name}/images/`.
