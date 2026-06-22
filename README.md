# Stellar UI

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ddbd8663fbd640aa96f4a89770a387d6)](https://app.codacy.com/gh/orphic-inc/stellar-ui/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

This is the React-based Single Page Application (SPA) for **Stellar**, a modern, next-generation community content tracker and forum software.

The UI is the front door to Stellar's invite-only Communities — browsing/contributing releases, forums, profiles, and **user theming** (the StylesheetInjector applies built-in or user-authored stylesheets site-wide).

## What's here

- **Communities, forums & profiles** — the member-facing surfaces over the [stellar-api](https://github.com/orphic-inc/stellar-api) backend.
- **Contributions & releases** — submit/browse releases; file-size input (see [#65](https://github.com/orphic-inc/stellar-ui/issues/65)).
- **Theming / StylesheetInjector** — `src/components/layout/StylesheetInjector.tsx` applies a selected theme or a user's profile stylesheet behind a global-CSS-reset boundary. Themes live in `src/stylesheets/<theme>/` (`kuro`, `layer-cake`, `postmod`, `proton`, `sublime`).

## Documentation

The README is the lamp-post. Product/decision specs live in **stellar-api** [`docs/`](https://github.com/orphic-inc/stellar-api/tree/main/docs); UI-specific notes live alongside the code.

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

- Node.js (LTS version)
- The [stellar-api](https://github.com/orphic-inc/stellar-api) backend running locally.

### 2. Installation

```bash
git clone https://github.com/orphic-inc/stellar-ui.git
cd stellar-ui
npm install
```

### 3. Environment Variables

You may need to provide environment variables. Typically, the default settings assume the API is running locally on port `8080`.

| Variable          | Description                    | Default     |
| ----------------- | ------------------------------ | ----------- |
| `STELLAR_API_URL` | URL pointing to the API server | _undefined_ |

### 4. Running the UI

Start the development server with hot-module replacement (HMR):

```bash
npm start
```

Alternatively, simulate a production build with `npm run build`.

## OpenAPI Synchronization

Stellar utilizes OpenAPI to ensure type safety between the frontend and backend.
If the API schema has been updated, you can pull the latest TypeScript types into the UI automatically.

**Note**: This command assumes that the `stellar-api` directory is checked out _adjacent_ to your `stellar-ui` directory.

```bash
npm run api:generate
```

This script will execute the export script in the adjacent API repo, parse the resulting `openapi.json`, and regenerate the `src/types/api.ts` file in the UI repository.

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
