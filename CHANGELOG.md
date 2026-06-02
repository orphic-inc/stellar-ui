# Changelog

All notable changes to stellar-ui are documented here.

---

## [Unreleased]

### Added
- Bundled default avatar (`/static/common/avatars/default.png`) served from `src/static`, replacing the Gravatar-derived avatars removed API-side to stop leaking email hashes
- Seeded test users render a distinct avatar (`/static/common/avatars/seeded.jpg`) so generated accounts are visually obvious
- `utils/avatar.ts` — `avatarSrc()` (null/empty-safe) and `onAvatarError()` (swaps to default when a stored URL 404s)

### Changed
- Avatar render sites (`UserProfile`, `ForumTopicPost`) use the shared fallback helper, hardening against empty-string and broken-URL avatars

---

## [0.5.2.1] — 2026-06-01

### Changed
- Replace "Stellar" gradient text logo in `PrivateHeader` with kuro logo image (`kuro-logo.png` / `kuro-logo-hover.png`), with mouse-over swap
- Add `declare module '*.png'` to `globals.d.ts` for typed PNG imports
