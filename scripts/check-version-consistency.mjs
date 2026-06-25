// Version-consistency gate for stellar-ui (#107). Mirrors stellar-api's
// `version:check`, scoped to the surfaces that actually exist in this repo.
//
// The manifest (package.json) is the source of truth. Every other *committed*
// version surface must equal it:
//   - package-lock.json — both the root `.version` and `packages[""].version`,
//     which npm bumps together but a hand-edit or partial bump can desync.
//   - CHANGELOG.md — the first dated section heading (`## [x.y.z] — …`); the
//     `[Unreleased]` section is skipped (no version to compare).
//
// Deliberately NOT checked:
//   - The footer's displayed version. Post-#105 it's read at runtime from the
//     platform (`GET /api/version`), so it isn't a UI-committed surface.
//   - `__APP_VERSION__`. webpack's DefinePlugin derives it from `pkg.version`
//     at build time (see webpack.config.babel.js), so it is the manifest by
//     construction and cannot drift independently.
//
// Exits non-zero on any drift, printing each offending surface.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const readVersion = (file) => JSON.parse(read(file)).version ?? null;

// First dated heading, e.g. `## [0.5.4] — 2026-06-20`. `[Unreleased]` has no
// version digits, so the digit-anchored pattern skips it.
const readChangelogTop = () => {
  const m = read('CHANGELOG.md').match(/^##\s*\[(\d+\.\d+\.\d+(?:\.\d+)?)\]/m);
  return m ? m[1] : null;
};

const lock = JSON.parse(read('package-lock.json'));
const manifest = readVersion('package.json');

const surfaces = [
  { name: 'package-lock.json (root .version)', actual: lock.version ?? null },
  {
    name: 'package-lock.json (packages[""].version)',
    actual: lock.packages?.['']?.version ?? null
  },
  { name: 'CHANGELOG.md (top dated section)', actual: readChangelogTop() }
];

const mismatches = surfaces.filter((s) => s.actual !== manifest);

if (mismatches.length > 0) {
  console.error(`Version drift detected (package.json is ${manifest}):`);
  for (const m of mismatches) {
    console.error(`  ✗ ${m.name}: expected ${manifest}, found ${m.actual}`);
  }
  console.error(
    '\nRealign every surface to the manifest version before committing.'
  );
  process.exit(1);
}

console.log(`Version surfaces consistent at ${manifest}.`);
