# CLAUDE.md — stellar-ui

React / TypeScript frontend for the Stellar platform. Uses Vite, RTK Query, React Router, Tailwind CSS.

## Commands

```bash
npm run dev              # Vite dev server (proxies /api → localhost:8080)
npm run build            # Production build
npx tsc --noEmit         # Type-check only (run before committing)
npx prettier --write ... # Format — ESLint treats Prettier violations as errors; always run on edited files
```

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
      communityApi.ts         # Community CRUD
      commentApi.ts           # Comment CRUD
      notificationApi.ts      # Notifications
      subscriptionApi.ts      # Forum topic + comment subscriptions
      profileApi.ts           # Profile read/write
      announcementApi.ts      # Announcements
      miscApi.ts              # SiteStats, Stylesheets
  types/
    index.ts                  # Re-exports from generated api.ts + handwritten types
    api.ts                    # Generated from stellar-api openapi.json (do not edit by hand)
  utils/
    permissions.ts            # hasPermission, hasAnyPermission, isStaffUser
  components/
    admin/                    # Staff toolbox, user rank manager, news, user create
    auth/                     # Login, Register, Install pages
    forum/                    # Forum pages and post components
    communities/              # Community, release, artist pages
    profile/                  # User profile, settings
    layout/                   # Navbar, Sidebar, UserMenu, Spinner, PostBox, etc.
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
hasPermission(user, 'admin')           // boolean
hasAnyPermission(user, ['staff', 'admin'])
isStaffUser(user)                      // any staff/admin permission present
```

The 12 valid backend permissions: `forums_read`, `forums_post`, `forums_moderate`, `forums_manage`, `communities_manage`, `news_manage`, `invites_manage`, `users_edit`, `users_warn`, `users_disable`, `staff`, `admin`.

## Toolbox link policy

`Toolbox.tsx` shows links filtered by user permissions. Only add links for routes that are actually implemented. Do not add placeholder links for planned features.

## Commit workflow

1. `npx tsc --noEmit` — must be clean
2. `npx prettier --write <changed files>`
3. Commit with descriptive message following existing log style
4. Push to current feature branch (`phase-3-misc`)

## Audit history

Five rounds of audit remediation applied. Key items:
- Auth shape: endpoints return `{ user: AuthUser }`, not bare `AuthUser`
- `AuthUser.dateRegistered` (not `createdAt`), plus `lastLogin`, `isArtist`, `isDonor`, `canDownload`
- `Permission` interface merged into `UserRank`; `PublicUser` and `ArtistHistory` types added
- All RTK Query service types derived from generated OpenAPI spec where possible
- `artistApi` field names aligned to backend: `similarArtistId`, `redirectId`, `tagId`
- `votePoll` requires `topicId` and invalidates `ForumTopic` (not all `Forum`)
- `forumApi` has `updateForum`, `deleteForum`, `deleteTopic` mutations
- `PermissionFormPage` uses 12 backend VALID_PERMISSIONS (was 34 Gazelle-era names)
- `Toolbox` stripped to implemented links only, permission-filtered per user
- 403 removed from logout trigger (403 = insufficient permissions, not invalid session)
- `NewUserForm` logout hack removed; navigates to toolbox on success

## Regenerating api.ts

When stellar-api's OpenAPI spec changes:
```bash
# In stellar-api:
npm run openapi:export       # writes openapi.json to repo root

# In stellar-ui:
npx openapi-typescript ../stellar-api/openapi.json -o src/types/api.ts
npx tsc --noEmit             # verify no type regressions
```

This is a manual step before every PR that touches API response shapes.
