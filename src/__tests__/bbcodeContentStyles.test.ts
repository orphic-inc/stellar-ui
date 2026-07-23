/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

describe('BBCode rendered-content styles', () => {
  it('restores themed h2, h3, and h4 typography after Preflight', () => {
    const scss = readFileSync(join(__dirname, '..', 'index.scss'), 'utf8');

    expect(scss).toMatch(
      /\.bbcode-content h2,\s*\.bbcode-content h3,\s*\.bbcode-content h4\s*{[^}]*color:\s*var\(--st-text-strong\);[^}]*font-weight:\s*600;/s
    );
    expect(scss).toMatch(
      /\.bbcode-content h2\s*{[^}]*font-size:\s*1\.5rem;/s
    );
    expect(scss).toMatch(
      /\.bbcode-content h3\s*{[^}]*font-size:\s*1\.25rem;/s
    );
    expect(scss).toMatch(
      /\.bbcode-content h4\s*{[^}]*font-size:\s*1\.125rem;/s
    );
  });
});
