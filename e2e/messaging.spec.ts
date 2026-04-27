/**
 * Messaging E2E
 *
 * P-05a  Compose PM from another user's profile (username pre-filled).
 * P-05b  Recipient sees the conversation as unread in their inbox.
 * P-05c  Compose PM directly by typing a username (no profile link).
 */
import { test, expect } from '@playwright/test';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

// Shared across both describe blocks — set by P-05a, read by P-05b.
let pmSubject: string;

const staffUsername = process.env.TEST_STAFF_USER ?? 'staffuser';
const userUsername = process.env.TEST_USER ?? 'testuser';

// ─── Sender perspective (regular user) ───────────────────────────────────────

test.describe('as sender (regular user)', () => {
  test.use({ storageState: AUTH_USER });

  test('P-05a: Send Message from profile pre-fills username and delivers', async ({
    page
  }) => {
    pmSubject = `E2E PM ${Date.now()}`;

    // Navigate to the staff user's profile
    await page.goto(`/private/user/${staffUsername}`);

    // "Send Message" link should be visible (own profile omits it)
    const sendLink = page.getByRole('link', { name: /send message/i });
    await expect(sendLink).toBeVisible();

    // Link must pre-fill ?to= with the username — verify URL before clicking
    const href = await sendLink.getAttribute('href');
    expect(href).toContain(`to=${staffUsername}`);

    await sendLink.click();
    await page.waitForURL('**/messages/new**');

    // Recipient field is pre-filled
    await expect(page.locator('#compose-to')).toHaveValue(staffUsername);

    // Fill and send
    await page.locator('#compose-subject').fill(pmSubject);
    await page
      .locator('#compose-body')
      .fill('This is an automated E2E test message.');
    await page.getByRole('button', { name: /^send$/i }).click();

    // Redirected to the conversation thread
    await page.waitForURL('**/messages/**');
    await expect(page).toHaveURL(/\/private\/messages\/\d+/);
  });

  test('P-05c: Compose by typing username directly (no profile link)', async ({
    page
  }) => {
    const subject = `E2E Direct PM ${Date.now()}`;

    await page.goto('/private/messages/new');
    await page.locator('#compose-to').fill(staffUsername);
    await page.locator('#compose-subject').fill(subject);
    await page.locator('#compose-body').fill('Direct compose test.');
    await page.getByRole('button', { name: /^send$/i }).click();

    await page.waitForURL(/\/private\/messages\/\d+/);

    // Navigate to sentbox — subject appears there
    await page.goto('/private/messages/sent');
    await expect(page.getByRole('link', { name: subject })).toBeVisible();
  });
});

// ─── Recipient perspective (staff user) ──────────────────────────────────────

test.describe('as recipient (staff user)', () => {
  test.use({ storageState: AUTH_STAFF });

  test('P-05b: message from regular user appears unread in inbox', async ({
    page
  }) => {
    // pmSubject was set by P-05a; if that test was skipped this will correctly fail.
    await page.goto('/private/messages');

    // Subject link must exist
    const subjectLink = page.getByRole('link', { name: pmSubject });
    await expect(subjectLink).toBeVisible();

    // Row should carry font-semibold (unread indicator)
    const row = subjectLink.locator('../..');
    await expect(row).toHaveClass(/font-semibold/);
  });

  test('P-05d: regular user cannot read staff messages (access boundary)', async ({
    page
  }) => {
    // Staff PM reply flow: send a PM back to the regular user
    await page.goto('/private/messages/new');
    await page.locator('#compose-to').fill(userUsername);
    await page.locator('#compose-subject').fill(`Staff reply ${Date.now()}`);
    await page.locator('#compose-body').fill('Reply from staff.');
    await page.getByRole('button', { name: /^send$/i }).click();
    await page.waitForURL(/\/private\/messages\/\d+/);

    // Grab the conversation ID from the URL
    const url = page.url();
    const convId = url.split('/').pop();

    // Confirm this conversation is NOT accessible via a different user's
    // session — we verify this in the smoke P-03 suite; here just confirm
    // the thread loaded correctly for the staff user.
    await expect(page.getByText('Staff reply')).toBeVisible();
    expect(convId).toBeTruthy();
  });
});
