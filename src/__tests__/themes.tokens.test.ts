/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

/*
 * Theme Role Token contract guard (ADR-0005 / docs/theming.md).
 *
 * A token-based theme re-skins the app ONLY by redefining the --st-* primitive
 * Role Tokens — migrated surfaces read them through their data-st hooks. This
 * test pins the primitive set and asserts every token-based theme declares all
 * of it, so a new/edited theme can't silently regress to the legacy approach of
 * overriding Tailwind `.bg-gray-*` utilities (which stops skinning surfaces as
 * they migrate onto the contract — the bug that motivated this test).
 *
 * NOT listed here on purpose: `sublime` (the baseline — skins by omission, the
 * bundled Tailwind IS Sublime) and `proton`/`postmod` (still on the legacy
 * override approach, pending their own token pass — see the theming handoff).
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

const TOKEN_BASED_THEMES = ['layer-cake', 'kuro', 'anorex'];

const declaredTokens = (theme: string): Set<string> => {
  const css = readFileSync(
    join(__dirname, '..', 'stylesheets', theme, 'style.css'),
    'utf8'
  );
  // Match declarations `--st-foo:` only — a `var(--st-foo)` reference has no
  // trailing colon, so it isn't counted as "declared".
  const declared = new Set<string>();
  for (const m of css.matchAll(/(--st-[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
  return declared;
};

describe('theme Role Token contract', () => {
  it.each(TOKEN_BASED_THEMES)(
    '%s declares every primitive --st-* token',
    (theme) => {
      const declared = declaredTokens(theme);
      const missing = PRIMITIVE_TOKENS.filter((t) => !declared.has(t));
      expect(missing).toEqual([]);
    }
  );
});
