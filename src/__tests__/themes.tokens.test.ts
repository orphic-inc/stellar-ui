/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

/*
 * Theme Role Token contract guard (ADR-0005 / docs/theming.md).
 *
 * A token-based theme re-skins the app ONLY by redefining the --st-* primitive
 * Role Tokens — migrated surfaces read them through their data-st hooks. This
 * test pins the primitive set so the contract can't silently regress to the
 * legacy approach of overriding Tailwind `.bg-gray-*` utilities, which stops
 * skinning surfaces as they migrate onto the contract (the motivating bug).
 *
 * The subject is `src/index.scss`'s `@theme static` block — the Sublime baseline
 * every data-st hook paints from — because that is the part of the contract this
 * repo owns. Built-in themes are api-canonical and are NOT checked here; the api
 * asserts this same list against their canonical bytes. See docs/theming.md §4.1
 * ("Two guards, on opposite sides of the seam") for why the split falls where it
 * does and what neither guard covers.
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
    // derived (--st-lossy/--st-weight/…) and geometry in global.css.
    // Without this direction the block could accrete derived tokens and the
    // separation would erode silently.
    const extra = [...declaredTokens('index.scss')].filter(
      (t) => !(PRIMITIVE_TOKENS as readonly string[]).includes(t)
    );
    expect(extra).toEqual([]);
  });
});
