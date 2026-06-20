# Domain Docs

How the engineering skills should consume this project's domain documentation when exploring the codebase. Stellar is a **multi-context** project spread across repositories; this repo is the **frontend** context. One context (`korin.pink`) is external to the orphic-inc origin.

## Before exploring, read these

- **`CONTEXT-MAP.md`** — the cross-repo index. It lives in `orphic-inc/stellar-api` (the system-of-record repo) and points to one `CONTEXT.md` per context (stellar-api's platform/API context, this repo's frontend/theming context, and external korin.pink's IRC+ledger context). Read the context(s) relevant to your topic.
- This repo's **`CONTEXT.md`** for the frontend / theming domain glossary.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. Cross-repo / system-wide decisions (e.g. ADR-0013 korin integration, ADR-0016 accounting contract, ADR-0018 development lifecycle & contract gate) live in **stellar-api's** `docs/adr/`; this repo carries its own context-scoped (frontend/theming) ADRs.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Multi-context, cross-repo:

```
stellar-api/   (orphic-inc · system of record)
├── CONTEXT-MAP.md       ← indexes every context's CONTEXT.md
├── CONTEXT.md           ← platform / API context
└── docs/adr/            ← system-wide + API-scoped decisions

stellar-ui/    (this repo · orphic-inc)
├── CONTEXT.md           ← frontend / theming context
└── docs/adr/            ← frontend-scoped decisions

korin.pink/    (obrien-k · external)
└── docs/CONTEXT.md      ← IRC + ledger accounting context
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant context's `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids, and don't reach for legacy-reference vocabulary in anything committed.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0018 (development-lifecycle-and-contract-gate) — but worth reopening because…_
