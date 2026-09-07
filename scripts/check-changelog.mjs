// Changelog gate for stellar-ui. Ports stellar-api's `changelog:check`
// (stellar-api #386 for the entry and preservation halves, #537 for the
// heading ratchet), scoped to the surfaces this repo actually has.
//
// WHY THIS REPO NEEDS IT. The `release` job publishes a version's CHANGELOG
// section verbatim as the GitHub Release notes, exactly as stellar-api's does,
// so anything missing or misfiled here is missing or misfiled in the published
// record permanently. Until now nothing checked that.
//
// It arrived because `[Unreleased]` had accumulated TWO `### Changed` blocks
// and a hand coalesce was owed. In stellar-api that same hand coalesce, run on
// release day over twelve scrambled blocks, misfiled eight entries at the 0.9.1
// cut. Holding the section at one heading per type is what removes the step
// where a human retypes entries under headings they are choosing on the spot.
//
// A single file rather than stellar-api's lib/CLI split, matching the three
// gates already in this directory. The pure functions are exported all the same,
// so a spec can import them without going through `main()`.
//
// Run:
//   npm run changelog:check                                    # local, computed
//   git diff --name-only origin/main...HEAD \
//     | CHANGELOG_STDIN=1 npm run changelog:check

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { isatty } from 'node:tty';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The changelog itself — the file whose presence satisfies the gate. */
export const CHANGELOG_PATH = 'CHANGELOG.md';

/**
 * Path prefixes whose modification obliges a CHANGELOG entry.
 *
 * Deliberately short, explicit, and easy to amend rather than a clever pattern.
 * Everything absent — `docs/`, other Markdown, tooling config — is exempt on the
 * grounds that it does not ship behaviour to a consumer.
 *
 * `scripts/` is here where stellar-api lists `prisma/`, and it is the one real
 * divergence from that repo. stellar-api includes `.github/workflows/` because
 * CI changes are exactly the kind that slip through unrecorded; in this repo the
 * CI logic lives in `scripts/*.mjs` and the workflow only calls it, so listing
 * the workflow alone would miss where the behaviour actually is.
 */
export const ENTRY_REQUIRED_PREFIXES = [
  'src/',
  'scripts/',
  '.github/workflows/'
];

/**
 * Heading types allowed under `[Unreleased]`.
 *
 * A closed set rather than "count whatever is there", because the `release` job
 * publishes the section verbatim: `### Fixes` is worse than a duplicate, since
 * it reads as correct and ships as a section nobody meant to publish. Open
 * counting cannot see it — a typo appears once.
 *
 * `Docs` (0.8.2, 0.6.9), `Internal` (0.8.2, 0.8.0) and `Removed` (0.5.4) earn
 * their places on this repo's own precedent. `Security` has never been used
 * here, and is included anyway because stellar-api carries it and a security
 * entry should never be the thing that trips this gate.
 *
 * `Planned` is deliberately absent: one appearance, at 0.6.9, and none since.
 * Adding a type is a one-line change here, which is the right amount of
 * friction for text that publishes verbatim.
 */
export const UNRELEASED_HEADINGS = [
  'Added',
  'Changed',
  'Fixed',
  'Security',
  'Docs',
  'Removed',
  'Internal'
];

// ---------------------------------------------------------------------------
// 1. Entry: did a change to shipping code come with a CHANGELOG entry?
// ---------------------------------------------------------------------------

const requiresEntry = (path) =>
  ENTRY_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix));

/**
 * Decide whether a set of changed files owes a CHANGELOG entry.
 *
 * An empty list is a pass, not a failure: a PR that changed nothing this gate
 * cares about owes nothing. The caller tells "not engaged" from "satisfied" via
 * `triggeringPaths`.
 */
export function checkChangelogGate(changedFiles) {
  const files = changedFiles.map((f) => f.trim()).filter((f) => f.length > 0);
  const triggeringPaths = files.filter(requiresEntry);
  const changelogTouched = files.includes(CHANGELOG_PATH);

  return {
    triggeringPaths,
    changelogTouched,
    failed: triggeringPaths.length > 0 && !changelogTouched
  };
}

// ---------------------------------------------------------------------------
// 2. Preservation: an entry that reached `[Unreleased]` must not silently leave
// ---------------------------------------------------------------------------
//
// The gate above asks whether this PR touched CHANGELOG.md. That is a different
// question from whether it kept what was already there, and stellar-api #458 is
// the gap made concrete: a branch updated via GitHub's "Update branch" button
// carried a merge commit that dropped another PR's `[Unreleased]` bullet. The
// gate passed, because the PR had added its own entry.
//
// The invariant is deliberately weaker than "[Unreleased] is append-only":
//
//   every entry in the BASE's `[Unreleased]` still appears SOMEWHERE in the
//   head's CHANGELOG.md.
//
// "Somewhere in the file" is what lets a release cut pass without an exemption:
// cutting a version renames `[Unreleased]` and opens a fresh empty one, so every
// bullet moves section while staying in the file. Coalescing duplicate headings
// passes for the same reason. Only actual disappearance fails.

/** Collapse so reflowing, re-indenting or a case change is not a deletion. */
const normalise = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * The top-level bullets under `## [Unreleased]`.
 *
 * `### ` subheadings are stepped over rather than parsed: which one a bullet
 * sits under is exactly the thing allowed to change, so grouping is not part of
 * its identity. Indented lines belong to the bullet above and move with it.
 */
export function extractUnreleasedEntries(changelog) {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => /^## \[Unreleased\]/i.test(line));
  if (start === -1) return [];

  const entries = [];
  for (const line of lines.slice(start + 1)) {
    if (/^## /.test(line)) break;
    if (!/^[-*] /.test(line)) continue;

    // Entries are written `- **Lead** — …`, and the bold lead is what names the
    // change, so identity keys on it: rewording a bullet's body is ordinary
    // editing and must not trip the gate, while removing the bullet always does.
    // The fallback keeps an unconventional entry protected rather than silently
    // unprotected.
    const bold = /^[-*] \*\*(.+?)\*\*/.exec(line);
    const identity = bold ? bold[1] : line.replace(/^[-*] /, '').slice(0, 80);
    entries.push({
      key: normalise(identity),
      excerpt: line.trim().slice(0, 120)
    });
  }
  return entries;
}

/**
 * Did the head keep every `[Unreleased]` entry the base had?
 *
 * Compares whole texts rather than a diff: CI cannot get a `base...head` range
 * (no job sets `fetch-depth`, so the checkout is shallow — the same constraint
 * that makes the file list come from the API), and two file contents are
 * something it can always fetch.
 */
export function checkUnreleasedPreserved(baseChangelog, headChangelog) {
  const entries = extractUnreleasedEntries(baseChangelog);
  const head = normalise(headChangelog);
  const removed = entries.filter((entry) => !head.includes(entry.key));

  return { removed, checked: entries.length, failed: removed.length > 0 };
}

// ---------------------------------------------------------------------------
// 3. Headings: one `### <type>` per type under `[Unreleased]`
// ---------------------------------------------------------------------------

/**
 * The `### ` headings under `## [Unreleased]`, in file order.
 *
 * Scoped to that section alone. Released sections are historical — 0.6.9 uses
 * `### Planned`, 0.8.0 and 0.8.2 use `### Internal` — and rewriting them to
 * satisfy a convention adopted afterwards would edit published Release notes to
 * no purpose.
 */
export function extractUnreleasedHeadings(changelog) {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => /^## \[Unreleased\]/i.test(line));
  if (start === -1) return [];

  const headings = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) break;
    const match = /^### +(.+?) *$/.exec(lines[i]);
    if (match) headings.push({ name: match[1], line: i + 1 });
  }
  return headings;
}

const countByName = (headings) => {
  const counts = new Map();
  for (const h of headings) counts.set(h.name, (counts.get(h.name) ?? 0) + 1);
  return counts;
};

/** Occurrences beyond the first. `0` when it appears once or not at all. */
const surplusOf = (counts, name) => Math.max((counts.get(name) ?? 0) - 1, 0);

/**
 * Did this branch make `[Unreleased]`'s headings worse than the base's?
 *
 * A shrink-only ratchet, not an absolute assertion, for the reason every other
 * guard in both repos is one: a branch must never fail for dirt it inherited.
 * The absolute form would fail the open Renovate PRs the moment the section is
 * tidied, over a file none of them touches.
 *
 * Compared PER TYPE rather than on a total, so adding a second `### Fixed` while
 * dropping a spare `### Changed` still fails — the totals net out, the defect
 * does not.
 *
 * The base is the MERGE BASE in both callers, so "the base" means the state this
 * branch actually started from, not a moving `main`.
 */
export function checkUnreleasedHeadings(baseChangelog, headChangelog) {
  const baseHeadings = extractUnreleasedHeadings(baseChangelog);
  const headHeadings = extractUnreleasedHeadings(headChangelog);
  const baseCounts = countByName(baseHeadings);
  const headCounts = countByName(headHeadings);

  const worsened = [];
  for (const [name, count] of headCounts) {
    const headSurplus = Math.max(count - 1, 0);
    const baseSurplus = surplusOf(baseCounts, name);
    if (headSurplus > baseSurplus) {
      worsened.push({
        name,
        baseSurplus,
        headSurplus,
        lines: headHeadings.filter((h) => h.name === name).map((h) => h.line)
      });
    }
  }

  // An unrecognised name the base already carried is inherited, and failing on
  // it would blame the wrong branch — same reasoning as the surplus ratchet.
  const known = new Set(UNRELEASED_HEADINGS);
  const introduced = headHeadings.filter(
    (h) => !known.has(h.name) && !baseCounts.has(h.name)
  );

  return {
    worsened,
    introduced,
    headHeadings,
    // Distinct from `worsened`, and the caller needs both: the ratchet passes on
    // inherited surplus, so a run can succeed with this non-empty — and
    // reporting that as "one per type" would announce a property never
    // established.
    surplus: [...headCounts]
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count })),
    failed: worsened.length > 0 || introduced.length > 0
  };
}

// ---------------------------------------------------------------------------
// I/O: gather the inputs, run the three checks, report
// ---------------------------------------------------------------------------
//
// Two input paths, and the CALLER SAYS which one it is rather than the script
// inferring it from the state of fd 0:
//
//   - CI sets `CHANGELOG_STDIN=1` and pipes the list in. It comes from the
//     GitHub API rather than git, because no job in publish.yml sets
//     `fetch-depth` — the runner's checkout is shallow, so `base...head` is not
//     resolvable there.
//   - Locally, with neither set, it diffs against origin/main so an author can
//     check before pushing. fd 0 is never touched on this path.
//
// THE SWITCH IS NOT CEREMONY, and the hazards below are stellar-api's, learned
// twice over on a script that passed full local verification each time.
//
//   1. Inferring from fd 0 cannot work. `readFileSync(0)` blocks until EOF, and
//      "nothing is on stdin" is indistinguishable from "the writer has not
//      written yet" until the writer closes. A caller inheriting an open stdin
//      it never writes to hangs forever; one such invocation sat blocked for
//      fifteen hours.
//
//   2. argv does not survive npm reliably. `npm run x --silent -- --stdin`
//      forwards the flag under npm 10 and drops it under npm 11, and CI runs
//      Node 24 (npm 11). Hence the env var: set by the shell before npm.
//
//   3. Touching `process.stdin` poisons the very read it was guarding. The
//      getter CONSTRUCTS the stream and puts fd 0 into non-blocking mode, after
//      which `readFileSync(0)` throws EAGAIN whenever the pipe has no data
//      buffered yet. `isatty(0)` answers the same question as a bare syscall,
//      without creating a stream. Do not reintroduce `process.stdin` here.
//
// The corollary, from (3): A FAILED READ MUST NEVER FALL BACK TO A DIFFERENT
// INPUT MODE. When it did, the gate reported a confident verdict about the
// working tree while the caller was asking about a piped list — which run
// locally simply passed, silently measuring the wrong files.

const fail = (message) => {
  console.error(message);
  process.exit(2);
};

/** Everything on stdin, read to EOF. Only ever called in stdin mode. */
const readStdin = () => {
  // `isatty(0)`, never `process.stdin.isTTY` — see hazard (3) above.
  if (isatty(0)) {
    fail(
      'stdin mode was requested but stdin is a terminal, so there is nothing to read.\n' +
        'Pipe a file list in, or drop the switch to compute it from the working tree:\n' +
        '  git diff --name-only origin/main...HEAD | CHANGELOG_STDIN=1 npm run changelog:check\n' +
        '  npm run changelog:check'
    );
  }
  try {
    return readFileSync(0, 'utf8');
  } catch (err) {
    fail(
      `stdin mode was requested but reading stdin failed (${err.code ?? 'unknown'}).\n` +
        'Not falling back to the working tree: the caller asked about a piped\n' +
        'file list, and answering about different files would be worse than failing.'
    );
  }
};

const git = (args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  });

/**
 * Local fallback: everything this branch would bring to main.
 *
 * Three sources, unioned, because any one alone lies to the author at exactly
 * the moment they would run this. Committed-only misses work still in the
 * working tree; tracked-only misses new files, which is the common case when
 * adding a module.
 */
const readGitChanges = () => {
  try {
    return [
      git(['diff', '--name-only', 'origin/main...HEAD']), // committed here
      git(['diff', '--name-only', 'HEAD']), // staged + unstaged
      git(['ls-files', '--others', '--exclude-standard']) // untracked
    ].join('\n');
  } catch {
    return fail(
      'Could not determine changed files: reading the working tree failed.\n' +
        'Pipe a file list in instead:\n' +
        '  git diff --name-only origin/main...HEAD | CHANGELOG_STDIN=1 npm run changelog:check'
    );
  }
};

/**
 * The base branch's CHANGELOG.md, for the preservation and heading checks.
 *
 * Same discipline as the file list: the caller states where this comes from, and
 * a stated source is honoured or the run fails. A file path rather than a second
 * pipe because there is only one fd 0.
 */
const readBaseChangelog = (useStdin) => {
  const fromFile = process.env.CHANGELOG_BASE_FILE;
  if (fromFile) {
    try {
      return readFileSync(resolve(root, fromFile), 'utf8');
    } catch (err) {
      return fail(
        `CHANGELOG_BASE_FILE is set to ${fromFile} but reading it failed (${err.code ?? 'unknown'}).\n` +
          'Not skipping the preservation check: it is the whole point of this run,\n' +
          'and a check that quietly does not run is worse than one that fails.'
      );
    }
  }

  if (useStdin) {
    return fail(
      'stdin mode was requested but CHANGELOG_BASE_FILE is unset, so the base\n' +
        `${CHANGELOG_PATH} cannot be read and entry preservation cannot be checked.\n` +
        'Fetch the base file and point the variable at it:\n' +
        '  gh api "repos/$REPO/contents/CHANGELOG.md?ref=$BASE_SHA" \\\n' +
        '    -H \'Accept: application/vnd.github.raw\' > "$RUNNER_TEMP/changelog-base.md"'
    );
  }

  try {
    // The MERGE BASE, not `origin/main` itself. Entries added to main after this
    // branch diverged were never on the branch, so their absence is not a
    // deletion — comparing against the tip would fail every branch that has not
    // just been rebased. An "Update branch" merge commit still gets caught,
    // because it makes main an ancestor of the head, so the merge base IS the
    // tip and a dropped entry is unambiguously a deletion.
    const mergeBase = git(['merge-base', 'origin/main', 'HEAD']).trim();
    return git(['show', `${mergeBase}:${CHANGELOG_PATH}`]);
  } catch {
    return fail(
      `Could not read ${CHANGELOG_PATH} at the merge base with origin/main, so\n` +
        'entry preservation cannot be checked. Fetch first: git fetch origin main'
    );
  }
};

const reportMissingEntry = (result) => {
  const shown = result.triggeringPaths.slice(0, 10);
  console.error(
    `This change touches shipping code but does not update ${CHANGELOG_PATH}:`
  );
  for (const path of shown) console.error(`  ✗ ${path}`);
  if (result.triggeringPaths.length > shown.length) {
    console.error(
      `  … and ${result.triggeringPaths.length - shown.length} more`
    );
  }
  console.error(
    '\nAdd an entry under [Unreleased]. The release job publishes that section verbatim as\n' +
      'the GitHub Release notes, so anything missing here is missing there permanently.\n\n' +
      'If this genuinely warrants no entry, apply the `no-changelog` label to the PR.\n' +
      `Paths that oblige an entry: ${ENTRY_REQUIRED_PREFIXES.join(', ')}`
  );
};

const reportRemovedEntries = (preserved) => {
  console.error(
    `${preserved.removed.length} of ${preserved.checked} [Unreleased] entries on the base branch\n` +
      `are missing from this branch's ${CHANGELOG_PATH}:\n`
  );
  for (const entry of preserved.removed) console.error(`  ✗ ${entry.excerpt}`);
  console.error(
    '\nThese belong to other pull requests. The release job publishes a version section\n' +
      'verbatim as the GitHub Release notes, so an entry dropped here is dropped from the\n' +
      'release record permanently.\n\n' +
      'The usual cause is a merge commit from GitHub\'s "Update branch" button, which can\n' +
      `resolve ${CHANGELOG_PATH} by discarding the other side. Rebase instead — this repo is\n` +
      'rebase-only anyway — and the entries come back:\n\n' +
      '  git rebase origin/main && git push --force-with-lease\n\n' +
      'Moving an entry to a released section is fine; the check only looks for it somewhere\n' +
      'in the file. If a removal is genuinely intended, apply the `no-changelog` label.'
  );
};

const reportHeadings = (headings) => {
  for (const dup of headings.worsened) {
    console.error(
      `[Unreleased] now has ${dup.headSurplus + 1} × '### ${dup.name}' ` +
        `(lines ${dup.lines.join(', ')}); the base had ${dup.baseSurplus + 1}.`
    );
  }
  for (const bad of headings.introduced) {
    console.error(
      `[Unreleased] introduces an unrecognised heading '### ${bad.name}' (line ${bad.line}).`
    );
  }
  console.error(
    '\nEach heading type may appear at most once under [Unreleased]. Append your entry\n' +
      "under the '### <type>' heading already there rather than opening a second one.\n\n" +
      'The release job publishes a version section verbatim as the GitHub Release notes, so a\n' +
      'section split across repeated headings ships that way, and coalescing it by hand on\n' +
      'release day is what misfiled eight entries at stellar-api 0.9.1.\n\n' +
      `Valid types: ${UNRELEASED_HEADINGS.join(', ')}. To add one, edit UNRELEASED_HEADINGS\n` +
      'in scripts/check-changelog.mjs — it is a closed set because the names publish verbatim.'
  );
};

const reportSuccess = (result, preserved, headings) => {
  console.log(
    result.triggeringPaths.length === 0
      ? 'Changelog gate not engaged (no shipping-code changes).'
      : `Changelog updated alongside ${result.triggeringPaths.length} shipping-code change(s).`
  );
  console.log(
    preserved.checked === 0
      ? 'No [Unreleased] entries on the base branch to preserve.'
      : `All ${preserved.checked} [Unreleased] entries from the base branch are still present.`
  );

  // Distinguish "clean" from "no worse than the base". The ratchet passes on
  // inherited surplus, and reporting that as one per type would be a check
  // announcing a property it never established.
  const distinctTypes = [...new Set(headings.headHeadings.map((h) => h.name))];
  if (headings.headHeadings.length === 0) {
    console.log('No [Unreleased] headings to check.');
  } else if (headings.surplus.length === 0) {
    console.log(
      `[Unreleased] headings are one per type (${distinctTypes.join(', ')}).`
    );
  } else {
    console.log(
      '[Unreleased] carries surplus headings from the base branch, not introduced here: ' +
        `${headings.surplus.map((x) => `${x.count} × ${x.name}`).join(', ')}. ` +
        'They will need coalescing before the next release cut.'
    );
  }
};

function main() {
  // Env var first; `--stdin` stays supported for anyone whose npm forwards it.
  const useStdin =
    process.env.CHANGELOG_STDIN === '1' ||
    process.argv.slice(2).includes('--stdin');

  // No `||` fallback between the two: the caller states its input path, and a
  // stated path is honoured or the run fails. An empty piped list is a
  // legitimate pass, not a cue to go read git.
  const result = checkChangelogGate(
    (useStdin ? readStdin() : readGitChanges()).split('\n')
  );
  if (result.failed) {
    reportMissingEntry(result);
    process.exit(1);
  }

  // The second and third checks are independent of the first and of each other:
  // one asks whether an entry was ADDED, one whether the existing ones SURVIVED,
  // one whether the section they live in is still SHAPED to be published. A PR
  // that correctly added its own entry is exactly the shape that drops someone
  // else's, so these run regardless of how the first went.
  const base = readBaseChangelog(useStdin);
  const head = readFileSync(resolve(root, CHANGELOG_PATH), 'utf8');

  const preserved = checkUnreleasedPreserved(base, head);
  if (preserved.failed) {
    reportRemovedEntries(preserved);
    process.exit(1);
  }

  const headings = checkUnreleasedHeadings(base, head);
  if (headings.failed) {
    reportHeadings(headings);
    process.exit(1);
  }

  reportSuccess(result, preserved, headings);
}

// Only when executed, so the pure functions above can be imported by a spec.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
