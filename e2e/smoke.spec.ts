import { test, expect } from '@playwright/test';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

// ─── P-01: Login flow ────────────────────────────────────────────────────────

test('P-01: login navigates to authenticated layout', async ({ page }) => {
  const username = process.env.TEST_USER ?? 'testuser';
  const password = process.env.TEST_USER_PASSWORD ?? 'testpass';

  await page.goto('/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in/i }).click();

  await page.waitForURL('**/private/**');
  await expect(page.getByRole('link', { name: /communities/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /forums/i })).toBeVisible();
});

// ─── P-02 + P-03: Regular user perspective ───────────────────────────────────

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-02: primary nav links resolve without error', async ({ page }) => {
    await page.goto('/private/');

    const navTargets = [
      { label: /communities/i, url: '/private/communities' },
      { label: /forums/i, url: '/private/forums' },
      { label: /collages/i, url: '/private/collages' },
      { label: /requests/i, url: '/private/requests' }
    ];

    for (const { label, url } of navTargets) {
      await page.getByRole('link', { name: label }).first().click();
      await page.waitForURL(`**${url}**`);
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      await page.goto('/private/');
    }
  });

  test('P-03: staff nav absent; direct URL to staff tools redirects', async ({
    page
  }) => {
    await page.goto('/private/');

    // Staff nav link must not be visible
    await expect(
      page.getByRole('link', { name: /^staff$/i })
    ).not.toBeVisible();

    // Direct URL access redirects back to /private
    await page.goto('/private/staff/tools');
    await expect(page).toHaveURL(/\/private\/?$/);
  });
});

// ─── P-03b: Staff user perspective ───────────────────────────────────────────

test.describe('as staff user', () => {
  test.use({ storageState: AUTH_STAFF });

  test('P-03b: staff nav visible and toolbox loads', async ({ page }) => {
    await page.goto('/private/');

    const staffLink = page.getByRole('link', { name: /^staff$/i });
    await expect(staffLink).toBeVisible();

    await staffLink.click();
    await page.waitForURL('**/private/staff/tools**');
    await expect(page.getByRole('heading', { name: /toolbox/i })).toBeVisible();
  });
});
