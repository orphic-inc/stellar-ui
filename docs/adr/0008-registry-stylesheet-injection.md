# ADR-0008: Registry stylesheet injection — the injector's third source branch

**Status:** accepted (2026-07-03).
**Relates:** stellar-ui [ADR-0003](0003-stylesheet-injection-ui-boundary.md) (the injection-safety boundary this rides on), stellar-api [ADR-0024](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0024-stylesheet-delivery-contract.md) (the platform delivery contract this realizes), issue [#161](https://github.com/orphic-inc/stellar-ui/issues/161) (the theme-FOUC this is coupled to but does **not** fix).

## Context

A member's Site Stylesheet slot has, until now, one renderable source in the UI: a **Personal** external URL (`UserSettings.externalStylesheet`), injected as a `<link href>` by `StylesheetInjector`. stellar-api ADR-0024 adds the second source — **Registry** — a platform-stored author stylesheet a member adopts. Adoption writes `UserSettings.activeAuthorStylesheetId`, and the API now delivers that sheet's stored, sanitized CSS from `GET /api/stylesheet/author-stylesheet/:id/css` (`text/css`).

The injector had no branch for it: the pointer was not in the profile contract (it is now, via the `api:sync`) and nothing linked the delivery route. This ADR records how the UI holds its half of ADR-0024 without widening the ADR-0003 boundary.

## Decision

1. **The injector gains a third source branch, linking the API `/css` route — still a `<link href>`.** When `activeAuthorStylesheetId` is set, the injector links `/api/stylesheet/author-stylesheet/:id/css`, exactly as the Personal branch links an external URL. The request is same-origin, so the browser sends the auth cookie with it; the dev server already proxies `/api`. No `<style>` text-injection path is added — a Registry sheet arrives as an `href`, never as CSS text, keeping ADR-0003's "href, never CSS source" invariant one-shaped.

2. **Precedence is single-winner, not a stack (ADR-0024 §4).** The slot resolves to exactly one `href`: `externalStylesheet` (if injectable) → Registry (`activeAuthorStylesheetId`) → `siteAppearance` built-in → Sublime (no link). The API enforces Personal XOR Registry, so at most one of the first two branches is ever populated; if both somehow arrive, external wins and there is still only one `<link id="stellar-theme">`. `siteAppearance` is a **separate axis** (the built-in fallback), not one of the two explicit-slot arms.

3. **`isInjectableUrl` is https-only (ADR-0024 §3).** The Personal URL scheme gate drops `http:` — the API stores only `https:` URLs, the prod CSP `style-src` is https-scoped, and `http:` would mixed-content-block anyway. Admitting it would read like a promise the render path can't keep.

4. **The Settings UI presents the slot as a Personal ⟷ Registry radio, mirroring the server invariant.** Selecting one submits the other as null (`externalStylesheet = ''` ⟷ `activeAuthorStylesheetId = null`), so the two never coexist in a write. The server is still the authority (it re-enforces the invariant); the radio is the mirror, not the gate. Registry adoption itself remains **by direct reference from a stylesheet's page** — the browse/gallery UX is deferred (ADR-0024 §5), so the Registry arm in Settings displays the adopted sheet and lets a member switch away, rather than pick a new one.

## Consequences

- The full adopt→display pipe closes on the UI side: adopt → pointer (contract) → injector Registry branch → `/css` route.
- Anyone extending the injector must keep the single-winner shape — a third source is a third *input to one `href`*, never a third layer. A Registry sheet must stay on the `/css`-route `href` path; do not add a `<style>` sink for it.
- **The theme FOUC ([#161](https://github.com/orphic-inc/stellar-ui/issues/161)) is untouched.** The injector still applies client-side in a `useEffect` after the profile query resolves, so the first paint is the un-themed base state. This ADR does not fix that — it is called out because both live in this same `href` logic and are natural to fix together in a later pass.
