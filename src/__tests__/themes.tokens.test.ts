/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

/*
 * Theme Role Token contract guard (ADR-0005 / docs/theming.md).
 *
 * A token-based theme re-skins the app ONLY by redefining the --st-* primitive
 * Role Tokens — migrated surfaces read them through their data-st hooks. This
 * test pins the primitive set so a new/edited theme can't silently regress to
 * the legacy approach of overriding Tailwind `.bg-gray-*` utilities (which stops
 * skinning surfaces as they migrate onto the contract — the bug that motivated
 * this test).
 *
 * **Subject changed with ui#168.** This used to read `src/stylesheets/{theme}/
 * style.css` for layer-cake, kuro and anorex. Those files were bundled copies of
 * themes the api now serves canonically (stellar-api ADR-0024), and #168 deleted
 * them — so the old subject no longer exists.
 *
 * Conformance of the *delivered themes* is not lost, and is not restated here:
 * stellar-api's `stylesheetFixtures.spec.ts` asserts this same primitive list
 * against the canonical bytes, for all ten token themes rather than three.
 * Copying the CSS into a ui fixture path to keep this test literally intact
 * would have re-created exactly the cross-repo duplication #168 exists to end,
 * and the copies would go stale the moment the api edited a theme.
 *
 * What the ui owns — and what this now guards — is the *contract itself*: the
 * `@theme static` block in `src/index.scss` that every data-st hook paints from
 * (the Sublime baseline). If the primitive set drifts here, every theme's
 * contract drifts with it, and that is a ui-side failure no api guard can see.
 */

const PRIMITIVE_TOKENS = [
  '--st-backdrop',
  '--st-base',
  '--st-panel',
  '--st-raised',
  '--st-text-strong',
  '--st-text',
  '--st-text-muted',
  '--st-text-faint',
  '--st-accent',
  '--st-accent-hover',
  '--st-accent-ring',
  '--st-link',
  '--st-link-hover',
  '--st-border',
  '--st-border-subtle',
  '--st-border-strong',
  '--st-danger',
  '--st-success',
  '--st-warning',
  '--st-info',
  '--st-lossless'
] as const;

// Match declarations `--st-foo:` only — a `var(--st-foo)` reference has no
// trailing colon, so it isn't counted as "declared".
const declaredTokens = (file: string): Set<string> => {
  const css = readFileSync(join(__dirname, '..', file), 'utf8');
  const declared = new Set<string>();
  for (const m of css.matchAll(/(--st-[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
  return declared;
};

describe('theme Role Token contract', () => {
  it('the primitive list has no duplicates', () => {
    expect(new Set(PRIMITIVE_TOKENS).size).toBe(PRIMITIVE_TOKENS.length);
  });

  it('index.scss declares every primitive --st-* token', () => {
    const declared = declaredTokens('index.scss');
    const missing = PRIMITIVE_TOKENS.filter((t) => !declared.has(t));
    expect(missing).toEqual([]);
  });

  it('index.scss declares ONLY primitives — derived tokens live in global.css', () => {
    // The documented split (index.scss header): primitive colour tokens here,
    // derived (--st-lossy/--st-weight/…) and geometry in common/global.css.
    // Without this direction the block could accrete derived tokens and the
    // separation would erode silently.
    const extra = [...declaredTokens('index.scss')].filter(
      (t) => !(PRIMITIVE_TOKENS as readonly string[]).includes(t)
    );
    expect(extra).toEqual([]);
  });
});
