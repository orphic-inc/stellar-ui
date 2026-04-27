/**
 * Release / Contribution / Download E2E
 *
 * P-06   Browse to a release and confirm contributions section renders.
 * P-07a  Submit a new contribution (download link + format).
 * P-07b  Report a dead/misleading link via the inline report modal.
 *
 * Requires at least one Community and one Release in the test database.
 */
import { test, expect } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

// Community and release URLs discovered during P-06 and reused in P-07a/b.
let releaseUrl: string;
let contributionSubject: string;

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

  test('P-07a: submit a contribution and see it on the release page', async ({
    page
  }) => {
    contributionSubject = `E2E-${Date.now()}`;
    await page.goto(releaseUrl);

    await page.getByRole('button', { name: /add your version/i }).click();
    await page.waitForURL('**/contribute**');

    // Select a format (default is mp3; pick flac to be deliberate)
    await page.locator('select').selectOption('flac');

    // Fill the download URL
    await page
      .locator('input[type="url"]')
      .fill(`https://example.com/e2e-test/${contributionSubject}.flac`);

    // Optional notes field (textarea, no required attribute)
    await page
      .locator('textarea')
      .fill(`E2E contribution note ${contributionSubject}`);

    await page.locator('input[type="submit"]').click();

    // Redirected back to the release page
    await page.waitForURL(releaseUrl);

    // New contribution row is visible — format column shows "flac"
    await expect(page.getByRole('cell', { name: 'flac' })).toBeVisible();
  });

  test('P-07b: report a dead link via the inline modal', async ({ page }) => {
    await page.goto(releaseUrl);

    // Ensure there is at least one contribution to report
    await expect(page.locator('table.m_table')).toBeVisible({
      message: 'P-07b depends on P-07a adding a contribution first'
    });

    // Click the Report button on the first contribution row
    const reportBtn = page.getByRole('button', { name: /report/i }).first();
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
