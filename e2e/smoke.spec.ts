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

  test('P-03: staff roster is member-facing; toolbox stays gated', async ({
    page
  }) => {
    await page.goto('/private/');

    // The Staff roster is member-facing — the nav entry is visible to a
    // regular member and lands on the read-only roster.
    const staffLink = page.getByRole('link', { name: /^staff$/i });
    await expect(staffLink).toBeVisible();
    await staffLink.click();
    await page.waitForURL('**/private/staff');
    await expect(page.getByRole('heading', { name: /^staff$/i })).toBeVisible();

    // But the staff toolbox stays gated — a direct hit redirects out.
    await page.goto('/private/staff/tools');
    await expect(page).toHaveURL(/\/private\/?$/);
  });
});

// ─── P-03b: Staff user perspective ───────────────────────────────────────────

test.describe('as staff user', () => {
  test.use({ storageState: AUTH_STAFF });

  test('P-03b: staff nav lands on the staff roster', async ({ page }) => {
    await page.goto('/private/');

    const staffLink = page.getByRole('link', { name: /^staff$/i });
    await expect(staffLink).toBeVisible();

    await staffLink.click();
    await page.waitForURL('**/private/staff');
    await expect(page.getByRole('heading', { name: /^staff$/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /contact staff/i })
    ).toBeVisible();
  });
});
