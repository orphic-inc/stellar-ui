/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/*
 * Checkboxes and radios are the browser's own, tinted by the theme (#368,
 * ADR-0006 amendment). jsdom does not paint, so this pins the rule that makes
 * them so, and the class rot it replaced. A browser check is recorded on #368.
 *
 * The motivating failure: @tailwindcss/forms set `appearance: none` and drew
 * the checked state itself, the unlayered `field` Role erased that drawing, and
 * no checkbox on the site showed whether it was ticked.
 */

const INDEX_CSS = readFileSync(join(__dirname, '../index.css'), 'utf8');

/** The declarations of the first top-level rule with exactly this selector. */
const declarationsOf = (selector: string): Record<string, string> => {
  const start = INDEX_CSS.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no rule for ${selector}`);
  const body = INDEX_CSS.slice(
    start + selector.length + 2,
    INDEX_CSS.indexOf('}', start)
  );
  return Object.fromEntries(
    body
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [prop, ...value] = d.split(':');
        return [prop.trim(), value.join(':').trim()];
      })
  );
};

describe('native checkboxes and radios (#368)', () => {
  it('draws them natively, tinted by the theme accent', () => {
    expect(
      declarationsOf("input[type='checkbox'],\ninput[type='radio']")
    ).toEqual({
      appearance: 'auto',
      'accent-color': 'var(--st-accent)',
      // The plugin's box, fill and focus ring, which nothing themed.
      background: 'none',
      border: '0',
      padding: '0',
      'box-shadow': 'none'
    });
  });

  it('gives them the shared themed focus outline', () => {
    expect(
      declarationsOf(
        "input[type='checkbox']:focus-visible,\ninput[type='radio']:focus-visible"
      )
    ).toEqual({
      outline: '2px solid var(--st-accent-ring)',
      'outline-offset': '1px'
    });
  });

  // Unlayered is what lets it beat the plugin's layered base rules at all.
  it('sits unlayered, after the plugin it undoes', () => {
    const plugin = INDEX_CSS.indexOf('@plugin "@tailwindcss/forms"');
    const rule = INDEX_CSS.indexOf("input[type='checkbox'],");
    expect(plugin).toBeGreaterThan(-1);
    expect(rule).toBeGreaterThan(plugin);
    expect(INDEX_CSS.slice(0, rule)).not.toMatch(/@layer[^{]*\{[^}]*$/);
  });
});

// Classes that styled the plugin's drawn box. On a native control they do
// nothing, except `accent-indigo-500`, which proton's `!important` rule turns
// into a fixed blue that overrides the theme.
const DEAD_ON_NATIVE = [
  'accent-indigo-500',
  'text-indigo-500',
  'bg-gray-700',
  'border-gray-600',
  'focus:ring-indigo-500',
  'focus:ring-offset-gray-800',
  'rounded'
];

const componentFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return componentFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });

describe('checkbox and radio markup (#368)', () => {
  it('carries no class that only styled the plugin box', () => {
    const offenders = componentFiles(join(__dirname, '../components')).flatMap(
      (file) =>
        [...readFileSync(file, 'utf8').matchAll(/<input\b[\s\S]*?\/>/g)]
          .map(([tag]) => tag)
          .filter((tag) => /type="(checkbox|radio)"/.test(tag))
          .flatMap((tag) => {
            const classes = /className="([^"]*)"/.exec(tag)?.[1].split(/\s+/);
            return (classes ?? [])
              .filter((c) => DEAD_ON_NATIVE.includes(c))
              .map((c) => `${file.split('/src/')[1]}: ${c}`);
          })
    );
    expect(offenders).toEqual([]);
  });
});
