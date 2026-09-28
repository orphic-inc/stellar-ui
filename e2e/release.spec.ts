/**
 * Release / Contribution / Download E2E
 *
 * P-06   Browse to a release and confirm contributions section renders.
 * P-07a  Add a format to the release via its [Add format] action.
 * P-07b  Report a dead/misleading link via the inline report modal.
 *
 * Requires at least one Community with at least one Release in the test
 * database. P-07b additionally requires at least one seeded contribution
 * on the discovered release.
 */
import { test, expect, type Page } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

/**
 * Browse to the first release of the first community: the fixture release a
 * fresh database gets from stellar-api's `npm run db:seed-e2e`. Each test
 * browses there itself (#396). A URL handed down from P-06 in module state was
 * lost whenever a test failed, because Playwright then replaces the worker, so
 * one failure took P-07a and P-07b down with it, and every CI retry too.
 */
// The audio formats P-07a may add, in the order it tries them.
const AUDIO_FORMATS = ['mp3', 'ogg', 'aac', 'm4a', 'wav', 'flac'];

const openFirstRelease = async (page: Page) => {
  await page.goto('/communities');

  const communityLink = page.locator('a[href*="/communities/"]').first();
  await expect(communityLink).toBeVisible({
    message: 'No communities found — seed at least one before running E2E tests'
  });
  await communityLink.click();
  await page.waitForURL('**/communities/**');

  const releaseLink = page.locator('a[href*="/releases/"]').first();
  await expect(releaseLink).toBeVisible({
    message:
      'No releases found — seed at least one release in the test community'
  });
  await releaseLink.click();
  await page.waitForURL('**/releases/**');
};

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-06: browse to a release and see contributions section', async ({
    page
  }) => {
    await openFirstRelease(page);

    // Contributions section heading is visible
    await expect(page.getByText('Contributions')).toBeVisible();

    // Either the edition stack (has contributions) or the empty state renders.
    // It checked for the old `table.m_table`, which the edition stack replaced,
    // and with isVisible(), which does not wait for the page to render.
    await expect(
      page
        .locator('[data-st="edition-stack"]')
        .or(page.getByText(/no contributions yet/i))
    ).toBeVisible();

    // The release page's contribute action (it read "Add your version" once).
    await expect(
      page.getByRole('button', { name: /add format/i })
    ).toBeVisible();
  });

  test('P-07a: add a format to a release via [Add format]', async ({
    page
  }) => {
    await openFirstRelease(page);
    await expect(page.locator('[data-st="edition-stack"]')).toBeVisible();

    // A release refuses a second copy of a format, so add one it lacks. That
    // keeps a re-run on a long-lived dev database passing, not only a fresh one.
    const present = (
      await page.locator('[data-st="edition-format"]').allTextContents()
    ).map((label) => label.split('/')[0].trim().toLowerCase());
    const fileType = AUDIO_FORMATS.find((t) => !present.includes(t));
    if (!fileType)
      throw new Error('Every audio format is already on this release');
    const downloadUrl = `https://example.com/e2e-format/${Date.now()}.${fileType}`;

    await page.getByRole('button', { name: /add format/i }).click();
    await page.waitForURL('**/releases/*/contribute');

    await page.locator('#add-file-type').selectOption(fileType);
    await page.locator('#add-download-url').fill(downloadUrl);
    await page.getByRole('button', { name: /add contribution/i }).click();

    // Back on the release, with the new format in its edition stack.
    await page.waitForURL(/\/releases\/\d+$/);
    await expect(page.getByText('Contribution added.')).toBeVisible();
    await expect(
      page.locator('[data-st="edition-format"]', {
        hasText: `${fileType.toUpperCase()} /`
      })
    ).toBeVisible();
  });

  test('P-07b: report a dead link via the inline modal', async ({ page }) => {
    await openFirstRelease(page);

    // The seeded release carries a contribution, so its absence is a failure,
    // not a skip. The old `table.m_table` check never matched the edition
    // stack, so this test had been skipping silently.
    await expect(page.locator('[data-st="edition"]').first()).toBeVisible({
      message: 'No contributions on this release — run npm run db:seed-e2e'
    });

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
