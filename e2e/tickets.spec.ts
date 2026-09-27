/**
 * Tickets E2E — the Staff Inbox (`/inbox/staff`), which dispatches by
 * permission: staff see the Ticket Queue, members see My Support Tickets.
 *
 * P-08a  Member creates a support ticket.
 * P-08b  Ticket appears in the member's My Support Tickets with Unanswered.
 * P-08c  Another member cannot see it, in the list or at its URL.
 * P-09a  Staff sees the ticket in the Ticket Queue.
 * P-09b  Staff replies → status advances to Open.
 * P-09c  Staff resolves → status becomes Resolved.
 *
 * One serial chain following one ticket: a failure skips the rest, and a retry
 * reruns the whole chain, so the ticket each test needs always exists.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';
import { AUTH_USER, AUTH_STAFF, AUTH_OTHER_USER } from './auth-paths';

const pageAs = async (browser: Browser, storageState: string) => {
  const context = await browser.newContext({ storageState });
  return context.newPage();
};

// The status chip beside the ticket view's subject heading.
const ticketStatus = (page: Page, subject: string) =>
  page
    .getByRole('heading', { name: subject })
    .locator('..')
    .locator('[data-st="chip"]');

test.describe.serial('support tickets', () => {
  let ticketSubject: string;
  let ticketId: string;

  test('P-08a: member creates a ticket', async ({ browser }) => {
    ticketSubject = `E2E Ticket ${Date.now()}`;
    const page = await pageAs(browser, AUTH_USER);

    await page.goto('/inbox/staff/new');
    await expect(
      page.getByRole('heading', { name: /contact staff/i })
    ).toBeVisible();

    await page.locator('#ticket-subject').fill(ticketSubject);
    await page
      .locator('#ticket-body')
      .fill('This is an automated E2E test ticket. Please ignore.');
    await page.getByRole('button', { name: /submit ticket/i }).click();

    await page.waitForURL(/\/inbox\/staff\/\d+$/);
    ticketId = page.url().split('/').pop() ?? '';

    await expect(ticketStatus(page, ticketSubject)).toHaveText('Unanswered');
  });

  test('P-08b: ticket appears in My Support Tickets', async ({ browser }) => {
    const page = await pageAs(browser, AUTH_USER);

    await page.goto('/inbox/staff');
    await expect(
      page.getByRole('heading', { name: /my support tickets/i })
    ).toBeVisible();

    const row = page.getByRole('row', { name: ticketSubject });
    await expect(row.locator('[data-st="chip"]')).toHaveText('Unanswered');
  });

  test('P-08c: another member cannot see the ticket', async ({ browser }) => {
    const page = await pageAs(browser, AUTH_OTHER_USER);

    // Wait for the list itself, so the absence below is not a page still loading.
    await page.goto('/inbox/staff');
    await expect(
      page.getByRole('heading', { name: /my support tickets/i })
    ).toBeVisible();
    await expect(page.getByText(ticketSubject)).toHaveCount(0);

    await page.goto(`/inbox/staff/${ticketId}`);
    await expect(page.getByText('Ticket not found.')).toBeVisible();
    await expect(page.getByText(ticketSubject)).toHaveCount(0);
  });

  test('P-09a: staff sees the ticket in the Ticket Queue', async ({
    browser
  }) => {
    const page = await pageAs(browser, AUTH_STAFF);

    await page.goto('/inbox/staff');
    await expect(
      page.getByRole('heading', { name: /ticket queue/i })
    ).toBeVisible();

    const row = page.getByRole('row', { name: ticketSubject });
    await expect(row.locator('[data-st="chip"]')).toHaveText('Unanswered');
  });

  test('P-09b: staff replies and status advances to Open', async ({
    browser
  }) => {
    const page = await pageAs(browser, AUTH_STAFF);

    await page.goto(`/inbox/staff/${ticketId}`);
    await expect(ticketStatus(page, ticketSubject)).toHaveText('Unanswered');

    await page.locator('#ticket-reply').fill('E2E staff reply — test.');
    await page.getByRole('button', { name: /send reply/i }).click();

    await expect(ticketStatus(page, ticketSubject)).toHaveText('Open');
    await expect(page.getByText('E2E staff reply — test.')).toBeVisible();
  });

  test('P-09c: staff resolves the ticket', async ({ browser }) => {
    const page = await pageAs(browser, AUTH_STAFF);

    await page.goto(`/inbox/staff/${ticketId}`);
    await page.getByRole('button', { name: /^resolve$/i }).click();

    await expect(ticketStatus(page, ticketSubject)).toHaveText('Resolved');
    await expect(
      page.getByRole('button', { name: /^resolve$/i })
    ).not.toBeVisible();
  });
});
