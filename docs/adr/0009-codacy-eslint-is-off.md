# ADR-0009: Codacy's ESLint tool is off — what its 5,749 findings actually were

**Status:** accepted (2026-08-30).
**Relates:** stellar-api [ADR-0034](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0034-eslint-9-flat-config-and-the-import-plugin-ceiling.md) (the same decision, reached first and on the same evidence), [PR #443](https://github.com/orphic-inc/stellar-api/pull/443) (the stellar-api half), [PR #257](https://github.com/orphic-inc/stellar-ui/pull/257) (where two of these artifact classes were first characterized).

## Context

Codacy reported **5,749 open issues** against this repo, all of them from ESLint — no Trivy finding, no Semgrep finding. The count had been climbing unread, and the check is not in branch protection (`test` and `build` are), so it failed without blocking anything.

None of the 5,749 is a defect. They fall into four classes, each an artifact of _how_ Codacy runs ESLint here rather than of the code.

**1. Codacy cannot read this repo's ESLint configuration.** Every Codacy pattern is prefixed `ESLint8_` — it runs **ESLint 8**, and this repo's config is `eslint.config.mjs`, flat config, which ESLint 8 cannot parse. It does not fail or warn; it falls back to its own default pattern set. Local `npm run lint` (ESLint 9.39.5) is clean, so _every_ Codacy ESLint finding is a rule this project does not enable.

**2. The `no-unsafe-*` cascade — 4,806 findings, 84% of the total.** These five type-aware rules require type information. This repo sets **no `parserOptions.project`**, so it does not enable type-aware linting at all; these are purely Codacy's defaults. Worse, Codacy's no-install analyzer cannot resolve `@reduxjs/toolkit/query/react` — already excepted in `eslint.config.mjs` under `import/no-unresolved` for exactly this reason — so every RTK Query hook result becomes `error`-typed and cascades. `.codacy.yml` also excludes `src/types/api.ts`, the generated contract types, which removes the remaining type ground.

This is the same failure stellar-api hit, with `@prisma/client` in place of RTK Query. The shape is identical: an unresolvable import turns a typed value into `error`, and every downstream access is reported unsafe.

**3. Parameter names in _type_ positions read as unused variables — the `no-unused-vars` group.** Codacy bundles an older `typescript-eslint`. `onCreate: (values: Record<string, string>) => Promise<unknown>;` reports `'values' is defined but never used`. Underscore-prefixing does not help: `'_params' is defined but never used` is reported too. TypeScript requires a name in a function type signature, so no spelling satisfies both tools.

**4. Security-family findings that invert the guard they are looking at.** All 24 `src` hits were checked individually and every one is a false positive. The representative cases:

- "Unencoded input `renderedBody` used in HTML context" (`WikiViewPage.tsx`, `ForumTopicPost.tsx`) — `renderedBody` is `DOMPurify.sanitize(…, { ALLOWED_TAGS, ALLOWED_ATTR })`, assigned four lines above the `dangerouslySetInnerHTML` that consumes it, as a documented second net over the API's server-side sanitization (#398/#402). The taint matcher cannot span the gap.
- "Unencoded return value from function `DOMPurify.sanitize` used in HTML context" and "HTML passed in to function `DOMPurify.sanitize`" — these flag the sanitizer being used correctly, on both sides.
- "Unsafe Regular Expression" on `parseSize`'s `/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/` — measured, not assumed: 3 KB of adversarial input matches in 0.08 ms and 150 KB in 1.46 ms. Linear. No catastrophic backtracking.
- "Found RegExp with non literal argument" (`rulesText.tsx`) — the argument is a module-level constant taken from a literal regex's `.source`; a fresh instance per call is deliberate, because `renderRuleText` recurses and a shared global regex would corrupt the outer scan's `lastIndex`.
- "Potential timing attack" (`rulesText.tsx`) — fires on a variable named `token`, which here is a rules-text template token like `${site_name}`, not a credential.
- The rest are `webpack.config.js` and `jest.config.js` plugin arrays read as "HTML context".

## Decision

**Codacy's ESLint tool is disabled for this repo. Trivy and Semgrep stay enabled.**

Codacy's ESLint is not a second opinion on ours; it is a worse-informed copy — an end-of-life major, without our rule set, without our plugins, without type information, and unable to resolve the two things (RTK Query, the generated contract types) that most of this codebase is typed against. Every disagreement between it and CI is resolved in CI's favour by construction.

Trivy and Semgrep report nothing here **today**, but that is not evidence they are idle: `npm audit --omit=dev` is clean, and a browser client has no server-side request-forgery surface for Semgrep's SSRF rule to find. In stellar-api the same two tools were the entire justification for keeping Codacy — Trivy caught fourteen dependency CVEs and Semgrep caught a real SSRF. They are kept here as the guard they are.

## Consequences

- The switch is a Codacy **Code patterns** console action. `.codacy.yml` can scope a tool but cannot enable or disable one, so this decision has no repo-side representation — which is why it is recorded here rather than in a config file.
- The 5,749 findings are **not** to be triaged. They disappear with the tool that produced them. Chasing them individually is the failure mode this ADR exists to stop: PR #257 went 66 → 29 → 26 issues, and the last 26 were unreachable from the code.
- With ESLint off, Codacy's "zero new issues of any severity" threshold becomes meaningful, because the remaining tools report findings worth blocking on. Making Codacy a **required** check alongside `test` and `build` is now defensible; that is a branch-protection decision this ADR does not claim to own.
- The failure mode to watch for again: a tool that reads repo configuration can lose it in a migration and keep reporting confidently against defaults. Codacy's pattern IDs carry the tool's major version (`ESLint8_*`), which is the cheapest available check that it is still reading what we think it is.
