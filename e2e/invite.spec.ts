import { test, expect } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

// ─── P-09: Invite page — invite tree above the invite form (#74) ─────────────
//
// Asserts against the fixed subtree seeded under testuser by stellar-api's
// `npm run db:seed-e2e` (e2e_alpha → e2e_charlie, e2e_bravo, e2e_delta). If
// that seed hasn't run, this test SHOULD fail — that's the point: it verifies
// the tree renders real adjacency, not just that the page loaded.

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-09: invite page renders the seeded invite tree above the form', async ({
    page
  }) => {
    await page.goto('/private/');

    // The "Invite (N)" link lives in the top-right user menu.
    await page.getByRole('link', { name: /^invite \(/i }).click();
    await page.waitForURL('**/private/invite**');

    const treeHeading = page.getByRole('heading', { name: /^invite tree$/i });
    await expect(treeHeading).toBeVisible();

    // Summary rollup rendered (not the empty state).
    await expect(page.getByText('Members')).toBeVisible();

    // Seeded direct invitee, and the nested one — the latter only renders if
    // the recursive walk works end to end (API adjacency → component nesting).
    await expect(page.getByRole('link', { name: 'e2e_alpha' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'e2e_charlie' })).toBeVisible();

    // The invite form is present…
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(page.getByRole('button', { name: /^invite$/i })).toBeVisible();

    // …and the tree sits above it on the page (the placement #74 asked for).
    const treeBox = await treeHeading.boundingBox();
    const formBox = await emailInput.boundingBox();
    expect(treeBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    expect(treeBox!.y).toBeLessThan(formBox!.y);
  });
});
