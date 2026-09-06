# Changelog

All notable changes to stellar-ui are documented here.

---

## [Unreleased]

## [0.9.1] — 2026-09-06

### Added

- **CI now checks that RTK Query result types come from the generated contract** ([stellar-ui ADR-0010](docs/adr/0010-service-result-types-come-from-the-contract.md), [#277](https://github.com/orphic-inc/stellar-ui/issues/277)) — where an endpoint's result type is a hand-written `interface` rather than a read of `paths[...]`/`components[...]`, the repo holds a **second, parallel description of the API's response shapes with nothing comparing it to the real one**. That is [#271](https://github.com/orphic-inc/stellar-ui/issues/271)'s failure one layer further out, and its conclusion applies verbatim: a green typecheck against a stale type is worse than no typecheck, because it actively asserts correctness — three runtime bugs shipped that way with `tsc` clean throughout. `npm run service-types:check` classifies all **324** endpoints: **136 spec-typed, 82 hand-typed, 99 inline or `void`**. The 82 are grandfathered in `service-types-baseline.json`, which is a **ratchet rather than a mute**: a hand-typed endpoint absent from the baseline fails immediately, so new drift is blocked from day one; a baselined endpoint that has since been bound to the contract fails as stale; and so does one that no longer exists. The list can only shrink. **The guard lands before the migration, not after** — #277 sequenced it last, but stellar-api #474 showed that a baseline ratchet landing first closes the door while the backlog burns down, instead of leaving it open for however long that takes. Three things are deliberately not flagged: `void` and inline shapes (a `void` is correct for a 204, and an inline `{ msg: string }` duplicates `MsgResponse` only trivially), query-argument types (payload and query-param helpers are legitimately the UI's own — only response shapes are the API's to describe), and `devToolsApi.ts`, whose `/dev/*` routes are deliberately outside the contract and have nothing to bind to.

### Changed

- **Re-vendored the contract: the [#509](https://github.com/orphic-inc/stellar-api/issues/509) route-authorization audit, all six findings** — stellar-api gated five reads and one write pair that had been reachable by any authenticated member, or in two cases by nobody at all. Six paths moved: `/artists/{id}`, `/comments/{id}`, `/communities/{communityId}/dnc`, `/contributions/{id}`, `/forums/topic-notes` and `/forums/topic-notes/{topicId}`.

  **Six response codes added, every one `MsgResponse`:**

  | operation                            | code     | why                                                                                                                                                 |
  | ------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `PUT /artists/{id}`                  | 403      | `Missing communities_manage` — the route also wrote `vanityHouse`, which its `news_manage`-gated sibling protects, so the gate was reachable around |
  | `DELETE /artists/{id}`               | 403      | `Missing admin`; the delete is now a soft delete                                                                                                    |
  | `GET /comments/{id}`                 | 401      | was the only comment route with no auth middleware                                                                                                  |
  | `GET /communities/{communityId}/dnc` | 403, 404 | readable across communities, including the free-text staff `comment`                                                                                |
  | `GET /contributions/{id}`            | 403      | served anyone's contribution by id, while its own list is `userId`-scoped                                                                           |

  **Verified as non-destructive rather than read off the diff.** Comparing the two specs as **parsed JSON, per operation**: `components` **byte-identical**, paths unmoved at **267**, operations at **361**, **no operation lost a response**, **no schema on an existing response changed**, and `Record<string, never>` in `api.ts` unchanged at **3**. **No request type and no success-response type moved**, so nothing here needed a code change — all 169 suites pass untouched.

  **Five description changes came with it**, four on responses and one on an operation. The operation-level one is worth reading: `GET /comments/{id}` previously described itself as _"Deliberately unauthenticated … it can serve a soft-deleted comment"_. That text documented a defect rather than a decision — the route retained soft-deleted bodies verbatim and served them with no session — and now describes the fixed behaviour. Two `403`s under `/forums/topic-notes` went from `Not authorized` to `Missing forums_moderate` when a bespoke local gate was replaced by the shared `requirePermission`.

  **What this does not change:** nothing in this repo. Every moved path gains error responses a consumer could always receive but was never told about, and `GET /contributions/{id}` and `GET /comments/{id}` are not read by any service here — `commentApi` uses `/comments` plus `PUT`/`DELETE`, and `contributionApi` uses the list, `/access` and `/report`.

- **Re-vendored the contract: the last 160 operations now declare the 401/403 their middleware answers, and stellar-api's auth-coverage baseline is empty** — [api#494](https://github.com/orphic-inc/stellar-api/issues/494)'s sixth guarded axis is finished. Thirteen further slices ([api#514](https://github.com/orphic-inc/stellar-api/pull/514), [#516](https://github.com/orphic-inc/stellar-api/pull/516), [#518](https://github.com/orphic-inc/stellar-api/pull/518), [#519](https://github.com/orphic-inc/stellar-api/pull/519), [#521–#529](https://github.com/orphic-inc/stellar-api/pull/521)) covering `/stylesheets`, `/reports`, `/collages`, `/bookmarks`, `/messages`, `/stats`, `/wiki`, `/rules`, `/requests`, `/tag-aliases`, `/top10`, staff tooling and twelve member surfaces took the remaining baseline **203 gaps to 0**: `361 contract routes, 347 gated, 347 fully documented, 0 gap(s) (0 baselined)`. This is the re-vendor of that work — **208 response codes added across 160 operations, every one `MsgResponse`**: all 160 gained a `401`, and 48 of those also gained a `403`. No operation gained a `403` without a `401`.

  **Purely additive, and verified as such rather than read off the diff.** The textual diff is misleading here — identical lines appear as deleted **and** re-added, and whole path keys look removed, all of it alignment churn around inserted blocks. The two specs were compared as **parsed JSON, per operation**: `components` is **byte-identical**, the path count unmoved at **267**, the operation count at **361**, no operation lost a response or changed a non-`responses` key, and no request or success-response type moved. `Record<string, never>` occurrences in `api.ts` are unchanged at **3**, so [api#488](https://github.com/orphic-inc/stellar-api/issues/488)'s narrowing trap stays clear. No code change was needed: a consumer only gains error shapes it could always receive but was never told about.

  **Eight pre-existing `403` descriptions were reworded, and the rewording is the point.** `PUT /comments/{id}` said `Not authorized`; it now says `Not the comment author`. `DELETE /comments/{id}` says `Not the comment author and missing reports_manage`, naming the owner-or-permission gate rather than implying staff-only. `DELETE /requests/{id}` and both collage routes gained the handler-level conditions their old text omitted (a filled request, a locked collage, the collage-staff path). Schemas are identical in all eight — description text only.

  **What this still does not say.** The upstream gate derives expected codes from the **middleware chain**, so a 403 thrown inside a handler remains invisible to it, and non-auth failure codes (404, 409, 422) are not measured on any axis yet — [api#517](https://github.com/orphic-inc/stellar-api/issues/517) tracks that as a candidate seventh axis, and [api#509](https://github.com/orphic-inc/stellar-api/issues/509) the handler-level authorization audit. `POST /stats/snapshot`'s 403 also still carries an inline `{ msg }` schema rather than `MsgResponse`; it is the one pre-existing exception and is unchanged here.

- **Re-vendored the contract: 148 operations now declare the 401/403 their middleware answers** — stellar-api's [#494](https://github.com/orphic-inc/stellar-api/issues/494) added a sixth guarded axis, auth-failure coverage, and seven slices ([api#506–#508](https://github.com/orphic-inc/stellar-api/pull/506), [#510–#513](https://github.com/orphic-inc/stellar-api/pull/510)) burned its baseline from **404 gaps to 203** across `/tools`, `/staff-inbox`, `/announcements`, `/artists`, `/users`, `/forums` and `/communities`. This is the re-vendor of that work: **203 response codes added — 148 × `401` and 55 × `403`, every one `MsgResponse`**.

  **Purely additive, and verified as such rather than assumed.** `components` is **byte-identical**, the path count is unmoved at **267**, the operation count at **361**, and no operation lost a response or changed a non-`responses` key. No request type and no success-response type moves, so nothing here needed a code change — a consumer only gains error shapes it could always receive but was never told about.

  **Two of the new descriptions say more than `Missing <key>`, and that is deliberate upstream.** `POST /communities/{communityId}/releases/{releaseId}/history/{historyId}/revert` reads **`Missing communities_manage or admin`** because `requirePermission(a, b)` is ANY-OF — a single-key description would tell a client an `admin`-only caller gets a 403 when they do not. `GET /users/{id}/invite-tree` and `PUT /users/{id}/staff-bio` read **`Not the owner and missing invites_manage`** / **`Not the subject and missing admin`**, because those are owner-or-permission gates and a flat `Missing invites_manage` would read as staff-only to a member who can in fact read their own tree.

  **What this does not say.** The upstream gate derives expected codes from the middleware chain, so a 403 thrown **inside a handler** is invisible to it — `/forums`' per-forum `minClassRead` checks and `/communities`' `assertCommunityAccess` are the known populations. A fully documented operation here means _every failure the middleware can produce_ is described, which is a real guarantee but a narrower one than "all auth failures". [api#509](https://github.com/orphic-inc/stellar-api/issues/509) tracks the rest.

- **The #277 gate was skipping hand-written types hidden inside an inline object, and five endpoints were behind that hole** ([#293](https://github.com/orphic-inc/stellar-ui/issues/293)) — `service-types-baseline.json` was empty and the gate reported `0 hand-typed`, which was **not the whole truth**. `check-service-types.mjs` exempts a result type that starts with `{`, so `build.query<{ items: TopReleaseItem[] }, …>` hid a twelve-field hand-written interface behind a brace. The exemption was written for `{ msg: string }` and is right for that; it simply did not look inside.

  It now does: an inline object referencing a **named** type is classified by that type, and the trivial-shape exemption survives untouched. That surfaced **five** endpoints — `top10Api`'s four (`getTopReleases`, `getTopUsers`, `getTopTags`, `getTopVotes`) **and `adminApi#getEconomyStats`**, which [#290](https://github.com/orphic-inc/stellar-ui/pull/290) had reported as fully bound. All five are now bound: **`324 endpoints: 227 spec-typed, 0 hand-typed (0 baselined), 90 inline/void`** — and this time the zero is real. The seven hand-written interfaces behind them are gone, re-exported as slices of the generated client so components typing their props keep working.

  **It needed [stellar-api #505](https://github.com/orphic-inc/stellar-api/pull/505)** — the thirteenth service in a row to require an upstream fix. `EconomyTransactionItem` omitted four columns of a whole-row read, and four enum columns across the contract were still registered as free text.

  **Two more fixtures described responses the API cannot send**, both surfaced by the narrowings rather than by reading: `CommunitiesTable` was missing `registrationStatus` (a `NOT NULL` column on a whole-row read), and `NotificationCorner` used `page: 'unknown'` to reach a `default` branch that is **unreachable** — the switch is exhaustive over all nine `SubscriptionPage` values. Replaced with `global_notices` and no `url`, a real value that reaches the same unlinked-label path honestly.

- **Re-vendored the contract's final enum sweep, and it deleted an unreachable branch here** — [stellar-api #503](https://github.com/orphic-inc/stellar-api/pull/503) narrowed the last thirteen stringly-typed enum fields. Unlike the two sweeps before it, this one **did not type-check cleanly**, and the failure was the useful part: `CommunitiesTable`'s fixture declared `type: null` for a community, and `CommunityRow` rendered a `—` fallback for that case.

  **`Community.type` is `CommunityType` `NOT NULL` and every route returns the whole row**, so the API has never been able to send null. The fallback branch was unreachable and its test could only reach it by fabricating a response that cannot occur — the "fixture agrees with the type rather than the API" pattern this whole migration keeps turning up, this time caught by the contract instead of by reading. The branch is gone, the fixture carries a real `CommunityType`, and the test now asserts both rows badge their type.

  Everything else was generated-only. `AssetUploadResponse.kind` is worth knowing about as a consumer: it is the **full** `AssetKind`, not the two values the upload query accepts, because the store is content-addressed and returns the existing row on a hash hit.

- **Re-vendored again: `type` is now a seven-member union too** — [stellar-api #502](https://github.com/orphic-inc/stellar-api/pull/502) gave `ReleaseType` the same treatment as `ReleaseCategory` at six sites. The two are the pair that sits on every release-shaped response: **`type` is the medium** (Music, EBooks, Comics…), **`releaseType` is the edition kind** (Album, Single, Live…). Generated-only again, and again no code change was needed — narrowing a response field only strengthens what a reader is promised.

- **Re-vendored the contract: `releaseType` is now a fourteen-member union instead of `string`** — [stellar-api #501](https://github.com/orphic-inc/stellar-api/pull/501) replaced `z.string()` at five registry sites (which carried three different nullabilities between them) with the real `ReleaseCategory` enum. **No code change was needed here**, which is the expected result: narrowing a _response_ field only strengthens what a reader is promised, so `tsc` and all 169 suites pass untouched. The generated type is a clean union rather than the `Base & Record<string, never>` an ill-formed narrowing produces — checked, because that trap has bitten before.

  **One of the five narrowings does not reach this repo yet.** `Top10ReleaseItem.releaseType` is still read through `top10Api.ts`'s **hand-written `TopReleaseItem` interface**, which declares `releaseType: string`. The #277 gate does not see it: `build.query<{ items: TopReleaseItem[] }, …>` wraps the hand-written type in an **inline object literal**, and the checker classifies anything starting with `{` as inline and skips it. So four `top10Api` endpoints still carry a parallel description of the API with nothing comparing it — the exact failure #277 exists to prevent, surviving inside a wrapper.

- **Re-vendored the contract, which moves one `paths[...]` key and picks up two upstream fixes** — `CommunityReleasesResponse` now reads `paths['/communities/{communityId}/releases']` instead of `paths['/communities/{id}/releases']`. The rename is [stellar-api #500](https://github.com/orphic-inc/stellar-api/pull/500): that path's `GET` was registered with `{id}` while its own **`POST` sibling** used `{communityId}`, which is also what the router mounts — so the spec carried the path twice and this repo had faithfully mirrored the inconsistent half. **`tsc` located it exactly**, which is the bound-types guard doing its job: one error on the stale key, one on the `implicitly any` it caused downstream in `CommunityPage`. The sync also brings in [#498](https://github.com/orphic-inc/stellar-api/pull/498)'s `POST /top10/snapshot` body (a `default` and a documented `400`), which needs no code change here.

  **The eleven forum param mismatches in that same upstream PR cost this repo nothing**, and deliberately so: they were settled by renaming the _Express_ parameters, which never appear on the wire, rather than by editing the registry — which would have moved eleven `paths[...]` keys that `forumApi.ts` reads.

- **`userApi` binds to the contract, and with it [#277](https://github.com/orphic-inc/stellar-ui/issues/277)'s baseline reaches ZERO — 14 → 0, the last of twelve services** — all 14 remaining hand-written result types now read `paths[...]`, the two hand-written interfaces behind them (`UserRankRecord`, `UserRankAssignment`) are re-exported as spec-derived aliases so components typing their own props keep working, and `service-types-baseline.json` is empty. **`324 endpoints: 218 spec-typed, 0 hand-typed (0 baselined), 99 inline/void.`** The gate does not go away with the backlog: a newly hand-typed result type still fails immediately, and the list cannot grow again without a deliberate edit to the baseline file.

  **It needed [stellar-api #497](https://github.com/orphic-inc/stellar-api/pull/497), and this was the omission case, not the over-promise one.** The registered `UserRank` omitted `secondary`, `permittedForumIds`, `primaryUserCount` and `secondaryUserCount`, all of which `formatRank()` sends on every one of the four `/tools/user-ranks` routes. Binding to the contract as it stood **failed to compile in six places across three components** — `UserRankManager`'s Type and Forum Overrides columns, `UserRankFormPage`'s form initialisation, and `UserProfile`'s primary/secondary rank pickers — which is the gate doing exactly what it exists to do, and the reason to bind rather than hand-write. Nine spuriously-optional fields were corrected in the same pass, so the three `?? 0` fallbacks the rank manager carried for fields the API always sends are no longer forced.

  **Three casts on bound query results are removed.** `rank.perks as Record<string, boolean>` in `DonatePage` and `DonorRanksPage`, and `forumCategories as ForumCategory[]` (with its local type) in `UserRankFormPage` — all vestigial, all now redundant against the generated types, and all instances of the pattern that hid the `adminApi` invite-tree bug through an entire clean binding. A cast on a query result is the one thing that reliably defeats this whole exercise.

  **`src/types/index.ts` gives up its last two hand-written response shapes.** `ContributionWithHealth` and `DownloadGrant` (with `DownloadGrantStatus`) had **no remaining reference anywhere in `src/`** — dead duplicates of contract components, left behind when their consumers moved on. #277's step 2 is explicit that the deletion is the point rather than the binding: a hand-written type that no longer exists cannot drift. What remains in that file is 20 `components['schemas'][...]` aliases plus UI state (`Alert`, `AuthState`), string-union filter vocabularies and `Collaborator`, which is `ContributeForm`'s local form state — a payload helper, which [ADR-0010](docs/adr/0010-service-result-types-come-from-the-contract.md) exempts by design.

  **A throwaway type probe confirmed the binding, then was deleted.** 65 assertions carrying every previously-hand-typed field through the bound type — and verified to _fail_ on a deliberate typo first, because a probe that cannot fail proves nothing. Green build, "the fix already landed upstream" and "binding silently narrowed something" are indistinguishable without it.

- **`adminApi` binds to the contract, and binding it removed three table columns that had never displayed anything — [#277](https://github.com/orphic-inc/stellar-ui/issues/277) baseline 32 → 14** — all 18 admin result types now read `paths[...]`, and the fourteen hand-written interfaces behind them are gone. Only `userApi` (14) remains.

  **The third shipped bug this migration has found.** `InviteTreeItem` declared **`treeId`, `treeLevel` and `treePosition`, none of which exist** — the `InviteTree` model is a flat adjacency list (`id`, `userId`, `inviterId`, `createdAt`), and there is no tree id, level or position anywhere in the schema. `InviteTreePage` rendered three columns off them, so **three columns have been permanently blank**. They are replaced by one "Invited" column reading the real `createdAt`. Unlike the `isCurrent` bug, there was nothing for the server to supply: `treeLevel` would need a recursive CTE the flat list does not do, and the per-member subtree view already has its own `depth`.

  **Binding alone would not have caught it, and that is the point.** `InviteTreePage` declared its own local `InviteTreeRow` type carrying the three phantom fields and then **cast the response to it** — `data?.data as InviteTreeRow[]` — so `tsc` stayed clean through the binding. The cast is removed and the rows are typed off the service. Its test never asserted on the three columns either, and its fixture supplied all three, so **the suite corroborated the type a third time**; the fixture now mirrors the real row and the new column is covered.

  Two upstream omissions were fixed first in [stellar-api#496](https://github.com/orphic-inc/stellar-api/pull/496): **`FeaturedAlbumItem.image`** and **`InviteTreeItem.createdAt`**, both real columns on whole-row projections.

  **Two fields went the other way, and the contract was the accurate one — the first time in this migration.** `RegistrationLogUser.email` was typed `string | null` here but `User.email` is `String @unique` and the route selects it directly; `InviteTreeItem.inviterId` was typed non-nullable when the column is `Int?`. Binding corrects both, and the type probe asserts the corrected forms so a regression back to the hand-written version fails.

  **The `paths[...]` expressions are spelled out rather than wrapped in a local generic helper.** A first pass used `type Paginated<P extends keyof paths> = ...`, which type-checks identically but reads as hand-written to `service-types:check`, because the guard looks for a literal `paths[`. Satisfying the type checker while defeating the gate is worse than the verbosity.

- **The ten straggler services bind to the contract — [#277](https://github.com/orphic-inc/stellar-ui/issues/277) baseline 50 → 32, leaving only `adminApi` and `userApi`** — all 18 remaining small-service result types now read `paths[...]`: `artistApi` (3), `commentApi` (3), `communityApi` (3), `installApi` (2), `staffInboxApi` (2), and one each in `authApi`, `messagesApi`, `notificationApi`, `profileApi` and `top10Api`. The hand-written `RatioStats`, `RatioBracket`, `PolicyStateView` and `RatioPolicyStatus` are deleted from `src/types/index.ts`, where they were a second description of the API with nothing comparing them to it.

  **Binding turned up a shipped bug and five upstream contract errors.** The bug: **`SessionItem.isCurrent` was a field the API had never sent**, so `session.isCurrent` was `undefined` — the "(this session)" badge never rendered, and because Revoke is gated on `!session.isCurrent`, **Revoke was offered on every row including the one the user was browsing with**. The Settings fixture supplies `isCurrent` on its rows, so the suite agreed with the type rather than with the API; `tsc` was clean throughout. Fixed server-side in [stellar-api#495](https://github.com/orphic-inc/stellar-api/pull/495) — the client cannot compute it, since the session id lives in the HttpOnly token.

  The five contract errors, all fixed upstream in the same PR: one **`Comment` component described four different projections** (the list includes `author` + `editedUser`, the create echo `author` only, the update echo neither); three artist join routes were registered as **`z.record(z.unknown())`**; **`Notification.userId`** and **`Notification.source.url`** were missing, the second load-bearing — the global-notice banner reads it, so binding broke `GlobalNoticeBanner` and `NotificationCorner` at compile time; and **`CommunityVoteState` typed both its fields as integers when `myVote` is `'up' | 'down' | null` and `voteAggregate` is a nullable `ReleaseVoteAggregate` row**.

  **That last one is the methodological lesson of this slice.** A top-level field-name diff reported `CommunityVoteState` as clean, because comparing key sets does not descend into a field's _shape_ — `myVote` and `voteAggregate` were both present and both wrong. It was caught by a **type probe**: a throwaway file asserting each previously-hand-written field through the bound type, which is now the standard closing step. Sixteen assertions, including `myVote`'s union, `voteAggregate`'s nullability and `Notification.source.url`.

  **`commentApi#getComments` is derived directly from `paths[...]` rather than through the `CommentsResponse` alias** — not a correctness change, but the service-types scanner resolves local aliases one level, so a chained alias reads as hand-written when it is not.

- **`rulesApi` binds to the contract — [#277](https://github.com/orphic-inc/stellar-ui/issues/277) baseline 54 → 50** — the four hand-typed rules result types are replaced by reads of `paths[...]`: `RulesPage` (still exported — `RulesManager` types its editor props with it), `RulesPageAuthor` now derived from it, and `RulesIndex`. **This is the first service whose response shapes were already correct in all three descriptions** — the registered `RulesPage` component, this repo's hand-written interface, and the router's `pageSelect` all agreed field for field, and `main` was correctly nullable everywhere because the index uses `findFirst`. Four services running, "clean" had meant "not yet checked"; here it meant clean.

  The three-way diff still found one thing, upstream: **`PUT /rules/{id}` documented neither the 400 nor the 409 it can answer** ([stellar-api#493](https://github.com/orphic-inc/stellar-api/pull/493)) — it runs `validate(updateRulesPageSchema)` and throws on an `isMain` conflict, and `POST /rules` performs the identical check and documents both codes. An inconsistency inside one router, not a design. It does not affect the bound types (result types come from the 2xx), so this binding does not depend on it.

  **`CreateRulesPageArgs` and `UpdateRulesPageArgs` are now read off the request bodies too**, which [ADR-0010](docs/adr/0010-service-result-types-come-from-the-contract.md) does not require — query-argument types are the UI's — but the rules bodies are registered against the Zod schemas that validate them ([stellar-api#490](https://github.com/orphic-inc/stellar-api/pull/490)), so binding them makes the admin editor's form fields unable to drift from what the route accepts, for free. `id` stays a local path param via `{ id: number } & Body`, the shape `reportsApi` already uses. **`createRulesPage` also reads its result from the `201`, not the `200`** — the route answers `201` and the hand-written type had quietly described a status the create path never returns.

  Per the lesson `siteApi` sharpened, binding produced no compile errors and that was **verified rather than assumed**: a throwaway probe asserted all ten `RulesPage` fields, `main`'s nullability, and that the create-`201`, update-`200` and slug-read-`200` echoes are mutually assignable in both directions — not inferred from their sharing a `$ref`.

- **`siteApi` binds to the contract, and this one fails in the opposite direction to the first three — [#277](https://github.com/orphic-inc/stellar-ui/issues/277) baseline 59 → 54** — all five hand-typed site result types are replaced by reads of `paths[...]`: `SiteStatsResponse`, `SiteSettingsResponse`, `UpdateSettingsBody`, and the two exported snapshot rows `SiteStatSnapshot` and `UserStatSnapshot` (still exported, because `UserStatsHistoryPage` builds its chart data off the element type). **`wikiApi`, `requestApi` and `collageApi` each turned up an over-promise — a component claiming a field the route does not send, which a bound client null-checks harmlessly. `siteApi`'s four findings were omissions, and binding to an under-described contract is worse: it silently DROPS fields the response carries.** `SiteStats.maxUsers` and `SiteSettings.dismissedLaunchChecklist` were both absent from the registry and both already read by this repo, so binding before fixing the contract would have deleted two working reads with `tsc` clean — the failure this whole exercise exists to stop, arriving from the other side. Fixed upstream first in [stellar-api#492](https://github.com/orphic-inc/stellar-api/pull/492), which also added `SiteSettings.installedAt` and `SiteStatSnapshot.bucketAt`.

  **Two of those four were missing from this repo's hand-written types as well, which is new.** The running lesson across the first three services was "the UI's hand-written type is the accurate one — treat a disagreement as evidence the contract is wrong", and it was 7 for 7. Here `installedAt` and `bucketAt` were absent from _both_ descriptions, so **there was no disagreement to notice**: the two hand-written artifacts agreed with each other and both under-reported the handler. Same mechanism as a test fixture agreeing with the type it was derived from, one layer out. **Only the projection is evidence; agreement between any two descriptions is not.** `UserStatSnapshot` needed nothing — `getUserStatHistory()` maps its rows explicitly, so `bucketAt` is correctly absent and `contributed`/`consumed` are genuinely nullable (null is what a viewer failing the `showContributedStats` / `showConsumedStats` gate receives).

  **Unlike `requestApi`, binding produced no compile errors, and that is the expected result rather than a skipped check** — the upstream fix landed first, so the contract already matched. Verified positively rather than inferred from a green build: a throwaway type probe asserted each of the six previously-hand-typed fields still resolves through the bound types before it was deleted.

- **The report resolution picker takes its vocabulary from the contract** — [stellar-api#490](https://github.com/orphic-inc/stellar-api/pull/490) rewired `POST /reports/{id}/resolve` to reference the schema that validates it, narrowing `resolutionAction` from a bare `string` to a seven-value enum, which broke `ReportDetailPage`'s `useState('Dismissed')`. **That break is the guard working**, so it is fixed by typing rather than casting: `reportsApi` now exports `ResolutionAction` off the request body, and the component's `RESOLUTION_ACTIONS` option list is annotated with it — so if stellar-api's enum ever moves, the picker fails to compile instead of silently offering a value the server rejects. `ReportForm` needed nothing: `POST /reports` became a discriminated union in the same PR, and the form already branched Release / non-Release exactly the way the union discriminates.

- **`collageApi` binds to the contract — [#277](https://github.com/orphic-inc/stellar-ui/issues/277) baseline 65 → 59** — all six hand-typed collage result types are replaced by reads of `paths[...]`, and the response shapes (`Collage`, `CollageEntry`, `CollageEntryRelease`, `CollageCounts`, `CollageListResponse`) are deleted from `src/types/index.ts`. **The hand-written `Collage` was one flat interface with `entries`, `isSubscribed`, `isBookmarked`, `user` and `_count` all optional, so a list row and a detail read were indistinguishable in the type system** — a component handed a list row could ask for its entries and get `undefined` with `tsc` clean. The contract already separated them (`Collage` for the list rows and the create/update/recover echoes, `CollageDetail` for `GET /collages/{id}` alone), so binding the two names apart is most of the value here. `CollageEdit`'s form prop is now `CollageDetail` rather than the flat type, which is what it always received. `CollageOrderBy` stays hand-written — it is the browse page's sort control, and [ADR-0010](docs/adr/0010-service-result-types-come-from-the-contract.md) leaves query arguments to the UI. **Unlike the previous two services this one exposed no UI bug**, which is itself the finding: slice 4 built this section of the registry properly, and the four corrections it did need ([stellar-api#489](https://github.com/orphic-inc/stellar-api/pull/489)) were field-level rather than structural — a `descriptionHtml` marked optional that every collage response sends, two nullable fields on non-nullable columns, and a `communityId` the add-entry `201` genuinely omits.

- **`requestApi` binds to the contract, and binding it found a feature that has never worked — [#277](https://github.com/orphic-inc/stellar-ui/issues/277) baseline 73 → 65** — all eight hand-typed request result types are replaced by reads of `paths[...]`, and the request response shapes (`RequestItem`, `RequestBounty`, `RequestsListResponse`) are deleted from `src/types/index.ts`, where they were a second description of the API with nothing comparing them to it. **`getRequestBountyHistory` was typed as a bare array of bounties. The route answers `{ bounties, actions }` — two parallel lists.** So `bountyHistory.length` read `undefined` off an object, `undefined > 0` was false, and the Bounty History panel rendered its empty state **for every request, no matter how many bounties it had**. `tsc` was clean throughout, because the hand-written type asserted the wrong shape and the component agreed with it; the test fixture was a bare array too, so **the suite agreed with the type rather than with the API** and the populated case was never actually rendered. This is [#271](https://github.com/orphic-inc/stellar-ui/issues/271)'s failure mode exactly, and the fourth shipped bug of that species. Binding the type turned it into three compile errors. A regression test now pins it: it fails against the old code and passes against the fix. **One test assertion was also removed rather than repaired** — it expected an `Anonymous` cell rendered from a `user: null` bounty, but `RequestBounty.userId` is a non-nullable foreign key, so every bounty-history row carries its pledger; the fixture was the only thing that made that branch reachable. `req.voteCount` also drops an `as { voteCount?: number }` cast: `GET /requests/{id}` answers `RequestDetail`, which declares it.

  Binding also needed a third contract correction upstream ([stellar-api#488](https://github.com/orphic-inc/stellar-api/pull/488)), and **for the third time this repo's hand-written type was the accurate one** — its `RequestBounty.user` was already optional, while the registered component required it, even though five of the eight request routes include bounties without the pledger. `RequestStatus` stays hand-written on purpose: it is the requests page's status **filter**, deliberately narrower than the response enum, and ADR-0010 exempts query-argument types.

- **`wikiApi` binds to the contract — the [#277](https://github.com/orphic-inc/stellar-ui/issues/277) migration starts, baseline 82 → 73** — all nine hand-typed wiki result types are replaced by reads of `paths[...]`/`components[...]`, and their lines drop out of `service-types-baseline.json`. **Binding it took two corrections to stellar-api first, both found by diffing the hand-written types against the registered components before trusting either** — which is the check ADR-0010 exists to force, and in both cases **this repo's hand-written types were the more accurate description**. [stellar-api #486](https://github.com/orphic-inc/stellar-api/pull/486) corrected a `WikiPage` component derived from the Prisma model rather than from `PAGE_SELECT` (it omitted `author` and `aliases`, and claimed a `deletedAt` the reads do not select) and two read routes documented with the wrong status code. [stellar-api #487](https://github.com/orphic-inc/stellar-api/pull/487) then split that single component into the **three** shapes the router actually projects: `WikiPageSummary` for `GET /wiki`, whose list projection has no `body` at all; `WikiPage` for the create, update and rollback echoes, which return the select directly and so carry no `bodyHtml`; and `WikiPageRendered` for the two direct page reads, where `bodyHtml` is **guaranteed** because the row passes through `withBodyHtml()`. One collapsed component had made `body` required on a list that cannot serve it and `bodyHtml` optional on the only two responses that always carry it. The same PR dropped a nullability from `WikiCompare` that a 200 can never express — a revision body that resolves to null answers 404 before the response is built. **The migration order is deliberate**: `wikiApi` was the service the guard flagged first and the one whose contract turned out to be wrong, so it is also the evidence that binding endpoints to a spec nobody has re-read is not a safe mechanical exercise.

- **The vendored API contract catches up with stellar-api's registration backlog** — stellar-api [#474](https://github.com/orphic-inc/stellar-api/issues/474) registered 91 previously-invisible routes across ten slices, so the vendored `openapi.json` was **65 paths and 34 components behind** — at an _identical_ `0.9.0` version string, which is exactly the drift class that a version comparison cannot see and that [#271](https://github.com/orphic-inc/stellar-ui/issues/271) was filed about. **The contract-drift watch added in [#278](https://github.com/orphic-inc/stellar-ui/pull/278) is what surfaced it**, on its first substantive finding. Purely a re-vendor: only the two generated files move, `info.version` is unchanged so [ADR-0004](docs/adr/0004-peer-api-contract-version-coupling.md) coupling is already satisfied and no version bump is owed, and the release only **added** operations — so unlike the resync in #271 this produces **zero** type errors. `typecheck`, `lint` and the full 169-suite test run are clean against the new types. The one path that changed shape rather than being added (`/api/requests*` losing a doubled `/api` prefix) belongs to a service this repo hand-types, so nothing referenced it. **What this unblocks is the point:** six of the seven services [#277](https://github.com/orphic-inc/stellar-ui/issues/277) calls entirely hand-typed now have generated equivalents — `wikiApi`, `top10Api`, `requestApi`, `notificationApi`, `installApi` and `collageApi`, 39 hand-written declarations between them — leaving only `devToolsApi`, whose `/dev/*` routes are deliberately outside the contract.

## [0.9.0] — 2026-08-31

Cut to version parity with stellar-api 0.9.0. The vendored contract body was already current, so `info.version` was the only line that moved — and this is the release in which keeping it current stops depending on somebody remembering to.

### Added

- **The vendored API contract is finally watched against stellar-api itself** ([stellar-ui ADR-0002 amendment](docs/adr/0002-vendored-openapi-contract-and-freshness-gate.md#amendment-2026-08-31--the-third-axis-is-watched-not-gated), [#271](https://github.com/orphic-inc/stellar-ui/issues/271)) — there are three axes on this seam and the repo guarded two, both of them pointing **at** the vendored copy: the `API contract freshness` gate regenerates `api.ts` **from** `src/types/openapi.json`, and `version:check` compares the manifest **to** it. That makes the pair perfectly self-consistent and completely blind — the vendored spec is the fixed point both gates measure against, so it can rot arbitrarily far without either noticing, and it did, three times ([#94](https://github.com/orphic-inc/stellar-ui/issues/94) → [#204](https://github.com/orphic-inc/stellar-ui/issues/204) → #271). Three runtime bugs shipped behind it — an empty community roster, a 404 on promote/demote, and a community save that silently dropped its curator list — with `tsc` clean throughout, because it was type-checking against a contract the API had stopped serving. A new `contract-drift.yml` runs daily, fetches stellar-api's `openapi.json` (both repos are public, so no credentials) and compares it on **content** after a deep key-sort, then keeps **one** reusable issue labelled `contract-drift` in step with what it finds: opened on drift, body rewritten each run, commented only when the upstream fingerprint moves, and **closed automatically** once the vendored copy catches up. `npm run contract:check` runs the same comparison locally. **It is deliberately not a merge gate** — a UI pull request is never wrong because stellar-api moved, and reddening every open PR for a change this repo has not consumed yet is how a gate earns a permanent bypass; the failure being fixed is nobody noticing for weeks, which a daily report fixes. **The issue's own "cheapest" option was rejected on its own evidence:** comparing `info.version` against stellar-api's release tag would not have caught the drift that prompted #271, which was 141 lines behind at an _identical_ `0.8.3`. Version equality is not contract equality, so the watch compares content and reports the version as a separate, softer signal — body drift means `npm run api:sync` is owed and may break `typecheck` (that breakage is the finding), version-only drift means nothing is broken but a parity cut is owed per [ADR-0004](docs/adr/0004-peer-api-contract-version-coupling.md). A failed fetch exits **2, undetermined** — distinct from 0, reds the workflow, and never closes the issue, because "could not compare" must not read as "in sync".

### Changed

- **Avatars can be self-hosted, and the vendored API spec catches up** — stellar-api [#396](https://github.com/orphic-inc/stellar-api/issues/396) narrowed `avatar` (and the donor `customIcon`/`secondAvatar` perks) to `https://` or an `/api/asset/<sha256>` content address, closing a path where plain `http://` — and, on `PUT /api/users/settings`, _any string at all_ — was accepted. The rendering side needed nothing: `avatarSrc` already passes unrecognised values through, the store's `baseUrl` is `/api`, the dev server proxies `/api`, and `img-src 'self'` covers a same-origin path — so a content address resolves as-is. What did need changing is what a member is told: the field was labelled "Avatar URL" with no hint that a stored image is now valid, and no hint that `http://` will be rejected. It now carries both, plus the reason to prefer a self-hosted image — whichever host you point at sees the IP address of every member who views your profile and posts, which is the disclosure stellar-api [#361](https://github.com/orphic-inc/stellar-api/issues/361) is about and which a self-hosted image does not have. `customIconLink` is deliberately untouched: it is a navigation target rather than a fetched subresource, so it discloses nothing until a viewer clicks it and keeps plain URL validation. **The spec resync is the larger half of the diff** — the vendored `openapi.json` was 141 lines behind at an _identical_ `0.8.3` version string, so the freshness gate could not see it (ui#271), and it was also missing the `PUT`/`DELETE` author-stylesheet routes from stellar-api #368.

- **Codacy's ESLint tool is switched off; Trivy and Semgrep stay** ([stellar-ui ADR-0009](docs/adr/0009-codacy-eslint-is-off.md)) — Codacy had accumulated **5,749 open issues**, all from ESLint, and not one of them was a defect. Codacy runs ESLint **8**, which cannot read this repo's flat `eslint.config.mjs`; rather than failing, it silently falls back to its own default pattern set, so every finding is a rule this project does not enable (local `npm run lint` on ESLint 9.39.5 is clean). 84% of the total — 4,806 findings — is the type-aware `no-unsafe-*` family cascading from imports Codacy's no-install analyzer cannot resolve, chiefly `@reduxjs/toolkit/query/react`, which is already excepted under `import/no-unresolved` for that exact reason. The rest is parameter names in _type_ positions read as unused variables, and a security family that inverts the guards it is looking at — `renderedBody` flagged as unencoded when it is the return of `DOMPurify.sanitize` four lines above, `parseSize`'s regex flagged unsafe when it measures linear (0.08 ms on 3 KB, 1.46 ms on 150 KB), and a "timing attack" on a variable named `token` that holds a rules-text template token. All 24 `src` security findings were checked individually. The ADR records the full triage so the count is never re-litigated.

- **All seven dev-only advisories cleared — `npm audit` is now zero** — `@babel/runtime`, `ajv` (ReDoS via `$data`), `brace-expansion` (five DoS entries), `js-yaml` (quadratic CPU via merge-key chains), `picomatch` and `ws`. All confined to `devDependencies`; `npm audit --omit=dev` was already clean, and Codacy never reported them because Trivy scans the production tree. Applied with a plain `npm audit fix`: `package.json` untouched, **no major versions moved**, and `typescript`, `prettier`, `eslint`, `jest`, `webpack` and `react` all confirmed unmoved. `@babel/runtime` reaches the tree only through `@testing-library/*`, so nothing here is bundled. Nine patch/minor bumps and one removal (`regenerator-runtime`, dropped by the `@babel/runtime` bump). Verified with lint, typecheck, `npm test` (169 suites / 1488 tests) and a full production `webpack` build.

- **Eight pages adopt the `Pagination` primitive instead of hand-rolling it** ([stellar-ui ADR-0007](docs/adr/0007-ui-primitive-kit.md)) — `Pagination` has existed in the UI kit since the Toolbox migration, and twelve pages use it, but eight never adopted it and carried a copy of the same Prev/`page / total`/Next footer: `CommunityPage`, `InboxPage`, `SentboxPage`, `FriendsPage`, `MyReportsPage`, `ReportsQueuePage`, `MyTicketsPage`, `TicketQueuePage`. This is the case ADR-0007 exists for — the contract landing once per primitive rather than once per page — not a new abstraction. **`CommunityPage`'s copy was also the un-migrated legacy variant**, styled with raw `bg-gray-700`/`text-gray-400` and no `data-st` hooks, so its pagination did not repaint with themes at all; adopting the primitive fixes that ADR-0005 contract break as a side effect. The control is now labelled **Prev** rather than Previous and renders as a text link rather than a bordered button, matching the twelve pages already on the primitive — a deliberate convergence, and the visible half of this change.

- **The stats history pages share one chart panel** — `SiteStatsHistoryPage` rendered the recharts panel scaffolding twice and `UserStatsHistoryPage` a third time, identical down to the grid stroke, tick fill and tooltip border radius, differing only in heading, height and series. Recharts requires its axis and tooltip children spelled out per chart, so that boilerplate multiplies per panel rather than per page, and the copies had already drifted (only one carried a `YAxis` unit). A new `StatsChartPanel` takes `title`/`data`/`series`/`height`/`yAxisUnit`. It is deliberately local to `stats/` rather than added to the ADR-0007 kit: that kit is presentational primitives emitting the `data-st` token contract, and a recharts wrapper is neither. `SiteStatsHistoryPage` drops 164 → 90 lines.

Together these remove **230 lines of duplicated production code** (jscpd `src`-to-`src`: 414 → 184 duplicated lines, −56%; 61 → 54 clones repo-wide). No behaviour changes beyond the Prev label and link styling noted above.

- **Six browse surfaces adopt a new `PageNumbers` primitive** ([stellar-ui ADR-0007](docs/adr/0007-ui-primitive-kit.md)) — the browse pages want to jump straight to a page rather than step Prev/Next, so each had grown its own numbered pager. Six copies in **four different spellings**: Artists/Users/Releases on `data-st="control"` + `data-st-primary`; Wiki on the same hooks but wider buttons and its page-param write inlined in `onClick`; Requests themed by reaching for `var(--st-*)` inside class strings rather than through the hook vocabulary; and Logs on raw `bg-indigo-600`/`bg-gray-800`/`text-gray-400`. **The Logs pager was a live ADR-0005 contract break** — it kept its colours regardless of the applied theme — and carried a comment explaining that pagination "has no contract Role", a premise the other four pages had already made untrue. `PageNumbers` is the sibling of `Pagination`, not its replacement: Prev/Next suits a queue read front-to-back, numbered suits a browse. It standardises on the contract-correct spelling, and the Requests and Logs pagers change appearance to match — the visible half of this change.

- **Two URL-search-param helpers are shared instead of retyped** — every browse and list page keeps filter state in the query string, so `withPage` (bump the `page` param on a copy, never mutating react-router's live instance) and `formParamSetter` (copy a form field into the params only when non-blank, trimmed) were written out longhand on six and three pages respectively. Only those two are shared: which fields a page has, and which defaults are worth omitting from the URL, stay per-page rather than being folded into a common submit handler.

Together with the pager work, jscpd `src`-to-`src` duplication falls to **97 lines — down 77% from the 414 this pass started at** (61 → 50 clones repo-wide). `PageNumbers` carries one known limitation unchanged from every copy it replaces: no windowing, so a result running to hundreds of pages still renders hundreds of buttons. Adding an ellipsis window is a UX decision rather than a consolidation, so it is deliberately left out.

## [0.8.3] — 2026-08-30

### Added

- **"Remove consumed" bulk action on the Bookmarks page** ([#212](https://github.com/orphic-inc/stellar-ui/issues/212)) — the release-bookmark list is a consumption queue, but it was read-only: clearing the releases you had already grabbed meant unbookmarking them one at a time. The Releases tab now carries a "Remove consumed" button that calls `DELETE /api/bookmarks/releases/consumed` (stellar-api #296), then surfaces a toast with the count and lets RTK Query invalidation refetch the list. The button only appears when releases are bookmarked; `removed: 0` reports "No consumed bookmarks to remove" rather than an error. The API decides what "consumed" means, so no confirm dialog.

### Changed

- **Dependency and toolchain refresh** — the bulk of this release, and the reason it is being cut. The runtime crosses a major: **React 18 → 19** with `react-dom` alongside it, and **react-router-dom 6 → 7**. The build and test stack moves with it — **Babel 7 → 8** across `core`/`preset-env`/`preset-react`/`preset-typescript`/`register`/`eslint-parser` (with the webpack config converted off `@babel/register` to CommonJS), **Jest 29 → 30**, **webpack-cli 5 → 7** and **webpack-dev-server 4 → 6**, `babel-loader` 9 → 10, `css-loader` 6 → 7, `style-loader` 3 → 4, `sass-loader` 13 → 17, `postcss-loader` 7 → 8, `html-loader` 4 → 5, `css-minimizer-webpack-plugin` 5 → 8, `eslint-webpack-plugin` 4 → 6, **stylelint 15 → 17** with `stylelint-config-recommended` 13 → 18 and `stylelint-webpack-plugin` 4 → 5, `@testing-library/jest-dom` 6 → 7, `cross-env` 7 → 10, and Prettier 3.5 → 3.9. Lint crosses **eslint 8 → 9** with the eslintrc config migrated to flat config; flat config has no `--ext`, so `npm run lint` is now plain `eslint src`. **`eslint-plugin-react-hooks` 4 → 7** brings the React Compiler rules with it — the twelve findings they raised were cleared first, in their own pass, so the React bump could land as a dependency change on its own. **FontAwesome 6 → 7** (`fontawesome-svg-core`, `free-solid-svg-icons`, and `react-fontawesome` 0.2 → 3), `normalize-scss` 7 → 8, `katex` 0.16 → 0.18 in lockstep with the API, `reselect` 4 → 5, `@babel/runtime-corejs3` 7 → 8, **husky 8 → 9** and **lint-staged 13 → 17**. Node moves to 24 — `engines` widens from `>=22 <23` to `>=22 <25` and the Docker build image follows. No user-visible behaviour changes with any of it.

- **`@eslint/js` realigned to the installed eslint major** — it had been carried at `^10` (resolving 10.0.1) while `eslint` itself is `^9` (9.39.5), because `@eslint/js` declares no peer dependency on eslint and so nothing rejected the mismatched major. Lint was green, so this was latent rather than broken, but it meant `js.configs.recommended` came from a different major than the engine consuming it. Now pinned to `^9`, matching stellar-api.

- **Form state is seeded at mount instead of resynced by an effect** — eight components hydrated their local form fields from an async query inside a `useEffect`, which re-runs on every refetch and can overwrite what someone is part-way through typing. Each now splits into a shell that waits for the record and a child that seeds `useState` from it, remounted by `key` when the record changes: `SiteSettingsPage`, `CollageEdit`, `ComposeForm`, `WikiEditPage`, `DonorSettingsTab` and the rank panel in `UserProfile` (extracted as `RankAssignmentPanel`); the staff-bio editor drops its effect for a `key` at the call site. `ContributeForm` moves its collaborator reset into the content-type change handler, where the change actually originates. `WikiListPage`'s `SortButton` is hoisted to module scope so it is no longer re-created on every render. `PostBox` replaces the `quoteText`/`onQuoteConsumed` prop pair with an imperative `appendQuote` handle, so quoting a post is a call rather than a prop change an effect has to notice and hand back. One edge case does change, deliberately: `SiteSettingsPage` and `DonorSettingsTab` now hold the spinner when the fetch settles with no record, where before they rendered an empty form whose Save would have written blanks over live settings. Everything else behaves as it did. The work clears the React Compiler findings that `eslint-plugin-react-hooks` v7 reports, so the react 19 bump [#249](https://github.com/orphic-inc/stellar-ui/pull/249) can land as a dependency change on its own.

### Fixed

- **Rendered BBCode headings are styled** — headings produced by the server-side BBCode transcription rendered without heading styles, so they read as body copy.

## [0.8.2] — 2026-07-22

Completes the move of built-in themes to the API: the UI stops shipping theme CSS, stops recognising theme names, and keeps only the branding art it actually owns.

### Added

- **`[tex]` math renders** — KaTeX (`^0.16.47`, pinned to the API's) is now bundled: its stylesheet and glyph fonts ship with the app, and the widened sanitize mirror passes the server-rendered MathML/SVG through, so math authored anywhere BBCode is accepted lays out and styles correctly. Latent until members write `[tex]` — the built-in wiki pages carry none — but lands with the rest of the render-at-read migration so it works the moment they do (stellar-api#403) [#207].
- **Public pages get a footer** — `PublicLayout` now carries the same footer as the private shell (LICENSE and CHANGELOG links, "Powered by Stellar"), painted from `--st-backdrop` / `--st-border-subtle` / `--st-text-faint` so it themes like everything else. The duplicated markup inside `PublicLanding` is dropped in favour of the shared layout.

### Changed

- **BBCode is rendered by the API, not the browser** — forum posts, comments, collage descriptions, staff bios and profile info now display the server-transcribed, sanitized HTML (`bodyHtml` / `descriptionHtml` / `staffBioHtml` / `profileInfoHtml`) instead of parsing raw BBCode client-side, matching the seam the wiki adopted in Phase 1. The raw fields are unchanged and still round-trip the editors. The duplicated client parser `src/utils/bbcode.ts` is retired; its unrelated quote-builder moves to `src/utils/quoteBBCode.ts`. DOMPurify with the API-mirrored allowlist stays as defense-in-depth on inject (stellar-api#402) [#207].
- **Vendored API contract resynced (bodyHtml surfaces)** — the additive `bodyHtml` / `descriptionHtml` / `staffBioHtml` / `profileInfoHtml` fields arrive on their surfaces, along with accrued drift since the last sync (`POST /asset`, the `setupChecklist` item shape). Additive; nothing removed or retyped (stellar-api#402/#403) [#207].
- **Built-in theme CSS is no longer bundled in the UI** — `anorex`, `kuro`, `layer-cake`, `sublime` and `proton` are deleted from `src/stylesheets/`. All five were already unreachable: the first three had their registry `cssUrl` reconciled to the API `/css` route, `sublime` is rule-free by design, and `proton` became API-canonical when stellar-api#341 landed (its imagery served from `/api/asset/<sha256>`). `postmod` stays as the last tenant — its four commercial fonts make migration a redistribution question rather than a bundling one (stellar-api#343) — so the webpack `CopyPlugin` and devServer `static` entries stay with it [#168].
- **The theming contract moved out of the theme directory** — `global.css` is half the contract, not a theme, but lived at `src/stylesheets/common/global.css`, which implied otherwise once that directory held nothing but a blocked theme. It now sits at `src/global.css`, beside the `index.scss` `@theme static` block holding the other half. `src/stylesheets/` is pinned as an exact set by a new guard, so an addition fails loudly and a removal forces a deliberate edit — a whitelist rather than the carve-out list stellar-api#371 warns against.
- **The injector resolves Sublime from data, not from its name** — `StylesheetInjector` linked nothing for Sublime by comparing `siteAppearance` against the string `'sublime'`, a magic string paired across repos with stellar-api's `getDefaultStylesheetName` fallback. It now links nothing because the selected registry row's `cssUrl` is `null` (stellar-api#377 made the field nullable). Two behaviours change with it: an operator who repoints Sublime at a real delivery target now gets it honoured, and a Sublime user's pre-applied `<link>` is no longer torn down while the stylesheets query is still loading — the name comparison short-circuited ahead of the "not resolved yet" guard, reintroducing the cold-load FOUC `preapply-theme.js` prevents. Sublime keeps `isDefault` and its picker entry [#196].
- **Vendored API contract resynced** — `Stylesheet.cssUrl` becomes `string | null` (stellar-api#377) and `GET /asset/{hash}` arrives (stellar-api ADR-0026). Additive; nothing removed or retyped [#196].
- **Donation copy follows the upload to contribution rename** — the Donate page no longer offers "purchasing upload credit" or "Additional upload credit"; both read "contribution" now.
- **README description tightened** — Stellar is described as "a community content tracker" rather than "a modern, next-generation community content tracker and forum software".

### Fixed

- **Light themes no longer render a dark-theme logo** — `THEME_LOGOS` was the last hardcoded theme list in the UI and had gone six themes stale since the API 0.6.4 palette expansion. Every unlisted theme fell through to a `DEFAULT_LOGO` that was kuro's, so members on `white`, `shiro` and `minimal` were served a dark-theme logo on a light background. A theme with no shipped art now gets a theme-agnostic wordmark painted from `--st-text-strong`, which reads on light and dark alike, so absence can only under-brand and never mis-brand. The map's job is now stated explicitly: it is the UI's inventory of art it ships, not a mirror of the API's catalogue.

### Docs

- **e2e container-stack verification runbook** added (`docs/runbooks/e2e-stack-pass.md`) — the operator half of the 0.8.1 readiness runbook, answering whether an image pair actually functions.
- Doc surfaces left stale by the theme deletion were finished: CLAUDE.md's architecture map still listed the deleted directories and pointed at `common/global.css` as "the contract", and both READMEs named the removed `src/stylesheets/layer-cake/` as the worked reference.

### Internal

- The theme-token test now pins the primitive set against `src/index.scss` — the `@theme static` block every `data-st` hook paints from — rather than reading three files that no longer exist.
- `PublicLanding` tests follow the auth links to the component that owns them instead of asserting them locally.

## [0.8.1] — 2026-07-18

Public landing copy, cut to version parity with stellar-api 0.8.1.

### Changed

- **Public landing copy reworded** — the tagline becomes "We didn't start the fire, but it's hot." and the registration CTA reads "Register" rather than "Request Access". The CTA stays conditional on `registrationStatus === 'open'`, so a fresh 0.8.0+ instance (which defaults to `closed`) still shows visitors Sign In alone until an admin opens registration [#187].

## [0.8.0] — 2026-07-18

Flattens the URL space and cuts to version parity with stellar-api 0.8.0 (0.7.0 was never cut here, so this consolidates everything unreleased since v0.6.9).

### Changed

- **The `/private` URL prefix is removed** — authenticated pages now live at their natural paths (`/forums`, `/staff/tools`, `/messages/:id`, ...) and `/` is auth-aware: members get the private homepage, visitors get the public landing (no more client-side bounce through a prefixed URL). A legacy `/private/*` redirect keeps old bookmarks resolving. Public routes (`/login`, `/register`, `/recovery`, `/install`) are unchanged [#183].
- **ModBar follows the inverted launch-checklist item** — the settings quick-link now keys on `registration-closed` (fresh installs default registration to `closed` and the checklist advises opening it at launch; stellar-api#332) instead of the retired `registration-open` warning [#183].
- **Vendored API contract resynced to 0.8.0** — the committed `src/types/openapi.json` had drifted back to the 0.6.4 contract (permitted by the ADR-0004 check, which compares major.minor only). The resync is additive: the `ratioExempt` enum (`NONE`/`FREEPASS`/`NEUTRALPASS`) arrives on the contribution schemas from stellar-api's Freepass/Neutralpass work, and nothing is removed or retyped.

### Internal

- **Renovate manages dependency and image bumps** — matches the stellar-api adoption (fleet #9): weekly grouped non-major bumps, with `platformAutomerge` off so the app merges via the branch-protection bypass. An auto-approve workflow for labeled Renovate PRs was tried and reverted.
- **Dockerfile bases pinned** — build and runtime bases pin to digests rather than floating tags, and the dead Gatsby-era build ARGs are dropped.

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
- **Cut the cold-load theme FOUC on repeat visits** — pre-apply the resolved theme before mount instead of after, and dropped the unmount cleanup that was churning the theme `<link>` on switch. This works from a stored href, so it covers return visits, not a member's first-ever load: that still paints the base state before the profile and stylesheet queries resolve, which is why [#161] remains open. (Corrected 2026-07-20 — this entry originally read "Killed the cold-load theme FOUC", which overclaimed against an issue that never closed.)

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

[Unreleased]: https://github.com/orphic-inc/stellar-ui/compare/v0.9.1...HEAD
[0.9.1]: https://github.com/orphic-inc/stellar-ui/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/orphic-inc/stellar-ui/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/orphic-inc/stellar-ui/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/orphic-inc/stellar-ui/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/orphic-inc/stellar-ui/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/orphic-inc/stellar-ui/compare/v0.6.9...v0.8.0
[0.6.9]: https://github.com/orphic-inc/stellar-ui/compare/v0.6.3...v0.6.9
[0.6.3]: https://github.com/orphic-inc/stellar-ui/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/orphic-inc/stellar-ui/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/orphic-inc/stellar-ui/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/orphic-inc/stellar-ui/compare/v0.5.4...v0.6.0
[0.5.4]: https://github.com/orphic-inc/stellar-ui/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/orphic-inc/stellar-ui/releases/tag/v0.5.3
