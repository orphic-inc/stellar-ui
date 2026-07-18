# Changelog

All notable changes to stellar-ui are documented here.

---

## [Unreleased]

### Changed

- **The `/private` URL prefix is removed** — authenticated pages now live at their natural paths (`/forums`, `/staff/tools`, `/messages/:id`, ...) and `/` is auth-aware: members get the private homepage, visitors get the public landing (no more client-side bounce through a prefixed URL). A legacy `/private/*` redirect keeps old bookmarks resolving. Public routes (`/login`, `/register`, `/recovery`, `/install`) are unchanged [#183].
- **ModBar follows the inverted launch-checklist item** — the settings quick-link now keys on `registration-closed` (fresh installs default registration to `closed` and the checklist advises opening it at launch; stellar-api#332) instead of the retired `registration-open` warning [#183].

## [0.6.9] — 2026-07-09

Stylesheet authorship & integration; version-parity cut with stellar-api (consolidates everything unreleased since v0.6.3).

### Added

- **kuro mapped onto the `--st-*` contract** — the dark theme now re-skins the app by redefining Role Tokens rather than shipping legacy gray `!important` shims, and the **anorex** theme is ported onto the same contract; the theme contract §4.1 documents the theme→token mapping [#159] (ADR-0005)
- **Registry stylesheet injection + Personal/Registry radio** — the injector links an adopted author sheet's `text/css` delivery route (`activeAuthorStylesheetId` → `/api/stylesheet/author-stylesheet/:id/css`) as a third source, single-winner precedence, no stacking; Settings presents the Site Stylesheet slot as a mutually-exclusive Personal⟷Registry radio mirroring the server invariant; `isInjectableUrl` is `https:`-only [#162] (ADR-0008; stellar-api ADR-0024)
- **Staff PM given its own surface**, dispatched by permission rather than living inside the ticket queue

### Changed

- Resynced generated API types to stellar-api's OpenAPI contract: `activeAuthorStylesheetId` on `UserSettings` (stellar-api #256), and PR #310's all-10 notification enum + nullable profile refs

### Fixed

- Corrected theming §11 post-conversion verification to probe un-migrated islands with **Layer Cake** (token-only), not kuro — kuro's legacy shims mask the very islands the probe is meant to surface [#159]
- **Staff Inbox is one role-dispatched entry** — removed the duplicate "Staff Queue" nav item so staff no longer land on a ticket queue indistinguishable from the reports queue. Staff see the queue at Staff Inbox, members see their own tickets; the unread badge is role-aware (queue count for staff, own unread for members). Records the model in stellar-api ADR-0025.
- **Killed the cold-load theme FOUC** — pre-apply the resolved theme before mount instead of after, and dropped the unmount cleanup that was churning the theme `<link>` on switch [#161]

### Docs

- Human-facing developer docs; fixed stale `AGENTS.md` + README traps that blocked install

### Planned

- Member-authored **AuthorStylesheet** flow, remaining pieces — seed the anorex `AuthorStylesheet` registry fixture (the static file becomes canonical stored source, stellar-api ADR-0024), paginate the author list + rank-gated registry-spaces limit (#146); plus building dark-ambient's missing stylesheet

---

## [0.6.3] — 2026-07-01

Remaining-surface theming sweep — the long tail of member-facing pages migrated onto the `data-st` contract.

### Added

- **Edition disclosure** wired on `ReleasePage` + `CollageDetail` [#129]
- **Modal primitive** added to the UI kit and adopted across all six modal sites [#151] (ADR-0007)

### Changed

- Migrated the remaining surfaces onto the `data-st` contract: the Artist and Release detail pages; the browse tables — Contributions, CollageBrowse, ArtistBrowse, UserBrowse [#148]; the Top 10 set — History, Tags, Votes, Users, Releases, and the shell [#149]; Wiki (view / edit / list / history) + Rules [#150]; Messages — Inbox, Sent, Drafts, Compose, Conversation, and the forum PostBox [#152]; Reports & Tickets — queues, detail, forms, canned responses [#153]; Requests — list, detail, create [#154]; the Private homepage (dropping the non-staff Blog card) [#156] and the private tail — SnatchList, Bookmarks, Friends, and the site / user stats histories [#157]; misc pages + `CommentsSection` + `DonatePage`, and `UserWarningsPage` adopted onto the kit [#158]
- Added the §11 post-conversion verification procedure to `docs/theming.md`

---

## [0.6.2] — 2026-06-30

Staff Toolbox information architecture + the UI primitive kit.

### Added

- **UI primitive kit** (`src/components/ui/`) — `PageShell` / `Panel` / `Button` / `Field` / `DataTable` / `Badge` / `Pagination` / `SectionHeading`; each primitive emits the `data-st` contract, so adopting one _completes_ that surface's ADR-0005/0006 migration [#139] (ADR-0007)

### Changed

- Adopted the kit across the staff/admin long tail — log tables, stats pages, moderation queues, CRUD clean-fit and inline-edit forms, and read-only pages — and collapsed the IP-ban / email-blacklist twins into a single `staff/Blacklist.tsx`
- Adopted the kit on the three heavyweight admin managers — `CommunityManager`, `ForumControlPanel`, `ForumCategoryControlPanel` [#142]
- Toolbox information architecture: collapsed the staff Toolbox sections 11 → 7 [#140]
- Migrated the app-chrome header set (WS11) and the shells, footer, and banners (WS12) onto the `data-st` contract [#137]
- Themed the communities listing table and community page (adopting kit `Pagination`)
- Added **ADR-0007** (UI primitive kit); recorded rebase-only branch discipline and stopped the `docs/theming.md` §7 conflict magnet

---

## [0.6.1] — 2026-06-30

The `--st-*` Role Token theming contract + initial surface conversion.

### Added

- **Golden Rules tree** on `/private/rules` — the 6 Golden Rules + sub-rules render read-only above the prose pages, consuming `GET /api/rules/tree`; rule bodies do `${...}` token substitution, with link-vs-text decided by the resolved value's shape plus a small markdown subset [#98] (PRD-09 / ADR-0020)
- **Community Leader** surfaced on the community header and editable in `CommunityManager` (`leaderId` on create + update; the stale `ownerId` field retired, which also fixes create for restricted communities) [#101] (ADR-0021)
- **Lock rank** toggle on the staff "Change Rank" panel — `setUserRankLock` → `PUT /users/:id/rank-lock`, optimistic with revert-on-failure, freezing auto class-progression while manual rank changes still apply; completes the per-user `rankLocked` half of [#83] (the promotion-rule-editor half stays blocked on stellar-api #170)
- **The `--st-*` Role Token + `data-st` hook theming contract** (ADR-0005) with its migration PRD, the table/form contract (ADR-0006), and a token-only reference theme + author guide (WS3)

### Changed

- Pinned Prettier to an exact `3.5.3` (was `^3.0.0`, resolving to 3.0.0) and reformatted to match — closes the version skew with Codacy's newer Prettier, whose `(x ?? y)` parenthesization and nested-ternary indentation the old local 3.0.0 kept stripping back
- **Collage pilot** — render `CollageDetail` from Roles/Parts (WS2); wired `global.css` into the build (WS0) and finalized the Tier-1 inventory (WS1)
- Migrated the first surfaces onto the contract: the community release listing (WS4), `LogBrowsePage`, `ForumPage`, and `ForumTopicPage` + posts (which established the `prose`/`control` Roles); `ForumCategoryPage` + `NewTopicForm` (WS5 table + form contract); the release browser (WS6); `UserProfile` + the `chip`/`control` status modifiers (WS7); the settings forms (WS8); the invite surfaces (WS9); and the ratio surfaces (WS10)
- Sourced Sublime's token defaults from a Tailwind `@theme` block
- Evicted handoff/scrap docs from the committed tree

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
