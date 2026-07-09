# Stellar UI

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ddbd8663fbd640aa96f4a89770a387d6)](https://app.codacy.com/gh/orphic-inc/stellar-ui/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

This is the React-based Single Page Application (SPA) for **Stellar**, a modern, next-generation community content tracker and forum software.

The UI is the front door to Stellar's invite-only Communities — browsing/contributing releases, forums, profiles, and **user theming** (the StylesheetInjector applies built-in or user-authored stylesheets site-wide).

## What's here

- **Communities, forums & profiles** — the member-facing surfaces over the [stellar-api](https://github.com/orphic-inc/stellar-api) backend.
- **Contributions & releases** — submit/browse releases; file-size input (see [#65](https://github.com/orphic-inc/stellar-ui/issues/65)).
- **Theming / StylesheetInjector** — `src/components/layout/StylesheetInjector.tsx` applies a selected theme or a user's profile stylesheet behind a global-CSS-reset boundary. Themes live in `src/stylesheets/<theme>/` (`kuro`, `layer-cake`, `postmod`, `proton`, `sublime`).

## Documentation

The README is the lamp-post; the developer guide is **[`docs/README.md`](docs/README.md)** (architecture, theming, extending the UI). Product/decision specs live in **stellar-api** [`docs/`](https://github.com/orphic-inc/stellar-api/tree/main/docs); UI-owned decisions are in [`docs/adr/`](docs/adr/) and [`docs/theming.md`](docs/theming.md).

| Doc                                                                                                                                              | Covers                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| [PRD-01 — Community-Score / CRS](https://github.com/orphic-inc/stellar-api/blob/main/docs/prd/01-Community-Score.md)                             | reputation model the UI surfaces                         |
| [PRD-03 — Stylesheet themes & scoring](https://github.com/orphic-inc/stellar-api/blob/main/docs/prd/03-stylesheet-themes-and-scoring.md)         | theming feature (StylesheetInjector, author stylesheets) |
| [ADR-0003 — Stylesheet injection isolation](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0003-stylesheet-injection-isolation.md) | the global-CSS-reset / sandbox the injector must honor   |
| [AGENTS.md](AGENTS.md) · [CONTRIBUTING.md](CONTRIBUTING.md)                                                                                      | dev/agent guide, contribution workflow                   |

## Tech Stack

- **Framework**: React 18
- **State Management**: Redux Toolkit (with RTK Query)
- **Routing**: React Router v6
- **Styling**: TailwindCSS v4
- **Bundler**: Webpack

## Quick Start

See the [stellar-compose](https://github.com/orphic-inc/stellar-compose) repository for the fastest way to spin up a full instance of Stellar (API, UI, and Database) using Docker.

## Local Development Setup

If you prefer to run the UI directly on your local machine for development:

### 1. Prerequisites

- **Node.js 22** (see `.nvmrc` / the `engines` field in `package.json`) — `nvm use` picks it up.
- The [stellar-api](https://github.com/orphic-inc/stellar-api) backend **running locally** — the UI is a pure client; every data call goes to the API. The fastest full stack is [stellar-compose](https://github.com/orphic-inc/stellar-compose).

### 2. Installation

```bash
git clone https://github.com/orphic-inc/stellar-ui.git
cd stellar-ui
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` (webpack loads `.env`, then `.env.local` as an override). All variables have working defaults for a standard local setup:

| Variable          | Description                                  | Default                 |
| ----------------- | -------------------------------------------- | ----------------------- |
| `STELLAR_API_URL` | Where the dev server proxies `/api` requests | `http://localhost:8080` |
| `SENTRY_DSN`      | Error reporting — leave blank to disable     | _(blank)_               |

The Playwright e2e vars (`API_URL`, `BASE_URL`, `TEST_*`) are documented inline in `.env.example`.

> **The dev server proxies only `/api`.** `npm start` serves the SPA on `:9000` and proxies **only** requests under `/api` to `STELLAR_API_URL` (`:8080`); everything else falls through to `index.html` (SPA routing). So if your API calls 404 or hit CORS, the usual cause is the API not running on `:8080` — not a UI bug. Static `/stylesheets` are served by the dev server directly.

### 4. Running the UI

Start the development server (Webpack, with hot-module replacement) on `http://localhost:9000`:

```bash
npm start
```

Alternatively, simulate a production build with `npm run build`.

## OpenAPI Synchronization

Stellar uses an OpenAPI contract to keep types in sync between the frontend and backend. There are two commands — use the right one:

- **`npm run api:sync`** — copies the **fresh** `openapi.json` from the sibling `../stellar-api` checkout into `src/types/openapi.json`, then regenerates `src/types/api.ts`. Use this when the API contract has actually changed.
- **`npm run api:generate`** — regenerates `src/types/api.ts` from the **already-vendored** `src/types/openapi.json` only. It does **not** pull anything from stellar-api.

```bash
# API contract changed → pull it in and regenerate (stellar-api must be a sibling: ../stellar-api)
npm run api:sync
npx tsc --noEmit          # verify no type regressions
```

Commit the regenerated `src/types/api.ts` (and `src/types/openapi.json` when it changed). The vendored contract and its CI freshness gate are stellar-ui ADR-0002/0004.

## Testing

Run the test suite:

```bash
npm run test
```

To run TypeScript typechecking without emitting files:

```bash
npm run typecheck
```

### End-to-end tests

The Playwright end-to-end suite lives in `e2e/` and runs against a running app at `BASE_URL` (default `http://localhost:9000`):

```bash
npm run test:e2e
```

After a run, open the HTML report:

```bash
npm run test:e2e:report
```
