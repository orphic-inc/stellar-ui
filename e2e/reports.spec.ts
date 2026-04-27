/**
 * Reports / Moderation E2E
 *
 * P-11a  Regular user files a report via the report form.
 * P-11b  Filed report appears in user's My Reports list.
 * P-11c  Regular user cannot access the staff reports queue.
 * P-12a  Staff sees the report in the queue.
 * P-12b  Staff claims the report.
 * P-12c  Staff resolves the report with an action.
 */
import { test, expect } from '@playwright/test';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

// Target: report a User with ID 1 (the first admin, always exists after install).
const REPORT_TARGET_TYPE = 'User';
const REPORT_TARGET_ID = '1';
const REPORT_CATEGORY = 'Other';

// Set by P-11a and read by staff tests.
let reportId: string;

// ─── Regular user files and views report ─────────────────────────────────────

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-11a: file a report via the report form', async ({ page }) => {
    await page.goto('/private/reports/new');
    await expect(
      page.getByRole('heading', { name: /file a report/i })
    ).toBeVisible();

    // Set target type
    await page.locator('#target-type').selectOption(REPORT_TARGET_TYPE);

    // Set target ID
    await page.locator('#target-id').fill(REPORT_TARGET_ID);

    // Select category
    await page.locator('#category').selectOption(REPORT_CATEGORY);

    // Fill reason
    await page
      .locator('#reason')
      .fill(
        'Automated E2E report test — please ignore and resolve as Dismissed.'
      );

    await page.getByRole('button', { name: /submit report/i }).click();

    // Redirected to My Reports
    await page.waitForURL('**/reports/mine**');
    await expect(page.getByText(/report submitted/i)).toBeVisible();
  });

  test('P-11b: report appears in My Reports list as Open', async ({ page }) => {
    await page.goto('/private/reports/mine');

    // Find the User/Other report we just filed
    const reportLink = page
      .getByRole('link', { name: REPORT_CATEGORY })
      .first();
    await expect(reportLink).toBeVisible();

    const href = await reportLink.getAttribute('href');
    reportId = href?.split('/').pop() ?? '';
    expect(reportId).toBeTruthy();

    // Status column shows Open
    const row = reportLink.locator('../..');
    await expect(row.getByText('Open')).toBeVisible();
  });

  test('P-11c: staff reports queue is not accessible to regular user', async ({
    page
  }) => {
    await page.goto('/private/staff/reports');
    // StaffGate redirects to /private
    await expect(page).toHaveURL(/\/private\/?$/);
  });
});

// ─── Staff handles the report ─────────────────────────────────────────────────

test.describe('as staff user', () => {
  test.use({ storageState: AUTH_STAFF });

  test('P-12a: report appears in staff queue', async ({ page }) => {
    await page.goto('/private/staff/reports');

    await expect(
      page.getByRole('heading', { name: /reports queue/i })
    ).toBeVisible();

    // The report link (category text) for our specific report
    await expect(
      page.locator(`a[href="/private/staff/reports/${reportId}"]`)
    ).toBeVisible();
  });

  test('P-12b: staff claims the report', async ({ page }) => {
    await page.goto(`/private/staff/reports/${reportId}`);

    await expect(
      page.getByRole('heading', { name: new RegExp(REPORT_CATEGORY) })
    ).toBeVisible();

    await page.getByRole('button', { name: /^claim$/i }).click();

    // After claiming, the Claim button is replaced by Unclaim for this staff user
    await expect(page.getByRole('button', { name: /unclaim/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^claim$/i })
    ).not.toBeVisible();
  });

  test('P-12c: staff resolves the report', async ({ page }) => {
    await page.goto(`/private/staff/reports/${reportId}`);

    // Open resolve form
    await page.getByRole('button', { name: /^resolve$/i }).click();

    await expect(
      page.getByRole('heading', { name: /resolve report/i })
    ).toBeVisible();

    // Choose action
    await page.locator('#resolution-action').selectOption('Dismissed');

    // Fill resolution notes
    await page
      .locator('#resolution-text')
      .fill('E2E automated test — dismissed.');

    await page.getByRole('button', { name: /confirm resolve/i }).click();

    // Status badge changes to Resolved
    await expect(page.getByText('Resolved')).toBeVisible();
    // Resolve button no longer shows
    await expect(
      page.getByRole('button', { name: /^resolve$/i })
    ).not.toBeVisible();
    // Resolution action appears in the resolution block
    await expect(page.getByText('Dismissed')).toBeVisible();
  });
});
