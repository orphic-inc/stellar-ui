# ADR-0001: Record UI architectural decisions here

**Status:** Accepted (2026-06-25)
**Date:** 2026-06-25
**Repos:** orphic-inc/stellar-ui
**Relates:** stellar-api [ADR-0018 — development lifecycle & contract gate](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0018-development-lifecycle-and-contract-gate.md); stellar-api `CONTEXT-MAP.md` (advertises this `docs/adr/` home)
**Tracks:** [#106](https://github.com/orphic-inc/stellar-ui/issues/106)

---

## Context

stellar-api keeps an Architecture Decision Record register under `docs/adr/`, and its `CONTEXT-MAP.md` advertises a matching `stellar-ui docs/adr/` — but the UI repo had no such home. UI-side decisions that were already made implicitly (the vendored-OpenAPI contract gate, the stylesheet-injection boundary, the OpenAPI-vendoring approach) had nowhere to live, so the rationale survived only in commit messages and issue threads.

There is also a **naming collision** to resolve. stellar-ui code and docs already cite bare `ADR-00NN` numbers — `ADR-0003`, `ADR-0006`, `ADR-0018`, `ADR-0020`, `ADR-0021` — and every one of those points at **stellar-api's** register, because those are platform/cross-cutting decisions owned by the system of record. A UI-local register that also starts at 0001 would make `ADR-0003` ambiguous.

## Decision

1. **stellar-ui keeps its own ADR register** at `docs/adr/`, using the same lightweight format stellar-api uses: a `# ADR-NNNN: Title` heading, a short status/date/relates header, then `## Context` / `## Decision` / `## Consequences`.

2. **Numbering is local and independent.** stellar-ui ADRs are numbered from 0001 in this directory. They have no relationship to stellar-api's ADR numbers.

3. **Disambiguation rule for references:**

   - A bare `ADR-00NN` in stellar-ui code, comments, or commit messages denotes **stellar-api's** register (the platform decisions: theming isolation, ratio relief, the dev lifecycle, etc.). This preserves every existing citation unchanged.
   - A stellar-ui-local decision is cited as **`stellar-ui ADR-00NN`** (or links directly to the file here).
   - Genuinely cross-system decisions (those that bind API + UI + sidecar together, e.g. the dev lifecycle and contract gate) stay in **stellar-api's** register, since that is where `CONTEXT-MAP.md` points the whole system. This UI register holds decisions whose blast radius is the frontend.

4. **Scope.** Record a decision here when it is architectural and UI-owned: it constrains future UI work, has a non-obvious rationale, and a reasonable contributor could have chosen otherwise. Don't record routine component or styling choices.

## Consequences

- The UI's already-made decisions can be backfilled (this batch seeds [stellar-ui ADR-0002](0002-vendored-openapi-contract-and-freshness-gate.md) and [ADR-0003](0003-stylesheet-injection-ui-boundary.md)).
- Once this home exists, stellar-api's `CONTEXT-MAP.md` can un-mark the `stellar-ui docs/adr/` cell (currently _pending_).
- Existing `ADR-00NN` citations in the UI codebase keep meaning "the stellar-api decision," so nothing has to be rewritten.
