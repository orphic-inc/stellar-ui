# CLAUDE.md — stellar-ui

React / TypeScript frontend for the Stellar platform. Uses Webpack, RTK Query, React Router, Tailwind CSS.

## Commands

```bash
npm start                # Webpack dev server on :9000 (proxies /api → STELLAR_API_URL, default :8080)
npm run build            # Production build
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run format           # Prettier --write src
npm test                 # Jest unit tests (--runInBand)
npm run test:e2e         # Playwright E2E (requires running API + UI — see below)
npm run api:generate     # Export openapi.json from stellar-api, regenerate src/types/api.ts, run Prettier
```

## Environment variables

Copy `.env.example` to `.env.local` (ignored by git) and fill in values:

| Variable | Default | Purpose |
|---|---|---|
| `STELLAR_API_URL` | `http://localhost:8080` | Webpack dev-server API proxy target |
| `API_URL` | `http://localhost:8080` | Playwright global setup — API base URL |
| `BASE_URL` | `http://localhost:9000` | Playwright — UI base URL |
| `TEST_USER` | `testuser` | Playwright — regular user username |
| `TEST_USER_PASSWORD` | `changeme` | Playwright — regular user password |
| `TEST_STAFF_USER` | `staffuser` | Playwright — staff user username |
| `TEST_STAFF_PASSWORD` | `changeme` | Playwright — staff user password |

The Playwright users must exist in the running stellar-api instance before `npm run test:e2e` is called. Create them via the dev-tools seed page or `npm run db:seed` in stellar-api.

## Architecture

```
src/
  main.tsx                    # React root, Redux Provider, Router
  App.tsx                     # Install probe → route tree
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
  stylesheets/                # Bundled CSS themes served at /stylesheets — do not import directly
    kuro/                     # Dark theme
    layer-cake/               # Classic-gray alternate; token-only reference theme (ADR-0005 / WS3)
    postmod/                  # Legacy tracker-era theme
    proton/                   # Light theme
    sublime/                  # Default/baseline — injects nothing; bundled Tailwind IS Sublime (seeds the --st-* token defaults)
  components/
    admin/                    # User rank manager, forum/community controls, news, stylesheet manager
    staff/                    # Staff pages + registry
      staffToolRegistry.tsx   # Central registry of all staff tool routes + permission gates
      staffAffordances.ts     # canSeeModBar, canAccessStaffQueue, canUseReportActions, etc.
      StaffPage.tsx           # /private/staff — staff landing
      (+ ~20 other staff pages — see staffToolRegistry for full list)
    auth/                     # Login, Register, Install pages
    forum/                    # Forum pages and post components
    communities/              # Community, release, artist pages
    profile/                  # User profile, settings
    layout/                   # Navbar, Sidebar, UserMenu, Spinner, PostBox, StylesheetInjector, etc.
```

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
hasPermission(user, 'admin')                    // boolean; admin bypasses all checks
hasAnyPermission(user, ['staff', 'admin'])
isStaffUser(user)                               // any staff/admin permission present
canSeeModBar(user)                              // requires 'staff'
hasStrictAdmin(user)                            // literal 'admin' only — staff alone does not pass
```

`src/components/staff/staffAffordances.ts` exports role-specific checks that combine permission keys:
```ts
canAccessStaffQueue(user)     // 'staff_inbox_manage'
canUseReportActions(user)     // 'reports_manage' | 'staff'
canUseTicketStaffActions(user)// 'staff_inbox_manage' | 'staff'
canUseRequestModeration(user) // 'requests_moderate' | 'staff'
canSeeTop10History(user)      // 'staff'
```

Valid backend permissions are defined in `stellar-api/src/lib/rankPermissions.ts` and exported as `VALID_PERMISSIONS` (~42 keys across 11 groups). The `Permission` type is derived from the OpenAPI spec — use `components['schemas']['PermissionKey']` in the UI. Key groups:

| Group | Example keys |
|---|---|
| Discovery | `advanced_search`, `users_search` |
| Forums | `forums_read`, `forums_post`, `forums_moderate`, `forums_manage` |
| Communities | `communities_manage`, `contributions_manage`, `dnc_manage` |
| Collages | `collages_create`, `collages_manage`, `collages_moderate` |
| Requests | `requests_create`, `requests_moderate` |
| Wiki | `wiki_edit`, `wiki_manage` |
| Content | `news_manage`, `rules_manage`, `tags_manage`, `reports_manage`, `staff_inbox_manage` |
| Users | `users_edit`, `users_warn`, `users_disable`, `users_view_ips`, `users_view_email`, `recovery_manage`, `invites_manage`, `ratio_policy_manage` |
| Operations | `site_history_manage`, `ip_bans_manage`, `email_blacklist_manage`, `donor_ranks_manage`, `donation_log_view`, `messages_mass_pm` |
| Staff Tools | `login_watch_view`, `duplicate_ips_view`, `registration_log_view`, `staff` |
| Administration | `rank_permissions_manage`, `staff_groups_manage`, `admin` |

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

| Model | Status |
|---|---|
| `DoNotUpload` | Planned — per-community blocklist |
| `TopTenLeaderboard` | Planned — community leaderboard feature |
| `CoverArt`, `FeaturedAlbum` | Planned — release art management |
| `Donation`, `BitcoinDonation`, `DonorReward` | Planned — donor system |
| `Applicant`, `Thread` | Planned — application/thread system |
| `ApiApplication`, `ApiUser` | Deferred indefinitely |

Do not add frontend code, OpenAPI paths, or Toolbox links for these until the backend routes are implemented.

## Regenerating api.ts

When stellar-api's OpenAPI spec changes, run from the stellar-ui directory:
```bash
npm run api:generate     # exports openapi.json from ../stellar-api, regenerates src/types/api.ts, runs Prettier
npm run typecheck        # verify no type regressions
```

This is a manual step before every PR that touches API response shapes.
