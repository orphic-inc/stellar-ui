# Changelog

All notable changes to stellar-ui are documented here.

---

## [Unreleased]

---

## [0.5.4] — 2026-06-20

### Added

- **Friends lifecycle UI** — request / accept / reject flow: `friendApi` hooks, a requests panel on `FriendsPage`, and a status-aware action button on the profile (consumes stellar-api #190/#191) [#81]
- **Verified IRC-nick linking** — a Security-tab card in Settings to claim, verify, and clear an IRC nick (consumes stellar-api #175/ADR-0015) [#82]
- **Server-driven prestige tiers** — the seeded `UserRank.badge` is rendered on the profile class line rather than a hardcoded client ladder [#85]
- **CRS reputation + community block** on the profile — the Community Reputation Score, its per-dimension breakdown, and friends / invite counts, paranoia-gated (block hidden when the viewer's tier conceals stats; the `ratio` dimension drops when consumed-stats are hidden) [#80]
- **Admin promotion-rule editor** on `UserRankFormPage` — edit the auto-class promotion thresholds (link-health-eligible bytes, ratio, contributions, account age, quality-contribution predicate) for a rank's outgoing rung (consumes stellar-api #170) [#83]
- Sentry browser-noise filter with user / release / environment context
- Bundled default avatar (`/static/common/avatars/default.png`) served from `src/static`, replacing the Gravatar-derived avatars removed API-side to stop leaking email hashes
- Seeded test users render a distinct avatar (`/static/common/avatars/seeded.jpg`) so generated accounts are visually obvious
- `utils/avatar.ts` — `avatarSrc()` (null/empty-safe) and `onAvatarError()` (swaps to default when a stored URL 404s)
- Legacy-parity **contribution form** — release type, record label, catalogue №, edition info, bitrate/media, and scene/log/cue, with WCAG 2.1 AA semantics (sectioned fieldsets, `aria-required`, a live error region, and add/remove-artist focus management) plus a disabled MusicBrainz "Find info" stub; covered by a Playwright e2e + `@axe-core/playwright` accessibility scan [#72]
- Bitrate/media enum `<select>`s on the add-to-release contribution form

### Changed

- Disambiguated the profile sidebar: the misnamed "Community Stats" activity card is now **"Activity"**, distinct from the new reputation/community block [#80]
- Resynced generated `src/types/api.ts` with stellar-api main across the arc (friends #190/#191, community block #193, promotion-rules + progression #202, bitrate/media enums, nullable release artist, Edition tier)
- Avatar render sites (`UserProfile`, `ForumTopicPost`) use the shared fallback helper, hardening against empty-string and broken-URL avatars
- `lint-staged` now runs `stylelint --fix` on `.scss`
- Bump `package.json` version `0.5.3` → `0.5.4`

### Removed

- Dead `isEdition` release-edit control and phantom "Edition" display — whether a release is an edition is now modelled by the separate `Edition` entity [#72]

### Fixed

- Footer version is now derived from the manifest (`__APP_VERSION__` via webpack `DefinePlugin`) instead of a hardcoded `v0.5` literal, so it tracks releases and can't drift
- Sentry user-sync extracted to its own component so `App` stays store-free
- `react-hook-form` added to the ESLint `import/no-unresolved` ignore list — it ships an `exports` field that Codacy's no-install sandbox can't resolve (same class as `@reduxjs/toolkit` / `recharts`)

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
