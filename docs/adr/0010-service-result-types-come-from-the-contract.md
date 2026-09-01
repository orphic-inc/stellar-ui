# ADR-0010: RTK Query result types come from the generated contract

**Status:** Accepted (2026-09-01). Records a decision shipped in [#277](https://github.com/orphic-inc/stellar-ui/issues/277).
**Date:** 2026-09-01
**Repos:** orphic-inc/stellar-ui
**Relates:** [ADR-0002 — vendored OpenAPI contract + freshness gate](0002-vendored-openapi-contract-and-freshness-gate.md) (this is the third axis's consumer-side sibling) · [#271](https://github.com/orphic-inc/stellar-ui/issues/271) (the same failure one layer in) · stellar-api [#474](https://github.com/orphic-inc/stellar-api/issues/474) (which removed the excuse)

---

## Context

`src/store/services/` declares each endpoint's result type as the first type argument of `build.query<Result, Arg>` / `build.mutation<Result, Arg>`. Where that type is a hand-written `interface`, the repo holds a **second, parallel description of the API's response shapes**, and nothing compares it to the real one.

This is the same failure as ADR-0002's third axis, one layer further out:

|     | Axis                                | Guarded by                                                                  |
| --- | ----------------------------------- | --------------------------------------------------------------------------- |
| 1   | `api.ts` ↔ vendored `openapi.json`  | ADR-0002 freshness gate                                                     |
| 2   | manifest ↔ vendored `openapi.json`  | ADR-0004 `version:check`                                                    |
| 3   | vendored spec ↔ stellar-api         | the drift watch ([#278](https://github.com/orphic-inc/stellar-ui/pull/278)) |
| 4   | **service result types ↔ `api.ts`** | **this ADR**                                                                |

[#271](https://github.com/orphic-inc/stellar-ui/issues/271)'s conclusion applies verbatim: **a green typecheck against a stale type is worse than no typecheck**, because it actively asserts correctness. Three runtime bugs shipped exactly that way — an empty community roster, a 404 on promote/demote, and a save that silently dropped its curator list — with `tsc` clean throughout.

**Most of it was not anyone's fault.** stellar-api had 91 routes that existed but were unregistered, so for those endpoints there was no generated type to bind to and one had to be written. stellar-api #474 registered all 91, which removes the reason and makes the rest a migration.

At the time of this decision: **324 endpoints — 136 spec-typed, 82 hand-typed, 99 inline or `void`.**

## Decision

**An endpoint's result type must come from the generated client, and CI enforces it against a shrink-only baseline.**

- `npm run service-types:check` parses every `build.query`/`build.mutation` result type and classifies it as spec-derived (reads `paths[...]` or `components[...]`, directly or through a local alias), hand-written, or inline.
- `.github/workflows/publish.yml` runs it in the `test` job.
- `service-types-baseline.json` grandfathers the 82 that exist today. It is a **ratchet**, on the same three rules as stellar-api's completeness gate: a hand-typed endpoint absent from the baseline fails; a baselined endpoint that is now spec-typed fails as stale; a baselined endpoint that no longer exists fails as stale. **The list can only shrink.**
- `--inventory` prints the per-file breakdown; `--write-baseline` regenerates.

### What is deliberately _not_ flagged

- **`void`, primitives and inline object literals.** `void` is correct for a 204, and an inline `{ msg: string }` duplicates `MsgResponse` only trivially. Flagging them would bury the real findings.
- **Query-argument types** — the _second_ type parameter. Payload and query-param helpers are legitimately the UI's own; only response shapes are the API's to describe.
- **`devToolsApi.ts`.** Its `/dev/*` routes are deliberately outside the OpenAPI contract, so there is nothing to bind to. Exempt by path, and it should stay hand-typed.

## Rationale

**The guard lands before the migration, not after.** #277 sequenced it last; #474 showed the opposite works better. A baseline-ratchet gate blocks _new_ drift from its first day while the backlog burns down at whatever pace review allows — whereas a migration-first approach leaves the door open for the entire time it takes.

**A suppression list nothing audits is how the original gap survived.** Rules 2 and 3 are what stop the baseline becoming a permanent mute; without them a list of 82 exemptions is just a record that nobody is looking.

**Parsing, not type-checking.** The check reads the source rather than asking the compiler, which is cheap and dependency-free but means it reasons about _where a type came from_, not whether it is correct. That is the right question here: a hand-written type that happens to match today is still unguarded tomorrow.

## Consequences

- New endpoints must bind to the contract, or CI fails on the first push. If a route genuinely has no registered contract, the fix is to register it in stellar-api — not to add a baseline entry.
- The 82 are a visible, shrinking backlog rather than an invisible one. Each migration PR deletes both the hand-written declaration and its baseline line.
- The check reasons syntactically, so a sufficiently indirect alias chain could be misread. It is pinned by the repo's own usage rather than by unit tests; if it ever misclassifies, fix the classifier rather than adding an exemption.
- This is the UI's half of a contract discipline that now spans four axes and both repos. The API half is stellar-api ADR-0018 plus its completeness gate.
