# Changelog

All notable changes to stellar-ui are documented here.

---

## [Unreleased]

### Added

- **Golden Rules tree** on `/private/rules` — the 6 Golden Rules + sub-rules render read-only above the prose pages, consuming `GET /api/rules/tree`; rule bodies do `${...}` token substitution, with link-vs-text decided by the resolved value's shape plus a small markdown subset [#98] (PRD-09 / ADR-0020)
- **Community Leader** surfaced on the community header and editable in `CommunityManager` (`leaderId` on create + update; the stale `ownerId` field retired, which also fixes create for restricted communities) [#101] (ADR-0021)
- **Lock rank** toggle on the staff "Change Rank" panel — `setUserRankLock` → `PUT /users/:id/rank-lock`, optimistic with revert-on-failure, freezing auto class-progression while manual rank changes still apply; completes the per-user `rankLocked` half of [#83] (the promotion-rule-editor half stays blocked on stellar-api #170)

### Changed

- Pinned Prettier to an exact `3.5.3` (was `^3.0.0`, resolving to 3.0.0) and reformatted to match — closes the version skew with Codacy's newer Prettier, whose `(x ?? y)` parenthesization and nested-ternary indentation the old local 3.0.0 kept stripping back

---

## [0.6.0] — 2026-06-25

### Added

- **Vendored OpenAPI contract + CI freshness gate** — `api.ts` is generated from a pinned `src/types/openapi.json` rather than a live API, with a CI step that reds on staleness (`api:sync` re-syncs to stellar-api) [#94] (ADR-0002)
- **Stylesheet code-injection boundary** for themes — a CSP-aware injection seam that applies theme CSS without locking site chrome [#73] (ADR-0003)
- **Invite-tree** embedded above the invite form, consuming the per-member subtree contract, with E2E coverage [#74]
- **EAC/XLD rip-log checker** embedded in the FLAC contribute flow
- Footer now shows the **running platform version** (`GET /api/version`, fallback `__APP_VERSION__`) [#105]

### Changed

- **Version policy** — the UI's `major.minor` now tracks the vendored API contract it ships (`src/types/openapi.json`); the patch digit stays the UI's own cadence. Manifest bumped `0.5.4` → `0.6.0` to realign with the `0.6.0` contract, enforced by `version:check` (ADR-0004)
- Staff roster made member-facing via the Staff nav [#115]
- Settings tab mutual-exclusion guard + IRC-nick surface [#97]
- Standardized the issue tracker to match stellar-api (ADR-0018)
- Quick-wins batch: jest test-noise cleanup [#112], contribute-form add-artist alignment and TiB removal [#99], `docs/adr/` home [#106], version-consistency gate [#107]
- Documented the Playwright E2E setup (`test:e2e`)

### Fixed

- Playwright auth fixes — authenticate by email, default fixture password, and the P-01 `/private` home + Sign In selector; assert the seeded invite tree rather than the empty branch [#74]

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
