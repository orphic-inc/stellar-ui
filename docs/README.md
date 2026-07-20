# Stellar UI — Developer Documentation

The human entry point for developing the Stellar UI. Start here after the root [README.md](../README.md) (install & run) and [CONTRIBUTING.md](../CONTRIBUTING.md) (fork workflow, standards, PR gate). [CLAUDE.md](../CLAUDE.md) / [AGENTS.md](../AGENTS.md) carry the same ground formatted for AI coding agents — this is the human-facing source.

## Where things live

| You want to…                                          | Read                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Install and run locally (incl. the `/api`-only proxy) | [root README](../README.md)                                                                      |
| Contribute (fork model, rebase-only, api sync, tests) | [CONTRIBUTING.md](../CONTRIBUTING.md)                                                            |
| Understand the architecture                           | [Architecture](#architecture) (below)                                                            |
| Extend the UI (add a page/service/component)          | [Extending the UI](#extending-the-ui) (below)                                                    |
| Author or register a theme                            | [Theming](#theming) (below) + [theming.md](theming.md)                                           |
| Understand a UI design decision                       | [`adr/`](adr/) — see its [index](adr/README.md)                                                  |
| The four-repo constellation                           | [stellar-api CONTEXT-MAP.md](https://github.com/orphic-inc/stellar-api/blob/main/CONTEXT-MAP.md) |

## Architecture

React 18 SPA, Webpack-bundled, Redux Toolkit + **RTK Query** for all data, React Router v6, Tailwind v4. The UI is a pure client over the [stellar-api](https://github.com/orphic-inc/stellar-api) backend — every data call goes through `/api` (see the proxy note in the root README).

- Entry `src/index.tsx` → `src/components/App.tsx` (install probe → route tree).
- Data lives in RTK Query services under `src/store/services/*`, over the base API in `src/store/api.ts`; UI slices in `src/store/slices/*`.
- API types are **generated** into `src/types/api.ts` from the vendored `src/types/openapi.json` — never hand-write a type the spec already provides.

## Extending the UI

- **Types come from the contract.** Derive request/response types from the generated spec — `components['schemas']['Foo']` or `paths['/route']['get']['responses'][200]['content']['application/json']` — never hand-written interfaces. If stellar-api changed the shape, `npm run api:sync` first.
- **Data goes through RTK Query.** Add an endpoint to the relevant `src/store/services/*.ts`. Register any new tag type in `src/store/api.ts` **before** using it; mutations must invalidate the specific tags their queries provide (use `{ type: 'ForumTopic', id }`, not the bare tag). Read errors as `err.data?.msg` / `err.data?.errors` (never `err.data?.error`).
- **Build UI from the primitive kit.** New surfaces should use the primitive kit in `src/components/ui/` (`PageShell`/`Panel`/`Button`/`Field`/`DataTable`/`Badge`/`Pagination`/`SectionHeading`) — each emits the theming `data-st` contract, so adopting a primitive completes the theming migration for that surface (stellar-ui [ADR-0007](adr/0007-ui-primitive-kit.md)). Staff tools additionally register in `staffToolRegistry.tsx` (permission-filtered; only add links for implemented routes).
- The exhaustive service map and pattern gotchas are in [CLAUDE.md](../CLAUDE.md).

## Theming

Themes target **role tokens** (`--st-*`) and semantic `data-st` hooks, not raw component styles — a two-tier vocabulary (Roles vs Parts). The full contract, token catalogue, and a worked recolor example (`layer-cake`, the ~20-token reference — api-canonical since ui#168, so it is no longer a directory in this repo) are in **[theming.md](theming.md)** (stellar-ui [ADR-0005](adr/0005-injected-theme-contract.md)/[0006](adr/0006-table-and-form-contract.md)).

- **Authoring** (recolor or restructure a theme): follow theming.md §4 — copy the token set, restyle, run the §11 verification.
- **Registering** a bundled theme so the injector serves it: see [ADR-0008](adr/0008-registry-stylesheet-injection.md) and `src/components/layout/StylesheetInjector.tsx` (single-winner precedence; adopted registry sheets link the API `/css` route).
