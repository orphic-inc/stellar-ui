## Summary

<!-- What this PR changes and why. -->

## Linked issue(s)

<!-- e.g. "Closes #123". Every PR should trace to an issue carrying acceptance criteria. -->

Closes #

## Acceptance criteria

<!-- Copy the issue's Definition of Done and check each item as QA confirms it (ADR-0018, step 6). -->

- [ ]

## QA — agent-run (ADR-0018, step 6)

- [ ] `tsc --noEmit` clean and unit/component tests pass.
- [ ] E2E / visual verified for the affected flows (Playwright / Chrome DevTools where applicable).
- [ ] No accessibility regressions in the changed UI (semantics, focus, contrast).

## UAT — human (ADR-0018, step 6)

- [ ] Stakeholder acceptance over the green checklist above. (This is the one step that is not delegable.)

## API contract dependency (CONTEXT-MAP "Contract hygiene")

<!-- Tick exactly one. -->

- [ ] Consumes a stellar-api surface → originating stellar-api issue/PR linked, and `src/types/api.ts` regenerated from the pinned contract if needed.
- [ ] UI-only change — no API surface involved.
