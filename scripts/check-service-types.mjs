// Service-layer type-source gate (#277).
//
// RTK Query endpoints declare their result type as the first type argument of
// `build.query<Result, Arg>` / `build.mutation<Result, Arg>`. That type should
// come from the generated client (`paths[...]` / `components[...]` in
// src/types/api.ts), because that is the only description of the API this repo
// can check against anything.
//
// Where it is a hand-written interface instead, the repo carries a SECOND,
// parallel description of the API's response shapes with nothing comparing it
// to the real one — the same failure as #271, one layer further out. #271's
// conclusion applies verbatim: a green typecheck against a stale type is worse
// than no typecheck, because it actively asserts correctness. Three runtime
// bugs shipped that way (empty roster, 404 on promote/demote, a save that
// silently dropped its curator list) with `tsc` clean throughout.
//
// This is the *sibling* of the API-side completeness gate (stellar-api #474):
//
//   api.ts        <-> vendored openapi.json   guarded (ADR-0002 freshness)
//   vendored spec <-> stellar-api             guarded (#278 drift watch)
//   SERVICE TYPES <-> api.ts                  guarded HERE
//
// The baseline is a RATCHET, not a mute button — the same three rules the
// stellar-api gate uses:
//
//   1. A hand-typed endpoint absent from the baseline FAILS, so new ones are
//      blocked from the day this lands, without waiting for the backlog.
//   2. A baselined endpoint that is now spec-typed FAILS as stale, so the list
//      shrinks as the migration proceeds and cannot over-suppress.
//   3. A baselined endpoint that no longer exists FAILS the same way, so
//      deleting or renaming an endpoint prunes its entry.
//
// Not flagged, deliberately:
//   - `void`, primitives and inline object literals. `void` is correct for a
//     204, and an inline `{ msg: string }` duplicates MsgResponse only trivially.
//   - Query-argument types (the SECOND type parameter). The issue is explicit
//     that payload and query-param helpers are fine; response shapes are not.
//   - devToolsApi.ts — its `/dev/*` routes are deliberately outside the OpenAPI
//     contract, so there is nothing for it to bind to. Exempted by path.
//
// Usage:
//   node scripts/check-service-types.mjs                  # gate
//   node scripts/check-service-types.mjs --inventory      # full per-file report
//   node scripts/check-service-types.mjs --write-baseline # re-baseline
//
// Exits 0 clean, 1 on a violation or a stale baseline entry.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES = resolve(root, 'src/store/services');
const BASELINE = resolve(root, 'service-types-baseline.json');

// Files with no contract to bind to.
const EXEMPT = new Set(['devToolsApi.ts']);

/** A result type that needs no checking: void, a primitive, or a trivial shape. */
const isInline = (t) =>
  /^(void|unknown|never|string|number|boolean|null|undefined)(\[\])?$/.test(
    t
  ) ||
  t.startsWith('{') ||
  t.startsWith('Blob') ||
  t.startsWith('ArrayBuffer');

/**
 * Type constructors that carry no shape of their own, so seeing one inside an
 * inline object says nothing about whether the object is hand-written.
 */
const TS_BUILTINS = new Set([
  'Array',
  'ArrayBuffer',
  'Blob',
  'Date',
  'Exclude',
  'Extract',
  'Map',
  'NonNullable',
  'Omit',
  'Partial',
  'Pick',
  'Promise',
  'Readonly',
  'Record',
  'ReturnType',
  'Set'
]);

/**
 * Named types an expression references — capitalised identifiers only, which is
 * what distinguishes a type from a field name or a primitive.
 */
const referencedTypes = (t) =>
  [...t.matchAll(/\b([A-Z][A-Za-z0-9_]*)\b/g)]
    .map((m) => m[1])
    .filter((id) => !TS_BUILTINS.has(id));

/**
 * An inline object that WRAPS a named type is not the trivial shape the inline
 * exemption was written for (#293).
 *
 * `build.query<{ items: TopReleaseItem[] }, …>` put a twelve-field hand-written
 * interface behind a brace, and the checker skipped it because the expression
 * starts with `{` — so `top10Api.ts` reported as fully bound while carrying a
 * second description of five endpoints. The exemption is for `{ msg: string }`,
 * and it still applies to that: only a reference to a NAMED type disqualifies.
 */
const wrapsNamedType = (t) => t.startsWith('{') && referencedTypes(t).length > 0;

/** Does this type expression read the generated client? */
const readsSpec = (t) => /\b(paths|components)\s*\[/.test(t);

/**
 * Where did this result type come from?
 *
 * A type imported from elsewhere (types/index.ts and friends) counts as
 * hand-written: those modules are exactly where the duplicate declarations
 * live, so assuming otherwise would suppress the finding.
 */
const classify = (type, base, localIsSpec) => {
  // Look INSIDE an inline object before exempting it: a brace is not a promise
  // that the shape is trivial (#293).
  if (wrapsNamedType(base)) {
    const named = referencedTypes(base);
    // Bound if every named type it references resolves to the generated client.
    const allSpec = named.every((id) => localIsSpec.get(id) === true);
    return allSpec ? 'spec' : 'hand';
  }
  if (isInline(base)) return 'inline';
  if (readsSpec(type)) return 'spec';
  if (localIsSpec.has(base)) return localIsSpec.get(base) ? 'spec' : 'hand';
  return 'hand';
};

/**
 * Every type this file declares locally, mapped to whether it resolves to the
 * generated client. A `type X = components[...]` alias does; an `interface`
 * never can, because it has to spell the shape out.
 */
const collectLocalTypes = (src) => {
  const localIsSpec = new Map();
  for (const m of src.matchAll(
    /^(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=\s*([\s\S]*?);\s*$/gm
  )) {
    localIsSpec.set(m[1], readsSpec(m[2]));
  }
  for (const m of src.matchAll(
    /^(?:export\s+)?interface\s+([A-Za-z0-9_]+)/gm
  )) {
    if (!localIsSpec.has(m[1])) localIsSpec.set(m[1], false);
  }
  return localIsSpec;
};

const analyseFile = (file) => {
  const src = readFileSync(resolve(SERVICES, file), 'utf8');
  const localIsSpec = collectLocalTypes(src);

  const endpoints = [];
  // `name: build.query<Result, Arg>(` — both `build` and `builder` are used.
  const re =
    /([A-Za-z0-9_]+)\s*:\s*(?:build|builder)\.(query|mutation)<\s*([^,]+?)\s*,/g;
  for (const m of src.matchAll(re)) {
    const [, name, kind, rawType] = m;
    const type = rawType.trim();
    const base = type.replace(/\[\]$/, '').trim();

    endpoints.push({
      file,
      name,
      kind,
      type,
      source: classify(type, base, localIsSpec)
    });
  }
  return endpoints;
};

const all = readdirSync(SERVICES)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
  .flatMap(analyseFile);

const keyOf = (e) => `${e.file}#${e.name}`;
const handTyped = all.filter((e) => e.source === 'hand' && !EXEMPT.has(e.file));

const readBaseline = () => {
  try {
    const raw = JSON.parse(readFileSync(BASELINE, 'utf8'));
    return raw.handTyped ?? [];
  } catch {
    // Missing means "nothing grandfathered" — every violation is reported. It
    // must never mean "skip the check".
    return [];
  }
};

const runInventory = () => {
  const byFile = new Map();
  for (const e of all) {
    const r = byFile.get(e.file) ?? { spec: 0, hand: 0, inline: 0 };
    r[e.source]++;
    byFile.set(e.file, r);
  }
  const rows = [...byFile.entries()].sort((a, b) => b[1].hand - a[1].hand);
  const T = { spec: 0, hand: 0, inline: 0 };
  console.log(
    'file'.padEnd(24) +
      'eps'.padStart(5) +
      'spec'.padStart(6) +
      'hand'.padStart(6) +
      'inline'.padStart(8)
  );
  for (const [f, r] of rows) {
    const n = r.spec + r.hand + r.inline;
    const mark = EXEMPT.has(f) ? '  (exempt)' : '';
    console.log(
      f.padEnd(24) +
        String(n).padStart(5) +
        String(r.spec).padStart(6) +
        String(r.hand).padStart(6) +
        String(r.inline).padStart(8) +
        mark
    );
    T.spec += r.spec;
    T.hand += r.hand;
    T.inline += r.inline;
  }
  const total = T.spec + T.hand + T.inline;
  console.log('-'.repeat(49));
  console.log(
    'TOTAL'.padEnd(24) +
      String(total).padStart(5) +
      String(T.spec).padStart(6) +
      String(T.hand).padStart(6) +
      String(T.inline).padStart(8)
  );
  process.exit(0);
};

const writeBaseline = () => {
  writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        $comment:
          'Grandfathered hand-typed RTK Query result types (#277). This list only ' +
          'ever SHRINKS: bind an endpoint to the generated client, then delete its ' +
          'line. A stale entry — now spec-typed, or no longer present — fails the ' +
          'check, so the list cannot rot into a permanent mute. Regenerate with ' +
          '`npm run service-types:check -- --write-baseline`.',
        generated: new Date().toISOString().slice(0, 10),
        handTyped: handTyped.map(keyOf).sort()
      },
      null,
      2
    )}\n`
  );
  console.log(
    `Wrote ${handTyped.length} entries to service-types-baseline.json`
  );
  process.exit(0);
};

const runGate = () => {
  const baseline = readBaseline();
  const baselineSet = new Set(baseline);
  const present = new Set(all.map(keyOf));
  const handSet = new Set(handTyped.map(keyOf));

  const newlyHandTyped = handTyped
    .map(keyOf)
    .filter((k) => !baselineSet.has(k))
    .sort();
  const stale = baseline
    .filter((k) => !present.has(k) || !handSet.has(k))
    .sort();

  if (newlyHandTyped.length > 0) {
    console.error(
      `${newlyHandTyped.length} endpoint(s) declare a hand-written result type:`
    );
    for (const k of newlyHandTyped) {
      const e = all.find((x) => keyOf(x) === k);
      console.error(`  - ${k}  <${e.type}>`);
    }
    console.error(
      '\nBind the result to the generated client instead — components["schemas"]["X"]',
      '\nor paths["/route"]["get"]["responses"][200]["content"]["application/json"].',
      '\nA hand-written response type is a second description of the API that nothing',
      '\ncompares to the real one (#277).\n'
    );
  }

  if (stale.length > 0) {
    console.error(`${stale.length} baseline entr(ies) are stale:`);
    for (const k of stale) {
      console.error(
        `  - ${k}${present.has(k) ? ' (now spec-typed)' : ' (no longer exists)'}`
      );
    }
    console.error(
      '\nRemove them from service-types-baseline.json. The baseline only ever shrinks.\n'
    );
  }

  const spec = all.filter((e) => e.source === 'spec').length;
  const inline = all.filter((e) => e.source === 'inline').length;
  console.log(
    `${all.length} endpoints: ${spec} spec-typed, ${handTyped.length} hand-typed ` +
      `(${baseline.length} baselined), ${inline} inline/void.`
  );

  process.exit(newlyHandTyped.length === 0 && stale.length === 0 ? 0 : 1);
};

const main = () => {
  if (process.argv.includes('--inventory')) return runInventory();
  if (process.argv.includes('--write-baseline')) return writeBaseline();
  return runGate();
};

main();
