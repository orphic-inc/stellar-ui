/**
 * Release / Contribution / Download E2E
 *
 * P-06   Browse to a release and confirm contributions section renders.
 * P-07a  Submit a new contribution via the full contribute form.
 * P-07b  Report a dead/misleading link via the inline report modal.
 *
 * Requires at least one Community with at least one Release in the test
 * database. P-07b additionally requires at least one seeded contribution
 * on the discovered release.
 */
import { test, expect } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

// Release URL discovered during P-06 and reused in P-07b.
let releaseUrl: string;

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-06: browse to a release and see contributions section', async ({
    page
  }) => {
    await page.goto('/private/communities');

    // Click the first community in the list
    const communityLink = page
      .locator('a[href*="/private/communities/"]')
      .first();
    await expect(communityLink).toBeVisible({
      message:
        'No communities found — seed at least one before running E2E tests'
    });
    await communityLink.click();
    await page.waitForURL('**/private/communities/**');

    // Click the first release in the table
    const releaseLink = page.locator('a[href*="/releases/"]').first();
    await expect(releaseLink).toBeVisible({
      message:
        'No releases found — seed at least one release in the test community'
    });
    await releaseLink.click();
    await page.waitForURL('**/releases/**');

    releaseUrl = page.url();

    // Contributions section heading is visible
    await expect(page.getByText('Contributions')).toBeVisible();

    // Either the table (has contributions) or the empty-state message renders
    const hasTable = await page.locator('table.m_table').isVisible();
    const hasEmpty = await page.getByText(/no contributions yet/i).isVisible();
    expect(hasTable || hasEmpty).toBeTruthy();

    // "Add your version" button is always visible
    await expect(
      page.getByRole('button', { name: /add your version/i })
    ).toBeVisible();
  });

  test('P-07a: submit a contribution via the full contribute form', async ({
    page
  }) => {
    const albumTitle = `E2E Album ${Date.now()}`;
    const downloadUrl = `https://example.com/e2e-test/${Date.now()}.flac`;

    // Navigate via the release page's "Add your version" button
    await page.goto(releaseUrl);
    await page.getByRole('button', { name: /add your version/i }).click();
    await page.waitForURL('**/contribute**');

    // Wait for community options to load, then pick the first real option
    await expect(
      page.locator('#contribute-community option').nth(1)
    ).not.toHaveText('');
    await page.locator('#contribute-community').selectOption({ index: 1 });

    // File type: switch to flac
    await page.locator('#contribute-filetype').selectOption('flac');

    // Fill download URL
    await page.getByPlaceholder(/https:\/\/example\.com/).fill(downloadUrl);

    // Fill artist name (first collaborator row, required for Music type)
    await page.getByPlaceholder(/artist name/i).fill('E2E Test Artist');

    // Fill album title (Music type default)
    await page.locator('#contribute-album').fill(albumTitle);

    // Submit — form uses <input type="submit">
    await page.locator('input[type="submit"]').click();

    // Navigates to the contributions list on success
    await page.waitForURL('**/contribute/list**');
    await expect(page).toHaveURL(/\/private\/contribute\/list/);
  });

  test('P-07b: report a dead link via the inline modal', async ({ page }) => {
    await page.goto(releaseUrl);

    // Require at least one contribution to report
    const hasTable = await page.locator('table.m_table').isVisible();
    if (!hasTable) {
      test.skip(
        true,
        'No contributions on this release — seed at least one or run P-07a first'
      );
      return;
    }

    // Click the Report button on the first contribution row
    const reportBtn = page.getByRole('button', { name: /report/i }).first();
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // Report modal appears
    await expect(page.getByText(/report dead/i)).toBeVisible();

    // Fill the reason
    await page
      .locator('#report-reason')
      .fill('E2E dead-link test — automated.');

    // Submit
    await page.getByRole('button', { name: /submit report/i }).click();

    // Success alert appears; modal closes
    await expect(page.getByText(/report submitted/i)).toBeVisible();
    await expect(page.locator('#report-reason')).not.toBeVisible();
  });
});
