# AGENTS.md — stellar-ui

React / TypeScript SPA for the Stellar platform. **Webpack** bundler, RTK Query, React Router v6, Tailwind CSS v4.

> This is the full, maintained agent guide — the depth lives here and only here. `CLAUDE.md` is a thin pointer at this file; do not grow a second copy of this content there, in either direction. A duplicate rotted once already and had to be reconciled. Human contributors start at **[docs/README.md](docs/README.md)**, the root **[README.md](README.md)**, and **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Commands

```bash
npm start                # Webpack dev server on :9000 — proxies ONLY /api → STELLAR_API_URL (default :8080)
npm run build            # Production build
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run format           # Prettier --write src
npm test                 # Jest unit tests (--runInBand)
npm run test:e2e         # Playwright E2E (requires running API + UI — see below)
npm run api:sync         # Pull ../stellar-api/openapi.json, then regenerate src/types/api.ts (api:generate alone skips the pull)
```

> **The dev proxy forwards `/api` and nothing else.** Root-level API endpoints
> (`/health`, and anything else outside `/api`) are unreachable from the UI —
> `historyApiFallback` serves `index.html` for them instead. Any surface the UI
> needs to consume must live under `/api` on the API side; this is why the
> version read is `GET /api/version` rather than `/health`.

> **Phantom overlay errors:** if the dev server's overlay shows `prettier/prettier`
> errors for files the CLI (`npm run lint`, `npx prettier --check`) reports clean,
> it's a stale `eslint-webpack-plugin` cache, not the code. Delete
> `node_modules/.cache/eslint-webpack-plugin/.eslintcache` and restart the dev
> server — don't chase a prettier version mismatch.

## Environment variables

Copy `.env.example` to `.env.local` (ignored by git) and fill in values:

| Variable              | Default                 | Purpose                                |
| --------------------- | ----------------------- | -------------------------------------- |
| `STELLAR_API_URL`     | `http://localhost:8080` | Webpack dev-server API proxy target    |
| `API_URL`             | `http://localhost:8080` | Playwright global setup — API base URL |
| `BASE_URL`            | `http://localhost:9000` | Playwright — UI base URL               |
| `TEST_USER`           | `testuser`              | Playwright — regular user username     |
| `TEST_USER_PASSWORD`  | `changeme`              | Playwright — regular user password     |
| `TEST_STAFF_USER`     | `staffuser`             | Playwright — staff user username       |
| `TEST_STAFF_PASSWORD` | `changeme`              | Playwright — staff user password       |

The Playwright users must exist in the running stellar-api instance before `npm run test:e2e` is called. Create them via the dev-tools seed page or `npm run db:seed` in stellar-api.

## Architecture

```
src/
  index.tsx                   # React root (createRoot), Redux Provider, Router; webpack entry
                              # imports global.css — the theming contract
  global.css                  # Theming contract, half 2: derived --st-* tokens + data-st hooks.
                              # Sits next to index.scss (half 1, the primitives) on purpose (ADR-0005)
  components/App.tsx          # Install probe → route tree
  store/
    index.ts                  # Redux store + AppDispatch / RootState types
    api.ts                    # RTK Query base API (baseUrl /api, cookie creds)
                              # Tag types defined here — add new ones here only
    hooks.ts                  # useAppSelector, useAppDispatch typed hooks
    slices/
      authSlice.ts            # { user, isAuthenticated }; setCredentials, logout
      alertSlice.ts           # addAlert(msg, type), removeAlert
    services/
      authApi.ts              # login, register, getMe, logout
      userApi.ts              # getUserById, getUserSettings, updateUserSettings
                              # createUser, getUserRanks CRUD (admin)
      forumApi.ts             # Forum, ForumCategory, Topic, Post, Poll, LastRead
      artistApi.ts            # Artist CRUD + history/similar/alias/tag
      communityApi.ts         # Community CRUD + Release + Contribution
      commentApi.ts           # Comment CRUD
      notificationApi.ts      # Notifications
      subscriptionApi.ts      # Forum topic + comment subscriptions
      profileApi.ts           # Profile read/write
      announcementApi.ts      # Announcements
      siteApi.ts              # SiteStats, Stylesheets (CRUD + stats), SiteSettings
      messagesApi.ts          # Private messages (inbox, sent, compose)
      staffInboxApi.ts        # Support tickets + staff inbox + canned responses
      reportsApi.ts           # User-facing reports + staff queue
      ratioPolicyApi.ts       # Staff ratio policy lookup + override
  types/
    index.ts                  # Re-exports from generated api.ts + handwritten types
    api.ts                    # Generated from stellar-api openapi.json (do not edit by hand)
  types/
    globals.d.ts              # Declare __SENTRY_DSN__, *.png, *.jpg module types
  utils/
    permissions.ts            # hasPermission, hasAnyPermission, isStaffUser, canSeeModBar, hasStrictAdmin
    avatar.ts                 # avatarSrc(avatar?) → string; onAvatarError handler; SEEDED_AVATAR_SENTINEL
  stylesheets/                # One tenant left — built-in themes are api-canonical (ui#168).
                              # Contents pinned as an exact set by stylesheetsDir.test.ts
    postmod/                  # The last ui-static theme; served at /stylesheets. Blocked on
                              # stellar-api #343 (commercial fonts). When it migrates, the webpack
                              # CopyPlugin + devServer static entries that serve it go too —
                              # and src/stylesheets/ itself is deleted.
  components/
    ui/                       # Site-wide primitive kit (ADR-0007): PageShell/Panel/Button/
                              # Field/DataTable/Badge/Pagination/SectionHeading (barrel index.ts)
                              # Each primitive owns its data-st hooks — adopting one completes
                              # that surface's ADR-0005/0006 theming migration (no separate pass)
    admin/                    # User rank manager, forum/community controls, news, stylesheet manager
    staff/                    # Staff pages + registry
      staffToolRegistry.tsx   # Central registry of all staff tool routes + permission gates
      staffAffordances.ts     # canSeeModBar, canAccessStaffQueue, canUseReportActions, etc.
      StaffPage.tsx           # /staff — staff landing
      (+ ~20 other staff pages — see staffToolRegistry for full list)
    auth/                     # Login, Register, Install pages
    forum/                    # Forum pages and post components
    communities/              # Community, release, artist pages
    profile/                  # User profile, settings
    layout/                   # Navbar, Sidebar, UserMenu, Spinner, PostBox, StylesheetInjector, etc.
```

## Theming (the data-st contract)

Themes are **injected stylesheets** that re-skin the app by redefining `--st-*`
Role Tokens — never by writing selectors. The contract spans two files: the
**primitive** token set is the `@theme static` block in `src/index.scss` (this is
also Sublime, and it is what `themes.tokens.test.ts` pins), while the **derived**
tokens and the `data-st` hooks live in `src/global.css`
(imported once by `index.tsx`, unlayered so its hooks beat Tailwind utilities).
The two halves sit side by side in `src/` because neither is a theme.
A built-in theme's own CSS is in neither — it is api-canonical (ui#168).
Authority: ADR-0005
(`docs/adr/0005-injected-theme-contract.md`), `docs/theming.md`, and the
`CONTEXT.md` glossary (use its words — Theme / Theme Token / Semantic Hook;
Role vs Part).

- **Sublime** is the baseline — injects nothing; the bundled Tailwind _is_
  Sublime and seeds the `--st-*` defaults. **Layer Cake** is the token-only
  reference theme: it only fully re-skins surfaces that have been _migrated_,
  so on un-migrated surfaces it falls back to the Sublime look (expected).
- **Tier-1 Roles** (generic, app-wide): `panel` `colhead` `list` `row` `title`
  `meta` `chip` `icon` `rollup` `bar` `prose` `control` `field` (`colhead` takes
  a `-title` modifier for content titles vs structural labels). **Tier-2 Parts**
  (scoped, justified): `edition-*` `coverart-*`. Boolean modifiers are bare
  `data-st-*` attributes (`data-st-lead`, `data-st-num`, `data-st-strong`,
  `data-st-primary`, `data-st-danger`, …); `bar` reads `--st-w` (0–100) via
  inline style. **Status modifiers** (`-warning` `-success` `-info`; `-danger`)
  paint `chip` and `control` from the `--st-warning/success/info/danger` status
  tokens — a `chip` carries the hue (ticket status, account state), and a
  filled `control -primary` swaps its fill to the status hue (Warn / Enable /
  Disable). Added in WS7 (UserProfile proof); no new tokens.
- **Tables reuse `colhead`/`row`** (ADR-0006): a genuine data `<table>` keeps its
  markup and gets `data-st="grid"` on the `<table>`, `data-st="colhead"` on the
  `<thead>`, `data-st="row"` on each `<tr>`; tag-qualified CSS swaps flex→table
  layout while the token paint carries over. List-shaped data stays div
  `panel`/`list`/`row`; columnar data stays a table (alignment is the point).
  `field` paints form inputs/textareas/selects; labels decompose to `meta`.

**Migrating a surface (the WS4 per-surface pass, ongoing):** move
color/border/background utilities onto the `data-st` hooks; **keep layout**
utilities (flex/grid/spacing/sizing). List-shaped tables convert to div
`panel`/`colhead`/`list`/`row`; genuine columnar tables keep their `<table>` and
use the `grid`/`colhead`/`row` table variant (ADR-0006) so alignment survives.
Body/heading copy uses **`prose`** (`-strong` for headings), interactive
buttons/links use **`control`** (`-primary` CTA, `-danger` destructive), and form
inputs use **`field`** — all paint from tokens, so don't leave them as inline
gray utilities, which go illegible on a light theme. Add a hooks-present test
assertion per migrated surface, and keep rendered text/links/controls intact so
the existing suite stays green. **Don't tick off progress in `docs/theming.md`
§7** — that section is the stable migration _order_, not a status tracker;
editing its per-surface notes per-PR made it a serial merge-conflict magnet.
Record per-surface progress in the rolling handoff instead. Worked examples: `CollageDetail`,
`CommunityPage`, `LogBrowsePage`, `ForumPage`, `ForumTopicPage` +
`ForumTopicPost` (established `prose`/`control`), `ForumCategoryPage` (table
variant) + `NewTopicForm` (`field`), `ReleaseBrowsePage` (filter form + results
table in one surface — first to migrate native checkboxes/radios, which carry
`field` for its `accent-color`; the box rules are inert on an `appearance:auto`
control), `UserProfile` (the public profile + staff panel — proved the WS7
`chip`/`control` status modifiers; the donor-presentation block keeps its pink
brand flair by design, not migrated), the **settings forms** (`Settings` +
`DonorSettingsTab` + `IrcNickSettings` — tabbed `panel`/`field`/`control`/`meta`
forms; tab buttons paint from token utilities, not a Role; locked donor perks
stay `field`/`meta` and just dim via `opacity`), the **invite surfaces**
(`InviteForm` — legacy tracker classes kept for layout, `data-st` hooks layered
on so it themes; `InviteTree` — `grid`/`colhead`/`row` table + a summary
`panel` of stat panels with rank `chip`s), the **ratio surfaces**
(`RatioStats` — display `panel`/`colhead` with status-token banners and `meta`
label rows; `RatioRulesPage` — prose-heavy page with the bracket reference
table as `grid`/`colhead`/`row` and the active bracket on `data-st-open`;
status hues come from the `--st-success/warning/danger` tokens via leaf
utilities, not chip/control, since these are full-width banners and inline
values, not chips), and the **app-chrome header set** (`PrivateHeader` +
`UserMenu` + `NotificationCorner` + `QuickSearch` — WS11, §7 item 4): mostly
token leaf utilities since chrome is structural bars + state-keyed nav (the
primary nav reuses the WS8 tab-strip pattern; `UserMenu`'s padded pills rule
out `control`, which zeroes padding); the notification dropdown is the
Role-bearing piece (`panel`/`colhead`/`list`/`row` with `data-st-open` for
unread, "Mark all read" a `control`, quiet ✕ icons left as faint leaf
utilities), and `QuickSearch` inputs take `field`), and the **app-chrome
shells/footer/banners** (`PublicLayout` + `PrivateLayout` + `PrivateFooter` +
`GlobalNoticeBanner` + `Alert` — WS12, completes §7 item 4): shells/footer
repaint via surface/text leaf utilities, `PublicLayout`'s Register CTA is a
`control -primary` (no padded-pill conflict), and the notice surfaces
(`GlobalNoticeBanner` warning banner + `Alert` per-type toast) reuse the WS10
status-colour-without-chip recipe — `color-mix(... 12%/40%, transparent)` fill +
border and solid `text-[var(--st-status)]`, since notices aren't chips/controls.

**The UI primitive kit (`src/components/ui/`, ADR-0007).** Above the CSS
contract sits a small React kit that _emits_ it: `PageShell` (page wrapper —
`prose -strong` title, the default-on "← Toolbox" back-link, an actions slot,
one width scale `sm…2xl`), `Panel`, `Button` (`control` + `primary`/`success`/
`warning`/`danger`/`link`/`link-danger`), `Field` (labeled input → `field` +
`meta`), `DataTable` (`grid`/`colhead`/`row`), `Badge` (`chip` + status),
`Pagination`, `SectionHeading`. The hooks land **once per primitive, not once
per page** — so **adopting a primitive _completes_ that surface's ADR-0005/0006
migration** (no separate per-file `data-st` pass). The **staff/admin long tail
is now kit-adopted** (logs, stats, queues, CRUD clean-fit + inline-edit forms,
read-only pages; the IP-ban/email-blacklist twins collapsed to one
`staff/Blacklist.tsx`). The recurring recipes are the **CRUD form**, the
**card-list**, and the **modal**. The three heavyweight admin managers
(`CommunityManager`, `ForumControlPanel`, `ForumCategoryControlPanel`) are
**also kit-adopted** (the same list + inline-edit + create-form shape as
`RulesManager`). **Stays bespoke** (own markup; migrate leaf colors to tokens
only if you're already editing them): only `GenerateTestDataPage` (dev-only),
a developer utility rather than a tool page. New tools compose the kit; they
don't re-roll a page wrapper, table, or back-link.

- **Kit gotchas.** `control -primary` carries its own padding — don't add
  `px/py` to filled `Button`s; `link`/`link-danger` are unpadded. `Field`/
  `Button` **don't forward refs**, so `<select>`/`<textarea>`/react-hook-form
  `register()` use the **`field` Role direct**, not the component. Paginated meta
  is optional → read `data?.meta?.totalPages ?? 1` (the kit `Pagination` already
  guards). Don't set cell text color via `DataTable`'s `tdClassName` — the
  `tr[data-st=row]>td` rule wins; wrap the value in a token-colored span. Tests
  assert **hooks-present** against a real primitive (`table[data-st="grid"]` or a
  `data-st` Role on a real button/div/table, **not** a mocked `<Link>`); mirror
  `src/__tests__/ui/kit.test.tsx`.

## Types

`src/types/index.ts` re-exports from the generated `src/types/api.ts` (openapi-typescript output from stellar-api's OpenAPI spec). Do **not** hand-write types that exist in the OpenAPI spec — pull them via `components['schemas']['...']` or `paths['/route']['method']['...']`.

Hand-written types that belong in `index.ts` (not in the spec):

- `Alert`, `AlertType` — Redux UI state
- `AuthState` — Redux slice shape
- `InviteNode`, `ProfileDetails`, `Profile` — complex profile tree
- `UserSettings` — settings form shape
- `Announcement`, `BlogPost` — missing from spec
- `HomepageFeaturedRelease`, `HomepageFeaturedAlbum`, `HomepageFeaturedContent`
- `PaginatedResponse<T>` — generic wrapper

## RTK Query patterns

### Tag types

All tag types are declared in `src/store/api.ts`. Add new ones there before using in a service.

### Path types for request/response

Derive types from the generated spec, not from hand-written interfaces:

```ts
type NotificationsResponse =
  paths['/notifications']['get']['responses'][200]['content']['application/json'];
```

### Cache invalidation

Mutations that modify a resource must invalidate the tags the queries provide. Be specific — use `{ type: 'ForumTopic', id: topicId }` not just `'ForumTopic'` when you know the ID.

### Error handling in components

Access error details as `err.data?.msg` (single message) or `err.data?.errors` (field-level). The backend never returns `err.data?.error`.

## Permissions

`src/utils/permissions.ts` exports:

```ts
hasPermission(user, 'admin'); // boolean; admin bypasses all checks
hasAnyPermission(user, ['staff', 'admin']);
isStaffUser(user); // any staff/admin permission present
canSeeModBar(user); // requires 'staff'
hasStrictAdmin(user); // literal 'admin' only — staff alone does not pass
```

`src/components/staff/staffAffordances.ts` exports role-specific checks that combine permission keys:

```ts
canAccessStaffQueue(user); // 'staff_inbox_manage'
canUseReportActions(user); // 'reports_manage' | 'staff'
canUseTicketStaffActions(user); // 'staff_inbox_manage' | 'staff'
canUseRequestModeration(user); // 'requests_moderate' | 'staff'
canSeeTop10History(user); // 'staff'
```

Valid backend permissions are defined in `stellar-api/src/lib/rankPermissions.ts` and exported as `VALID_PERMISSIONS` (~42 keys across 11 groups). The `Permission` type is derived from the OpenAPI spec — use `components['schemas']['PermissionKey']` in the UI. Key groups:

| Group          | Example keys                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery      | `advanced_search`, `users_search`                                                                                                             |
| Forums         | `forums_read`, `forums_post`, `forums_moderate`, `forums_manage`                                                                              |
| Communities    | `communities_manage`, `contributions_manage`, `dnc_manage`                                                                                    |
| Collages       | `collages_create`, `collages_manage`, `collages_moderate`                                                                                     |
| Requests       | `requests_create`, `requests_moderate`                                                                                                        |
| Wiki           | `wiki_edit`, `wiki_manage`                                                                                                                    |
| Content        | `news_manage`, `rules_manage`, `tags_manage`, `reports_manage`, `staff_inbox_manage`                                                          |
| Users          | `users_edit`, `users_warn`, `users_disable`, `users_view_ips`, `users_view_email`, `recovery_manage`, `invites_manage`, `ratio_policy_manage` |
| Operations     | `site_history_manage`, `ip_bans_manage`, `email_blacklist_manage`, `donor_ranks_manage`, `donation_log_view`, `messages_mass_pm`              |
| Staff Tools    | `login_watch_view`, `duplicate_ips_view`, `registration_log_view`, `staff`                                                                    |
| Administration | `rank_permissions_manage`, `staff_groups_manage`, `admin`                                                                                     |

## Toolbox / staff tool registry

`Toolbox.tsx` renders links driven by `staffToolRegistry.tsx`. Each registered tool declares its `path`, `label`, `section`, and required `permissions[]`. `Toolbox` filters by `hasAnyPermission` — only add entries for routes that are actually implemented. Do not add placeholder links for planned features.

## Commit workflow

Run every step before committing. All must pass clean on new/changed files.

1. `npm run format` — format **all** of `src/` (not just changed files — confirms nothing else drifted)
2. `npm run lint` — must be clean on new/changed files; pre-existing errors in untouched files are acceptable
3. `npx tsc --noEmit` — must be clean
4. `npm test -- --no-coverage` — full suite must pass (unit + integration tests together via Jest)
5. Commit with descriptive message following existing log style

> Order matters: format before lint (Prettier violations are ESLint errors), and lint before type-check.

### Branch / merge discipline (rebase-only repo)

Upstream `orphic-inc/stellar-ui` allows **rebase-and-merge only** (no merge or
squash). Two rules follow:

- **Update a feature branch with `git rebase upstream/main`, never `git merge
main`.** A merge commit in the branch makes GitHub **refuse to rebase-and-merge
  it** ("this branch can't be rebased") — and the admin bypass only waives the
  _review_ requirement, not rebase feasibility. If a branch already has a merge
  commit, rebase it onto `upstream/main` (dropping the merge), re-run the gate,
  and `git push --force-with-lease`.
- **Rebase right before requesting the merge** so a moving `main` doesn't surprise
  you mid-merge.

## Testing

`src/__tests__/` contains two test flavors:

- **Unit tests** (`*.test.tsx` / `*.test.ts`): mock RTK Query, run with Jest + jsdom, fast.
- **Integration tests** (`*.integration.test.tsx`): hit real RTK Query hooks against a mock server or rendered tree; same Jest run, slower. Both run via `npm test`.

E2E tests live in `e2e/` and run via Playwright (`npm run test:e2e`). Current coverage: smoke, auth paths, messaging, releases, reports, tickets.

## Audit history

Five rounds of audit remediation applied. Key items:

- Auth shape: endpoints return `{ user: AuthUser }`, not bare `AuthUser`
- `AuthUser.dateRegistered` (not `createdAt`), plus `lastLogin`, `isArtist`, `isDonor`, `canDownload`
- `Permission` interface merged into `UserRank`; `PublicUser` and `ArtistHistory` types added
- All RTK Query service types derived from generated OpenAPI spec where possible
- `artistApi` field names aligned to backend: `similarArtistId`, `redirectId`, `tagId`
- `votePoll` requires `topicId` and invalidates `ForumTopic` (not all `Forum`)
- `forumApi` has `updateForum`, `deleteForum`, `deleteTopic` mutations
- `UserRankFormPage` uses backend VALID_PERMISSIONS from OpenAPI spec (`PermissionKey`)
- `Toolbox` stripped to implemented links only, permission-filtered per user
- 403 removed from logout trigger (403 = insufficient permissions, not invalid session)
- `NewUserForm` logout hack removed; navigates to toolbox on success

## Stub models (no routes yet)

These Prisma models exist in stellar-api but have no API routes or UI:

| Model                                        | Status                                  |
| -------------------------------------------- | --------------------------------------- |
| `DoNotUpload`                                | Planned — per-community blocklist       |
| `TopTenLeaderboard`                          | Planned — community leaderboard feature |
| `CoverArt`, `FeaturedAlbum`                  | Planned — release art management        |
| `Donation`, `BitcoinDonation`, `DonorReward` | Planned — donor system                  |
| `Applicant`, `Thread`                        | Planned — application/thread system     |
| `ApiApplication`, `ApiUser`                  | Deferred indefinitely                   |

Do not add frontend code, OpenAPI paths, or Toolbox links for these until the backend routes are implemented.

## Regenerating api.ts

When stellar-api's OpenAPI spec changes, run from the stellar-ui directory:

```bash
npm run api:sync         # copies ../stellar-api/openapi.json → src/types/openapi.json, then api:generate
npm run typecheck        # verify no type regressions
```

`api:generate` alone only regenerates `src/types/api.ts` from the **already-vendored**
`src/types/openapi.json` (openapi-typescript + Prettier). Use `api:sync` to pull a fresh
spec from `../stellar-api` first — that's the step that picks up new/changed endpoints.

This is a manual step before every PR that touches API response shapes.
