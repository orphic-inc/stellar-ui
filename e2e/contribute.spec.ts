/**
 * Contribution form E2E — legacy-parity fields + accessibility
 *
 * P-08a  Submit a Music release exercising the new legacy-parity fields
 *        (release type, record label, catalogue №, bitrate, media, edition,
 *        scene/log/cue) via the standalone contribute form.
 * P-08b  Axe accessibility scan of the contribute form (WCAG 2.0/2.1 A & AA).
 * P-08c  Keyboard operability: add/remove artist rows move focus correctly.
 *
 * Complements release.spec.ts P-07a (basic add-to-release submission).
 * Requires a seeded community and the regular test user (see global.setup.ts).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AUTH_USER } from './auth-paths';

test.describe('contribute form (as regular user)', () => {
  test.use({ storageState: AUTH_USER });

  test.beforeEach(async ({ page }) => {
    await page.goto('/private/contribute');
    // Wait for communities to load (first real option populated).
    await expect(
      page.locator('#contribute-community option').nth(1)
    ).toBeVisible();
  });

  test('P-08a: submit a Music release with full legacy-parity metadata', async ({
    page
  }) => {
    const albumTitle = `E2E Parity Album ${Date.now()}`;
    const downloadUrl = `https://example.com/e2e-parity/${Date.now()}.flac`;

    await page.locator('#contribute-community').selectOption({ index: 1 });

    // Release identity
    await page.locator('#contribute-category').selectOption('EP');
    await page.getByPlaceholder(/artist name/i).fill('E2E Parity Artist');
    await page.locator('#contribute-album').fill(albumTitle);
    await page.locator('#contribute-label').fill('Blue Note');
    await page.locator('#contribute-catno').fill('BN-1577');

    // Edition
    await page.locator('#contribute-edition-toggle').check();
    await page.locator('#contribute-edition-title').fill('Deluxe Edition');
    await page.locator('#contribute-edition-year').fill('2015');
    await page.locator('#contribute-remaster').check();

    // File information
    await page.locator('#contribute-filetype').selectOption('flac');
    await page.locator('#contribute-bitrate').selectOption('Lossless');
    await page.locator('#contribute-media').selectOption('CD');
    await page.locator('#contribute-size').fill('512.5');
    await page.locator('#contribute-url').fill(downloadUrl);
    await page.locator('#contribute-scene').check();
    await page.locator('#contribute-haslog').check();
    await page.locator('#contribute-hascue').check();

    await page.getByRole('button', { name: /contribute release/i }).click();

    await page.waitForURL('**/contribute/list**');
    await expect(page).toHaveURL(/\/private\/contribute\/list/);
  });

  test('P-08b: contribute form has no axe accessibility violations', async ({
    page
  }) => {
    // Scan the default (Music) layout, then re-scan with the edition section
    // expanded so the conditionally-rendered fields are covered too.
    const scan = async () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

    let results = await scan();
    expect(results.violations).toEqual([]);

    await page.locator('#contribute-edition-toggle').check();
    results = await scan();
    expect(results.violations).toEqual([]);
  });

  test('P-08c: adding and removing artist rows manages focus', async ({
    page
  }) => {
    const addArtist = page.getByRole('button', { name: /add artist/i });

    // Adding a row focuses the new row's name input.
    await addArtist.click();
    const secondRow = page.getByLabel(/artist name 2/i);
    await expect(secondRow).toBeFocused();

    // The remove control is keyboard-reachable and labelled per row.
    const removeSecond = page.getByRole('button', { name: /remove artist 2/i });
    await expect(removeSecond).toBeVisible();
    await removeSecond.click();

    // Back to a single artist row.
    await expect(page.getByPlaceholder(/artist name/i)).toHaveCount(1);

    // The MusicBrainz stub is present but disabled (visual parity, no action).
    await expect(
      page.getByRole('button', { name: /find info/i })
    ).toBeDisabled();
  });
});
