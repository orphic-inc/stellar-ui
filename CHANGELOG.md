# Changelog

All notable changes to stellar-ui are documented here.

---

## [Unreleased]

---

## [0.5.3] — 2026-06-01

### Added
- User stylesheet selection in Settings → Appearance — dropdown of available themes (Sublime, Kuro, Layer Cake, Proton, Postmod, Dark Ambient), replacing the free-text input
- Live theme injection via `StylesheetInjector` — the selected stylesheet's CSS is applied without a page reload; a custom `externalStylesheet` URL overrides the named theme
- `StylesheetManager` admin page (admin-gated via `AdminGate` / `hasStrictAdmin`) showing per-stylesheet user counts and a Set Default action
- Per-theme header logos resolved at runtime via `THEME_LOGOS` in `PrivateHeader`, keyed by the active theme with a kuro fallback
- Four new themes shipped with fonts and images: Layer Cake, Proton, Postmod, Dark Ambient

### Changed
- Bump `package.json` version `0.5.0` → `0.5.3` to resolve manifest drift against the tag scheme

---

## [0.5.2.1] — 2026-06-01

### Changed
- Replace "Stellar" gradient text logo in `PrivateHeader` with kuro logo image (`kuro-logo.png` / `kuro-logo-hover.png`), with mouse-over swap
- Add `declare module '*.png'` to `globals.d.ts` for typed PNG imports
