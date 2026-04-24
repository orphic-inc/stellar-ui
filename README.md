# Stellar UI

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/ddbd8663fbd640aa96f4a89770a387d6)](https://app.codacy.com/gh/orphic-inc/stellar-ui/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

This is the React-based Single Page Application (SPA) for **Stellar**, a modern, next-generation community content tracker and forum software.

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

| Variable        | Description                     | Default   |
| --------------- | ------------------------------- | --------- |
| `STELLAR_API_URL` | URL pointing to the API server  | *undefined* |

### 4. Running the UI
Start the development server with hot-module replacement (HMR):
```bash
npm start
```
Alternatively, simulate a production build with `npm run build`.

## OpenAPI Synchronization

Stellar utilizes OpenAPI to ensure type safety between the frontend and backend.
If the API schema has been updated, you can pull the latest TypeScript types into the UI automatically.

**Note**: This command assumes that the `stellar-api` directory is checked out *adjacent* to your `stellar-ui` directory.
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
