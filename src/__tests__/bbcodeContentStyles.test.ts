/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

describe('BBCode rendered-content styles', () => {
  it('restores themed h2, h3, and h4 typography after Preflight', () => {
    const css = readFileSync(join(__dirname, '..', 'index.css'), 'utf8');

    expect(css).toMatch(
      /\.bbcode-content h2,\s*\.bbcode-content h3,\s*\.bbcode-content h4\s*{[^}]*color:\s*var\(--st-text-strong\);[^}]*font-weight:\s*600;/s
    );
    expect(css).toMatch(/\.bbcode-content h2\s*{[^}]*font-size:\s*1\.5rem;/s);
    expect(css).toMatch(/\.bbcode-content h3\s*{[^}]*font-size:\s*1\.25rem;/s);
    expect(css).toMatch(/\.bbcode-content h4\s*{[^}]*font-size:\s*1\.125rem;/s);
  });

  // Until ui#311 the app styled NO bbcode-* class at all: [hide] and [mature]
  // fell back to the browser's bare <details>, and the gated-content notice the
  // API emits had no rule to find. These are the three the API can emit.
  it('styles the disclosure and gated-notice classes the API emits', () => {
    const css = readFileSync(join(__dirname, '..', 'index.css'), 'utf8');

    expect(css).toMatch(/\.bbcode-content details\.bbcode-hide/);
    expect(css).toMatch(/\.bbcode-content details\.bbcode-mature\b/);
    expect(css).toMatch(/\.bbcode-content div\.bbcode-mature-hidden\s*{/);
    // The anchor BBCodeContent injects into the notice (ui#311).
    expect(css).toMatch(/\.bbcode-content a\.bbcode-mature-settings\s*{/);
  });

  it('themes them with tokens, so a user stylesheet repaints them (ADR-0003)', () => {
    const css = readFileSync(join(__dirname, '..', 'index.css'), 'utf8');
    const notice = css.match(
      /\.bbcode-content div\.bbcode-mature-hidden\s*{[^}]*}/s
    )?.[0];

    expect(notice).toBeDefined();
    expect(notice).toMatch(/var\(--st-/);
    // The older rules above hard-code rgb(); new ones must not follow suit.
    expect(notice).not.toMatch(/rgb\(/);
  });
});
