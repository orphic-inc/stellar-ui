# Context

## Terms

### Release workbench
A module centered on one Release that owns the interface for release read/write behavior: metadata edits, tag changes, vote changes, contribution attach, history, and moderation checks.

### Release workbench session
The opened Release workbench for one actor on one Release in one Community. It captures authority, read state, and command entry points behind one seam.

### Rank access
The computed effective permission state for a user, derived by merging their primary rank and any secondary ranks. Produces a `UserRankAccess` value: merged `PermissionMap`, `effectiveLevel`, `permittedForumIds`, and `secondaryRankIds`. The pure computation (`computeUserRankAccess`) and the DB fetch (`getUserRankAccess`) are separate concerns within `lib/userRankAccess.ts`.

### Permission catalog
The static list of all valid permissions with display metadata (grouped by domain, with labels and descriptions). The backend (`lib/rankPermissions.ts`) is the single canonical source. The frontend derives the `Permission` type from the OpenAPI spec and fetches catalog display data from the API — it does not maintain a local copy.
