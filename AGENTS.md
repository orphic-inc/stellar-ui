# AGENTS.md — stellar-ui

React / TypeScript SPA for the Stellar platform. **Webpack** bundler, RTK Query, React Router v6, Tailwind CSS v4.

> This file is deliberately thin. The full, maintained agent guide is **[CLAUDE.md](CLAUDE.md)** (architecture map, RTK Query patterns, the ~42-permission catalogue, theming migration playbook, UI-primitive-kit gotchas). Human contributors start at **[docs/README.md](docs/README.md)**, the root **[README.md](README.md)**, and **[CONTRIBUTING.md](CONTRIBUTING.md)**. Keeping the depth in one place (CLAUDE.md) is intentional — a second full copy here rotted once and must not be recreated.

## Commands (authoritative quick reference)

```bash
npm start                # Webpack dev server on :9000, proxies ONLY /api → :8080
npm run build            # production build
npx tsc --noEmit         # type-check (run before committing)
npm run test             # Jest suite
npm run api:sync         # pull ../stellar-api/openapi.json → regenerate src/types/api.ts
```

## Structure (authoritative anchors)

- Entry: `src/index.tsx` (React root) → `src/components/App.tsx` (install probe → route tree).
- Store: `src/store/api.ts` (RTK Query base + tag types), `src/store/services/*` (per-domain APIs), `src/store/slices/*`.
- Types: `src/types/api.ts` is **generated** from stellar-api's OpenAPI spec — never hand-edit; derive via `components['schemas'][...]` / `paths[...][method]`.
- Theming: `src/components/layout/StylesheetInjector.tsx` + `src/stylesheets/<theme>/`; the token/`data-st` contract is in [docs/theming.md](docs/theming.md) and stellar-ui ADR-0005/0007/0008.
- Permissions: `src/utils/permissions.ts`; the full permission list is in [CLAUDE.md](CLAUDE.md).

Everything beyond these anchors — the exhaustive service map, patterns, and gotchas — lives in [CLAUDE.md](CLAUDE.md). Consult it rather than trusting a summary here.
