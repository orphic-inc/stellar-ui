// Renders the contract-drift tracking issue from check-contract-drift.mjs's
// report (#271). Split out of the workflow so the Markdown is reviewable and
// testable as code rather than as a heredoc inside YAML.
//
// Both inputs and both outputs are FILES, addressed by path. Nothing here reads
// or writes a pipe.
//
// Usage:
//   node scripts/render-drift-issue.mjs --report r.json --body body.md --title title.txt

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : (process.argv[i + 1] ?? null);
};

const required = (flag) => {
  const v = argOf(flag);
  if (!v) {
    console.error(`Missing required ${flag} <path>`);
    process.exit(1);
  }
  return resolve(process.cwd(), v);
};

const report = JSON.parse(readFileSync(required('--report'), 'utf8'));

const title = report.bodyDrift
  ? `Vendored OpenAPI contract is behind stellar-api ${report.upstreamVersion}`
  : `Contract version parity owed: stellar-api is ${report.upstreamVersion}, vendored is ${report.vendoredVersion}`;

const section = (heading, items) => {
  if (!items.length) return '';
  const shown = items.slice(0, 30).map((i) => `- \`${i}\``);
  if (items.length > 30) shown.push(`- ...and ${items.length - 30} more`);
  return `\n**${heading} (${items.length})**\n\n${shown.join('\n')}\n`;
};

const body = report.bodyDrift
  ? `The vendored \`src/types/openapi.json\` no longer matches the spec stellar-api
serves. \`src/types/api.ts\` is generated from the vendored copy, so \`npm run typecheck\`
is currently asserting agreement with a contract the API has stopped serving —
which is exactly the state that shipped three runtime bugs in [#271](https://github.com/orphic-inc/stellar-ui/issues/271).

| | |
| --- | --- |
| stellar-api serves | \`${report.upstreamVersion}\` |
| vendored here | \`${report.vendoredVersion}\` |
| checked | ${report.checkedAt} |
| source | ${report.source} |
${section('Paths stellar-api serves that are not vendored', report.pathsAdded)}${section('Paths vendored here that stellar-api no longer serves', report.pathsRemoved)}${section('Paths whose shape changed under us', report.changedPaths)}${section('Schemas added upstream', report.schemasAdded)}${section('Schemas removed upstream', report.schemasRemoved)}
## What to do

\`\`\`bash
npm run api:sync     # re-vendor from ../stellar-api, then regenerate api.ts
npm run typecheck    # the errors this surfaces ARE the drift
\`\`\`

Type errors here are the finding, not an obstacle to it. Fix them in the same
pull request as the resync, so the contract change and its consequences land
together and are reviewable as one diff.

If the contract's \`major.minor\` moved, the resync also owes a version bump per
[ADR-0004](docs/adr/0004-peer-api-contract-version-coupling.md).
`
  : `The bodies agree — every path and schema is identical — but the contract has
been released under a new version. **Nothing is broken and no resync is urgent.**

| | |
| --- | --- |
| stellar-api serves | \`${report.upstreamVersion}\` |
| vendored here | \`${report.vendoredVersion}\` |
| checked | ${report.checkedAt} |
| source | ${report.source} |

Per [ADR-0004](docs/adr/0004-peer-api-contract-version-coupling.md) the UI's
\`major.minor\` tracks the contract it ships, so a version-parity cut is owed once
the contract's minor moves. \`npm run api:sync\` followed by the version bump
settles it.
`;

const footer = `
---

<sub>Opened and maintained by the [contract drift watch](.github/workflows/contract-drift.yml)
(stellar-ui [#271](https://github.com/orphic-inc/stellar-ui/issues/271)). This
issue is reused: its body always reflects the latest run, and it closes itself
when the vendored contract catches up. Do not close it by hand while drift
stands — the next run will reopen it.</sub>

<!-- drift-fingerprint: ${report.fingerprint} -->
`;

writeFileSync(required('--body'), body + footer);
writeFileSync(required('--title'), title);
console.log(`Rendered: ${title}`);
