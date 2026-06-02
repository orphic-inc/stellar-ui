# `src/assets/` — bundled assets

Assets **imported in components** (`import x from '...'`). Webpack content-hashes
these at build time — they have **no stable URL**. Use for static UI chrome.

```
assets/
  logos/          # per-stylesheet wordmarks: {stylesheet}-logo.png (+ -hover.png)
  iconography/    # UI icons rendered in JSX: bookmark.png, signal-on.png, …
```

```tsx
import bookmarkIcon from '../../assets/iconography/bookmark.png';
<img src={bookmarkIcon} alt="bookmark" />;
```

## When NOT to use `assets/`

If an asset is referenced by a **URL string** — a fixed `src` path, CSS `url()`,
a `<link href>`, or a path stored in the API — it must be **served verbatim**, not
bundled. Those go in `src/static/` (served at `/static/`):

- `src/static/common/avatars/` — `default.png`, `seeded.jpg`
- `src/static/common/icons/` — only icons chosen dynamically by path/data

Per-stylesheet served assets (fonts, background images referenced from theme CSS)
live alongside their CSS in `src/stylesheets/{stylesheet}/images/`.

**Rule of thumb:** `import` it → `assets/`. Reference it by a URL string → `static/`.
