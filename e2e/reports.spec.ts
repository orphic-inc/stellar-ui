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
import { test, expect, request } from '@playwright/test';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

const API_URL = process.env.API_URL ?? 'http://localhost:8080';

// Target: report a User with ID 1 (the first admin, always exists after install).
const REPORT_TARGET_TYPE = 'User';
const REPORT_TARGET_ID = '1';
const REPORT_CATEGORY = 'Other';

const REPORT_REASON =
  'Automated E2E report test — please ignore and resolve as Dismissed.';

/**
 * Files a fresh report as the regular user, through the api, and returns its
 * id. Each staff test files its own (#191): a failed test makes Playwright
 * replace the worker, so an id handed down from an earlier test in module
 * state is lost, and so is every test after the failure, including a CI retry.
 */
const fileReport = async (): Promise<number> => {
  const ctx = await request.newContext({
    baseURL: API_URL,
    storageState: AUTH_USER
  });
  const res = await ctx.post('/api/reports', {
    data: {
      targetType: REPORT_TARGET_TYPE,
      targetId: Number(REPORT_TARGET_ID),
      category: REPORT_CATEGORY,
      reason: REPORT_REASON
    }
  });
  expect(res.status()).toBe(201);
  const { id } = (await res.json()) as { id: number };
  await ctx.dispose();
  return id;
};

// ─── Regular user files and views report ─────────────────────────────────────

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-11a: file a report via the report form', async ({ page }) => {
    await page.goto('/reports/new');
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
    await page.locator('#reason').fill(REPORT_REASON);

    await page.getByRole('button', { name: /submit report/i }).click();

    // Redirected to My Reports
    await page.waitForURL('**/reports/mine**');
    await expect(page.getByText(/report submitted/i)).toBeVisible();
  });

  test('P-11b: report appears in My Reports list as Open', async ({ page }) => {
    await page.goto('/reports/mine');

    // Find the User/Other report we just filed
    const reportLink = page
      .getByRole('link', { name: REPORT_CATEGORY })
      .first();
    await expect(reportLink).toBeVisible();

    // Status column shows Open
    const row = reportLink.locator('../..');
    await expect(row.getByText('Open')).toBeVisible();
  });

  test('P-11c: staff reports queue is not accessible to regular user', async ({
    page
  }) => {
    await page.goto('/staff/reports');
    // StaffGate redirects to /
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
  });
});

// ─── Staff handles the report ─────────────────────────────────────────────────

test.describe('as staff user', () => {
  test.use({ storageState: AUTH_STAFF });

  let reportId: number;
  test.beforeEach(async () => {
    reportId = await fileReport();
  });

  test('P-12a: report appears in staff queue', async ({ page }) => {
    await page.goto('/staff/reports');

    // The heading is "Reports"; "queue" is the tab beside it, a separate
    // element, so no single accessible name spans both (#191).
    await expect(
      page.getByRole('heading', { name: 'Reports', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'queue' })).toBeVisible();

    // The report link (category text) for our specific report
    await expect(
      page.locator(`a[href="/staff/reports/${reportId}"]`)
    ).toBeVisible();
  });

  test('P-12b: staff claims the report', async ({ page }) => {
    await page.goto(`/staff/reports/${reportId}`);

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
    await page.goto(`/staff/reports/${reportId}`);

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

    // Status badge changes to Resolved. Exact: "Resolved by …" also matches the
    // bare text (#191).
    await expect(page.getByText('Resolved', { exact: true })).toBeVisible();
    // Resolve button no longer shows
    await expect(
      page.getByRole('button', { name: /^resolve$/i })
    ).not.toBeVisible();
    // Resolution action appears in the resolution block. Exact: the reason and
    // the notes both contain "dismissed" too (#191).
    await expect(page.getByText('Dismissed', { exact: true })).toBeVisible();
  });
});
