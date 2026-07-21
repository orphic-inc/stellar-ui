# ADR-0002: Vendored OpenAPI contract + CI freshness gate

**Status:** Accepted (2026-06-25). Records a decision shipped in [#94](https://github.com/orphic-inc/stellar-ui/issues/94).
**Date:** 2026-06-25
**Repos:** orphic-inc/stellar-ui
**Relates:** stellar-api [ADR-0018 — development lifecycle & contract gate](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0018-development-lifecycle-and-contract-gate.md) (the API-side OpenAPI/ERD freshness gates this mirrors)

---

## Context

The UI's request/response types in `src/types/api.ts` are generated from stellar-api's OpenAPI spec via `openapi-typescript`. Two failure modes threaten this seam:

1. **Generating against a moving target.** If `api.ts` were regenerated directly from a live stellar-api at build time, the types could shift under the UI without an intentional, reviewable commit — and CI could pass or fail depending on whichever API happened to be running.
2. **Silent staleness.** If `api.ts` is committed but nothing enforces that it still matches its source spec, a hand-edit or a forgotten regeneration drifts the UI's view of the contract away from reality, and the divergence is invisible until something breaks at runtime.

stellar-api already guards its side with OpenAPI + ERD freshness gates in CI (stellar-api ADR-0018). The UI needs the analogous guard.

## Decision

**Vendor the spec, pin it, and gate freshness in CI.**

- The OpenAPI document is **vendored** into the UI repo at `src/types/openapi.json` — a pinned snapshot, not a live fetch. `api.ts` is generated from that committed file (`npm run api:generate`).
- Re-syncing the spec is a **deliberate, separate act**: `npm run api:sync` copies `../stellar-api/openapi.json` over the vendored copy and regenerates. This is a manual step before any PR that touches API response shapes (per `AGENTS.md`).
- CI enforces freshness with an **`API contract freshness`** step in `.github/workflows/publish.yml`: it runs `npm run api:generate && git diff --exit-code src/types/api.ts`. If the committed `api.ts` doesn't match what regeneration produces from the vendored spec, the build reds.

## Consequences

- `api.ts` is generated, never hand-edited; the freshness gate makes a hand-edit fail CI. Handwritten types that don't exist in the spec live in `src/types/index.ts` instead.
- The UI is always built against a known, reviewed contract snapshot — regenerating is reproducible and independent of any running API.
- Adopting a new API surface is an explicit `api:sync` + commit, which shows up in review as a contract change rather than an invisible drift.
- This is the UI half of the platform's contract discipline; the API half (registering routes in the OpenAPI registry, paired UI tracking issues) lives in stellar-api ADR-0018.
