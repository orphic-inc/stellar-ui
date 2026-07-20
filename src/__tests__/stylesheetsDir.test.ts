/// <reference types="node" />
import { readdirSync } from 'fs';
import { join } from 'path';

/*
 * Static-theme tree guard (ui#168 / ADR-0024).
 *
 * Built-in themes are api-canonical: the api serves their CSS and asserts their
 * token conformance. `src/stylesheets/` is the vestige of the old delivery
 * mechanism and holds exactly one blocked tenant. This pins its contents as an
 * EXACT SET so a theme cannot quietly reappear on the ui side.
 *
 * Why an exact set rather than a "no new dirs" rule: stellar-api #371 warns off
 * carve-outs (`name !== 'sublime'`) because an exception list is where the next
 * stray theme hides. A whitelist is the inverse — it names the complete expected
 * contents, so an ADDITION fails loudly and a REMOVAL forces a deliberate edit
 * here. When api #343 clears and postmod migrates, this list empties and the
 * directory goes away; the failure that prompts that edit is the point.
 *
 * This guard is not cross-repo and does not pretend to be. Adding a registry row
 * in the api without touching the ui still fails silently in the other
 * direction — recorded in ADR-0024 and docs/theming.md §4.1.
 */

const STYLESHEETS_DIR = join(__dirname, '..', 'stylesheets');

// postmod is blocked on stellar-api #343 (commercial font licensing). It is the
// only permitted tenant; see docs/theming.md §4.1.
const ALLOWED = ['postmod'];

describe('src/stylesheets/ static theme tree', () => {
  it('contains exactly the allowed set — no additions, no silent removals', () => {
    expect(readdirSync(STYLESHEETS_DIR).sort()).toEqual([...ALLOWED].sort());
  });
});
