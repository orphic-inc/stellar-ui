# ADR-0002: Vendored OpenAPI contract + CI freshness gate

**Status:** Accepted (2026-06-25). Records a decision shipped in [#94](https://github.com/orphic-inc/stellar-ui/issues/94).
**Date:** 2026-06-25
**Amended:** 2026-08-31 — the freshness gate below guards `api.ts` against the **vendored** spec, and nothing ever guarded the vendored spec against **stellar-api**. That axis rotted three times ([#94](https://github.com/orphic-inc/stellar-ui/issues/94) → [#204](https://github.com/orphic-inc/stellar-ui/issues/204) → [#271](https://github.com/orphic-inc/stellar-ui/issues/271)) and shipped three runtime bugs behind a green typecheck. Closed by an out-of-band scheduled watch, deliberately **not** a merge gate. See [Amendment](#amendment-2026-08-31--the-third-axis-is-watched-not-gated).
**Repos:** orphic-inc/stellar-ui
**Relates:** stellar-api [ADR-0018 — development lifecycle & contract gate](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0018-development-lifecycle-and-contract-gate.md) (the API-side OpenAPI/ERD freshness gates this mirrors) · [ADR-0004 — peer API contract version coupling](0004-peer-api-contract-version-coupling.md) (the manifest ↔ vendored-spec axis)

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

> **Extended 2026-08-31.** "Deliberate, separate act" above is exactly right about intent and exactly the problem in practice: a step that depends on somebody remembering has no gate behind it. The amendment below adds the missing observation without making the act any less deliberate.

---

## Amendment (2026-08-31) — the third axis is watched, not gated

**Origin:** [#271](https://github.com/orphic-inc/stellar-ui/issues/271), filed on the third recurrence of the same drift.

### What the original decision left uncovered

There are three axes on this seam, and until now the repo guarded two:

|     | Axis                                                   | Guarded by                                                               |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1   | `src/types/api.ts` ↔ vendored `openapi.json`           | the `API contract freshness` step above                                  |
| 2   | `package.json` ↔ vendored `openapi.json` (major.minor) | `version:check` ([ADR-0004](0004-peer-api-contract-version-coupling.md)) |
| 3   | **vendored `openapi.json` ↔ stellar-api**              | **nothing**                                                              |

Both guarded axes point _at the vendored copy_. That makes the pair perfectly self-consistent and completely blind: the vendored spec is the fixed point both gates measure against, so it can rot arbitrarily far without either of them noticing. The freshness gate cannot close axis 3 by construction — CI checks out only stellar-ui, and `api:sync` reads `../stellar-api/openapi.json` across a sibling path that does not exist on a runner.

The cost is not theoretical. Three runtime bugs shipped behind a stale spec — an empty community roster, a 404 on promote/demote, and a community save that silently dropped its curator list — with `tsc` clean throughout, because it was type-checking against a contract the API had stopped serving. **A green typecheck against a stale spec is worse than no typecheck**: it actively asserts correctness.

### The decision

**Add a scheduled, out-of-band drift watch. Do not add a merge gate.**

- `scripts/check-contract-drift.mjs` fetches stellar-api's `openapi.json` from its default branch (both repos are public, so this needs no credentials) and compares it to the vendored copy on **content**, after a deep key-sort so re-serialisation upstream cannot read as drift.
- `.github/workflows/contract-drift.yml` runs it daily and on `workflow_dispatch`, and reports into **one** reusable tracking issue labelled `contract-drift` — opened on drift, its body rewritten to the current state each run, commented only when the upstream fingerprint moves, and **closed automatically** when the vendored copy catches up.
- `npm run contract:check` runs the same comparison locally. `--local ../stellar-api/openapi.json` compares against a sibling checkout instead of the network.
- **`publish.yml` is untouched.** No new required check.

### Why watched and not gated

A UI pull request is never wrong because stellar-api moved. Making the comparison a required check reds every open PR the moment the API merges a contract change this repo has not consumed yet — punishing authors for something outside their diff, which is how a gate earns a permanent bypass. The failure mode being fixed is _nobody noticing for weeks_, and drift measured in days is fixed by a daily report. Blocking buys nothing the schedule does not, and costs the gate's credibility.

The tracking issue is the deliberate reading surface the original decision assumed existed and did not.

### Two drift classes, reported separately

They cost different things, so the watch does not conflate them:

- **Body drift** — paths or schemas differ. `npm run api:sync` is owed, and it can legitimately break `npm run typecheck`; that breakage _is_ the finding.
- **Version drift** — the bodies are byte-identical and only `info.version` differs. Nothing is broken; per [ADR-0004](0004-peer-api-contract-version-coupling.md) a version-parity cut is owed once the contract's minor moves.

### Why the cheap version check was rejected

#271 proposed comparing the vendored `info.version` against stellar-api's latest release tag, and called it "the cheap signal nobody is reading." It is cheap, and it would not have caught the drift that prompted the issue: that copy was **141 lines behind at an identical `0.8.3`**. Version equality is not contract equality, and a check that passes the exact case it was filed for is worse than none — it converts an open question into a false assurance. Only content comparison covers the class, so the watch compares content and treats the version as a second, separate signal.

### Consequences

- Axis 3 is observed on a schedule; it is still not _enforced_, and that is the decision, not an omission. Someone must act on the tracking issue.
- The watch runs with no `npm ci`: the checker is dependency-free on purpose, so it keeps reporting even when the tree does not install.
- A failed fetch exits **2 — undetermined**, distinct from 0, and reds the workflow rather than closing the issue. "Could not compare" must never read as "in sync", and the checker never falls back to a different source (stellar-api #461's lesson).
- The label `contract-drift` is load-bearing: it is how the workflow finds the one issue it owns. The issue should not be closed by hand while drift stands — the next run reopens it.
