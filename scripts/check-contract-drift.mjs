// Cross-repo contract drift watch for stellar-ui (#271).
//
// ADR-0002's freshness gate regenerates `src/types/api.ts` FROM the vendored
// `src/types/openapi.json`, and `version:check` compares the manifest TO that
// same vendored copy. Both axes are internal, so the pair is self-consistent
// and blind to the axis that actually rots:
//
//   api.ts         <-> vendored openapi.json   guarded (ADR-0002)
//   manifest       <-> vendored openapi.json   guarded (ADR-0004)
//   vendored spec  <-> stellar-api             nothing checked this
//
// This script closes the third axis. It is deliberately NOT a merge gate — see
// ADR-0002's 2026-08-31 amendment. A UI pull request is never wrong because
// stellar-api moved, so drift is reported out of band by a scheduled job
// (.github/workflows/contract-drift.yml) rather than reddening unrelated work.
//
// Two drift classes are reported separately, because they cost different things:
//
//   * BODY drift — paths/schemas differ. `npm run api:sync` is owed, and it can
//     legitimately break `npm run typecheck`; that breakage is the point. This is
//     the class a version comparison cannot see: the drift that prompted #271 was
//     141 lines behind at an IDENTICAL `0.8.3` version string.
//   * VERSION drift — the bodies agree, `info.version` differs. Nothing is
//     broken, but per ADR-0004 the UI's major.minor tracks the contract it
//     ships, so a parity cut is owed once the contract minor moves.
//
// Usage:
//   node scripts/check-contract-drift.mjs                     # fetch stellar-api main
//   node scripts/check-contract-drift.mjs --local ../stellar-api/openapi.json
//   node scripts/check-contract-drift.mjs --out report.json    # also write the report
//
// The report is written to a FILE and read back by path, never piped: a second
// pipe onto a script that also reads a stream is how stellar-api #461 went red
// twice.
//
// Exit codes:
//   0  in sync
//   1  drift found (either class)
//   2  UNDETERMINED — the upstream spec could not be read or parsed. Distinct
//      from 0 on purpose: a failed fetch must never read as "in sync", and must
//      never fall back to some other source.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VENDORED = 'src/types/openapi.json';
const UPSTREAM_URL =
  process.env.UPSTREAM_SPEC_URL ??
  'https://raw.githubusercontent.com/orphic-inc/stellar-api/main/openapi.json';

const EXIT_IN_SYNC = 0;
const EXIT_DRIFT = 1;
const EXIT_UNDETERMINED = 2;

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : (process.argv[i + 1] ?? null);
};

// Deep key-sort, so a re-serialisation upstream can never read as drift.
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])])
    );
  }
  return value;
};

const stable = (value) => JSON.stringify(canonical(value));
const digest = (text) => createHash('sha256').update(text).digest('hex');

// The spec with `info.version` neutralised — the body, independent of release.
const bodyOf = (spec) => ({
  ...spec,
  info: { ...(spec.info ?? {}), version: '<version>' }
});

const keysOf = (obj) => Object.keys(obj ?? {}).sort();
const missingFrom = (a, b) => a.filter((k) => !b.includes(k));

async function loadUpstream() {
  const local = argOf('--local');
  if (local) {
    const path = resolve(process.cwd(), local);
    return { source: path, text: readFileSync(path, 'utf8') };
  }
  const res = await fetch(UPSTREAM_URL, {
    headers: { accept: 'application/json' }
  });
  if (!res.ok) {
    throw new Error(
      `GET ${UPSTREAM_URL} responded ${res.status} ${res.statusText}`
    );
  }
  return { source: UPSTREAM_URL, text: await res.text() };
}

let upstream;
try {
  const loaded = await loadUpstream();
  upstream = { ...loaded, spec: JSON.parse(loaded.text) };
} catch (err) {
  console.error(`Could not read the upstream contract: ${err.message}`);
  console.error(
    'Reporting UNDETERMINED (exit 2). This is not "in sync" — nothing was compared.'
  );
  process.exit(EXIT_UNDETERMINED);
}

const vendored = JSON.parse(readFileSync(resolve(root, VENDORED), 'utf8'));

const upstreamVersion = upstream.spec.info?.version ?? null;
const vendoredVersion = vendored.info?.version ?? null;

const upstreamBody = stable(bodyOf(upstream.spec));
const vendoredBody = stable(bodyOf(vendored));

const bodyDrift = upstreamBody !== vendoredBody;
const versionDrift = upstreamVersion !== vendoredVersion;

const upstreamPaths = keysOf(upstream.spec.paths);
const vendoredPaths = keysOf(vendored.paths);
const upstreamSchemas = keysOf(upstream.spec.components?.schemas);
const vendoredSchemas = keysOf(vendored.components?.schemas);

const changedPaths = upstreamPaths
  .filter((p) => vendoredPaths.includes(p))
  .filter((p) => stable(upstream.spec.paths[p]) !== stable(vendored.paths[p]));

const report = {
  checkedAt: new Date().toISOString(),
  source: upstream.source,
  upstreamVersion,
  vendoredVersion,
  bodyDrift,
  versionDrift,
  inSync: !bodyDrift && !versionDrift,
  pathsAdded: missingFrom(upstreamPaths, vendoredPaths),
  pathsRemoved: missingFrom(vendoredPaths, upstreamPaths),
  changedPaths,
  schemasAdded: missingFrom(upstreamSchemas, vendoredSchemas),
  schemasRemoved: missingFrom(vendoredSchemas, upstreamSchemas),
  // Identifies THIS upstream state. The workflow comments only when it moves, so
  // a drift left open for a week does not generate a week of duplicate comments.
  fingerprint: digest(`${upstreamVersion} ${upstreamBody}`).slice(0, 16)
};

const outPath = argOf('--out');
if (outPath) {
  writeFileSync(
    resolve(process.cwd(), outPath),
    `${JSON.stringify(report, null, 2)}\n`
  );
}

const list = (items, limit = 15) =>
  items
    .slice(0, limit)
    .map((i) => `  - ${i}`)
    .concat(
      items.length > limit ? [`  - ...and ${items.length - limit} more`] : []
    )
    .join('\n');

if (report.inSync) {
  console.log(
    `Vendored contract is in sync with stellar-api at ${upstreamVersion} ` +
      `(${upstreamPaths.length} paths, ${upstreamSchemas.length} schemas).`
  );
  process.exit(EXIT_IN_SYNC);
}

console.error(
  `Contract drift: vendored ${VENDORED} is ${vendoredVersion}, stellar-api ships ${upstreamVersion}.`
);

if (bodyDrift) {
  console.error('\nBODY drift — `npm run api:sync` is owed.');
  if (report.pathsAdded.length)
    console.error(
      `Paths in stellar-api, not vendored (${report.pathsAdded.length}):\n${list(report.pathsAdded)}`
    );
  if (report.pathsRemoved.length)
    console.error(
      `Paths vendored, gone upstream (${report.pathsRemoved.length}):\n${list(report.pathsRemoved)}`
    );
  if (report.changedPaths.length)
    console.error(
      `Paths whose shape changed (${report.changedPaths.length}):\n${list(report.changedPaths)}`
    );
  if (report.schemasAdded.length)
    console.error(
      `Schemas added (${report.schemasAdded.length}):\n${list(report.schemasAdded)}`
    );
  if (report.schemasRemoved.length)
    console.error(
      `Schemas removed (${report.schemasRemoved.length}):\n${list(report.schemasRemoved)}`
    );
} else {
  console.error(
    '\nVERSION-only drift — the bodies are identical. Nothing is broken; per\n' +
      'ADR-0004 a version-parity cut is owed once the contract minor moves.'
  );
}

process.exit(EXIT_DRIFT);
