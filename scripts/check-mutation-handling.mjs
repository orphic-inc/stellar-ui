// Mutation handling gate (#456).
//
// An RTK Query mutation's promise RESOLVES on an HTTP error, with `{ error }`.
// Only `.unwrap()` turns that into a rejection. So a component that does
// `await save(...)` and then closes its form, or wires `onClick={() => del(id)}`
// and moves on, treats a failed write as a success, and the user is told
// nothing. Community Manager's save did exactly that: a 400 closed the edit row
// as if it had saved (#456, stellar-api#892).
//
// This walks every `use*Mutation()` trigger in src/ with the TypeScript parser
// and asks of each call whether its outcome is handled. A call is handled when:
//
//   - it is `.unwrap()`ed: `await save(x).unwrap()`;
//   - a ternary of trigger calls is unwrapped whole:
//     `(id ? update(x) : create(x)).unwrap()`;
//   - its result is kept and inspected: `const r = await save(x); if ('error' in r)`;
//   - it is passed to a function, which is the local `run(write, what)` pattern
//     (NotificationFilterHitsPage) that unwraps on the caller's behalf.
//
// A trigger handed on by reference (`onMarkAllRead={markAllRead}`) is counted
// as unhandled too: whoever calls it gets the same resolving promise, and the
// call is out of this file's sight (#462). Passing it as an argument to a
// helper that unwraps (`useFriendAction(addFriend, …)`) is still handled.
//
// The baseline is a RATCHET, as in check-service-types.mjs (#277): a new
// unhandled call FAILS, and a baselined one that is now handled, or gone, FAILS
// as stale, so the list only shrinks. Entries are `file#trigger` with a count,
// so moving a line does not churn it.
//
// Usage:
//   node scripts/check-mutation-handling.mjs                  # gate
//   node scripts/check-mutation-handling.mjs --inventory      # every unhandled call
//   node scripts/check-mutation-handling.mjs --write-baseline # re-baseline
//
// Exits 0 clean, 1 on a violation or a stale baseline entry.

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'src');
const BASELINE = resolve(root, 'mutation-handling-baseline.json');

// Calls that are deliberately not handled, each with the reason (#456).
const EXEMPT = {
  // Passive read markers: the user did not act, so a failure is nothing to
  // report, and the next view retries it.
  'components/forum/ForumTopicPage.tsx#markRead':
    'marks the topic read on viewing it',
  'components/layout/NotificationCorner.tsx#markRead':
    'marks a notification read on opening it',
  'components/notificationFilters/NotificationFilterHitsPage.tsx#markRead':
    'marks a filter hit read on opening it',
  // The component renders the hook's own `error`, so a failure is shown.
  'components/contribute/RipLogChecker.tsx#checkLog':
    "renders the mutation hook's error state"
};

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory())
      return name === '__tests__' || name === 'types' ? [] : sourceFiles(p);
    return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)
      ? [p]
      : [];
  });

/** The names bound to a mutation trigger: `const [save] = useSaveMutation()`. */
const collectTriggers = (sf) => {
  const triggers = new Set();
  const visit = (n) => {
    if (
      ts.isVariableDeclaration(n) &&
      ts.isArrayBindingPattern(n.name) &&
      n.initializer &&
      ts.isCallExpression(n.initializer) &&
      /^use\w+Mutation$/.test(n.initializer.expression.getText(sf))
    ) {
      const first = n.name.elements[0];
      if (first && ts.isBindingElement(first) && ts.isIdentifier(first.name))
        triggers.add(first.name.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return triggers;
};

/** Climb through wrappers that pass the call's value through unchanged. */
const outerOf = (node) => {
  let n = node;
  while (
    ts.isParenthesizedExpression(n.parent) ||
    ts.isConditionalExpression(n.parent) ||
    ts.isAwaitExpression(n.parent)
  ) {
    // An await ends the chain for `.unwrap()`: `(await save()).unwrap` is not
    // a thing. It still counts for a kept result, below.
    if (ts.isAwaitExpression(n.parent))
      return { node: n.parent, awaited: true };
    n = n.parent;
  }
  return { node: n, awaited: false };
};

const isHandled = (call) => {
  const { node, awaited } = outerOf(call);
  const parent = node.parent;
  if (
    !awaited &&
    ts.isPropertyAccessExpression(parent) &&
    parent.name.text === 'unwrap'
  )
    return true;
  // Kept for inspection: `const r = await save()` or `r = await save()`.
  if (ts.isVariableDeclaration(parent)) return true;
  if (
    ts.isBinaryExpression(parent) &&
    parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
  )
    return true;
  // Handed to a function that handles it, as `run(write, what)` does.
  if (ts.isCallExpression(parent) && parent.arguments.includes(node))
    return true;
  return false;
};

/**
 * A trigger named somewhere other than as a call: handed on as a value.
 * Declarations, call positions, helper arguments, hook dependency arrays and
 * identifiers that are only a property, import or attribute NAME are not.
 */
// Parents under which the trigger is not handed on at all.
const NOT_PASSED = [
  ts.isBindingElement,
  ts.isArrayLiteralExpression,
  ts.isImportSpecifier,
  ts.isExportSpecifier
];
// Parents whose NAME the identifier may merely be, sharing a trigger's name.
const NAMED_BY = [
  ts.isPropertyAssignment,
  ts.isPropertyAccessExpression,
  ts.isJsxAttribute,
  ts.isMethodDeclaration
];

const isPassedByReference = (id) => {
  const p = id.parent;
  if (ts.isCallExpression(p))
    return p.expression !== id && !p.arguments.includes(id);
  if (NOT_PASSED.some((is) => is(p))) return false;
  return !(NAMED_BY.some((is) => is(p)) && p.name === id);
};

const unhandledCalls = () => {
  const calls = [];
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const triggers = collectTriggers(sf);
    if (triggers.size === 0) continue;
    const rel = relative(SRC, file);
    const visit = (n) => {
      const record = (name) => {
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
        calls.push({ key: `${rel}#${name}`, where: `src/${rel}:${line + 1}` });
      };
      if (
        ts.isCallExpression(n) &&
        ts.isIdentifier(n.expression) &&
        triggers.has(n.expression.text) &&
        !isHandled(n)
      )
        record(n.expression.text);
      else if (
        ts.isIdentifier(n) &&
        triggers.has(n.text) &&
        isPassedByReference(n)
      )
        record(n.text);
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return calls;
};

const calls = unhandledCalls();
const gated = calls.filter((c) => !(c.key in EXEMPT));
const counts = gated.reduce(
  (m, c) => m.set(c.key, (m.get(c.key) ?? 0) + 1),
  new Map()
);

const readBaseline = () => {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8')).unhandled ?? {};
  } catch {
    // Missing means "nothing grandfathered": every violation is reported. It
    // must never mean "skip the check".
    return {};
  }
};

const runInventory = () => {
  for (const c of calls)
    console.log(
      `${c.where}  ${c.key in EXEMPT ? `(exempt: ${EXEMPT[c.key]})` : ''}`
    );
  process.exit(0);
};

const writeBaseline = () => {
  const unhandled = Object.fromEntries([...counts.entries()].sort());
  writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        $comment:
          'Grandfathered unhandled RTK Query mutation calls (#456), as ' +
          'file#trigger: count. This list only ever SHRINKS: unwrap a call and ' +
          'lower its count, or delete the line at zero. A stale entry fails the ' +
          'check. Regenerate with `npm run mutations:check -- --write-baseline`.',
        unhandled
      },
      null,
      2
    )}\n`
  );
  console.log(`Wrote ${gated.length} calls to mutation-handling-baseline.json`);
  process.exit(0);
};

const runGate = () => {
  const baseline = readBaseline();
  const over = [...counts.entries()].filter(([k, n]) => n > (baseline[k] ?? 0));
  const stale = Object.entries(baseline).filter(
    ([k, n]) => (counts.get(k) ?? 0) < n
  );

  if (over.length > 0) {
    console.error('Mutation calls whose failure nobody handles:');
    for (const [k] of over)
      for (const c of gated.filter((x) => x.key === k))
        console.error(`  - ${c.where}`);
    console.error(
      '\nA mutation resolves on an HTTP error; only .unwrap() rejects. Unwrap it in a',
      "\ntry and alert with getApiErrorMessage(err) ?? '<fallback>', moving any",
      '\nsuccess step (close, clear, navigate) inside the try (#456).\n'
    );
  }

  if (stale.length > 0) {
    console.error(
      'Stale baseline entries (fewer unhandled calls than listed):'
    );
    for (const [k, n] of stale)
      console.error(`  - ${k}: listed ${n}, found ${counts.get(k) ?? 0}`);
    console.error(
      '\nLower or remove them in mutation-handling-baseline.json. The baseline only shrinks.\n'
    );
  }

  const listed = Object.values(baseline).reduce((a, b) => a + b, 0);
  console.log(
    `${gated.length} unhandled mutation calls (${listed} baselined), ` +
      `${calls.length - gated.length} exempt.`
  );
  process.exit(over.length === 0 && stale.length === 0 ? 0 : 1);
};

if (process.argv.includes('--inventory')) runInventory();
else if (process.argv.includes('--write-baseline')) writeBaseline();
else runGate();
