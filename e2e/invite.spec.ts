import { test, expect } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

// ─── P-09: Invite page — invite tree above the invite form (#74) ─────────────

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-09: top-right Invite link opens the invite page with the tree above the form', async ({
    page
  }) => {
    await page.goto('/private/');

    // The "Invite (N)" link lives in the top-right user menu.
    await page.getByRole('link', { name: /^invite \(/i }).click();
    await page.waitForURL('**/private/invite**');

    // The invite tree renders above the invite form.
    const treeHeading = page.getByRole('heading', { name: /^invite tree$/i });
    await expect(treeHeading).toBeVisible();

    // The tree resolved (either a populated summary or the empty state).
    await expect(
      page.getByText('Members').or(page.getByText('No invitees.'))
    ).toBeVisible();

    // The invite form is present…
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const submit = page.getByRole('button', { name: /^invite$/i });
    await expect(submit).toBeVisible();

    // …and the tree sits above it on the page.
    const treeBox = await treeHeading.boundingBox();
    const formBox = await emailInput.boundingBox();
    expect(treeBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    expect(treeBox!.y).toBeLessThan(formBox!.y);
  });
});
