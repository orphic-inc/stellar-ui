# ADR-0004: UI version coupled to the vendored API contract

**Status:** Accepted (2026-06-25).
**Date:** 2026-06-25
**Repos:** orphic-inc/stellar-ui
**Relates:** [ADR-0002 — vendored OpenAPI contract + freshness gate](0002-vendored-openapi-contract-and-freshness-gate.md) (the contract this version tracks); stellar-api [ADR-0018 — development lifecycle & contract gate](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0018-development-lifecycle-and-contract-gate.md)

---

## Context

The UI vendors stellar-api's OpenAPI spec at `src/types/openapi.json` (ADR-0002) and generates `api.ts` from it. The UI also carries its own manifest version in `package.json`. Nothing tied the two together, and they drifted: the UI shipped the `0.6.0` contract while its manifest still read `0.5.4`. A reader of the manifest had no way to know which API contract that build actually speaks.

The footer already shows the *runtime* platform version post-#105 (read from `GET /api/version`, falling back to `__APP_VERSION__`). That answers "what API is this UI talking to right now," but it says nothing about the committed contract the build was generated against. The drift this ADR addresses is in the **committed** surfaces, not the runtime display.

## Decision

**The UI's `major.minor` tracks the vendored API contract it ships; the patch digit is the UI's own release cadence.**

- When the UI re-syncs to a new contract M.m (`api:sync`), the manifest's M.m moves with it. A UI vendoring contract `0.6.x` is versioned `0.6.x`.
- The patch digit is independent: the UI can ship `0.6.1`, `0.6.2`, … against a single `0.6.0` contract for UI-only work.
- Enforced in `version:check` (`scripts/check-version-consistency.mjs`): a dedicated assertion compares `package.json` and `src/types/openapi.json` on **major.minor only**, separate from the full-version surfaces (lockfile, CHANGELOG) that must equal the manifest exactly.
- The `vX.Y.Z` git **tag** is left to upstream (`orphic-inc`) as the release authority; this coupling governs the manifest in-tree, not tagging.

## Consequences

- The manifest now names the API contract the build speaks — `0.6.x` ⇒ `0.6.x` contract — and an `api:sync` that bumps the contract M.m forces a matching manifest bump or `version:check` reds.
- UI-only releases stay cheap: bump the patch, no contract change required.
- This is the manifest-side discipline; the runtime footer (#105) and the freshness gate (ADR-0002) remain the other two halves of the contract story.

### This does not subsume `GET /api/version` (#105)

The manifest and the runtime endpoint answer different questions and are not redundant, so the coupling here does not retire the footer's version source:

- **Manifest version (this ADR)** — *which contract this bundle was built against.* A build-time fact, frozen at compile time and verified in CI.
- **`GET /api/version` (#105)** — *which version the platform is actually running.* A runtime fact, read live; the footer prefers it and falls back to `__APP_VERSION__` (the manifest) only when the request is in flight or the API is unreachable.

Because the UI and API deploy independently — the reason they carry separate version lines at all — the live API can be ahead of the bundle a browser is running. CI gates are frozen at build and cannot see that; the runtime endpoint is the only signal that surfaces a deployed mismatch. Removing it would leave the footer showing a build-frozen number that silently goes stale against the running platform. The two are complementary, not duplicative: this ADR governs the *committed manifest*, never the runtime display.
