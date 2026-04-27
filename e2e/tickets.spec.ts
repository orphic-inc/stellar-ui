/**
 * Tickets E2E
 *
 * P-08a  Regular user creates a support ticket.
 * P-08b  Ticket appears in user's My Tickets list with Unanswered status.
 * P-09a  Staff sees the ticket in Staff Inbox.
 * P-09b  Staff replies → ticket status advances to Open.
 * P-09c  Staff resolves → ticket status becomes Resolved.
 */
import { test, expect } from '@playwright/test';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

// Shared between describe blocks (set by P-08a, read by staff tests).
let ticketSubject: string;
let ticketId: string;

// ─── Regular user creates and views ticket ────────────────────────────────────

test.describe('as regular user', () => {
  test.use({ storageState: AUTH_USER });

  test('P-08a: create ticket via contact form', async ({ page }) => {
    ticketSubject = `E2E Ticket ${Date.now()}`;

    await page.goto('/private/tickets/new');
    await expect(
      page.getByRole('heading', { name: /contact staff/i })
    ).toBeVisible();

    await page.locator('#ticket-subject').fill(ticketSubject);
    await page
      .locator('#ticket-body')
      .fill('This is an automated E2E test ticket. Please ignore.');
    await page.getByRole('button', { name: /submit ticket/i }).click();

    // Redirected to the ticket conversation view
    await page.waitForURL(/\/private\/tickets\/\d+/);
    ticketId = page.url().split('/').pop() ?? '';

    // Status badge shows Unanswered
    await expect(page.getByText('Unanswered')).toBeVisible();
  });

  test('P-08b: ticket appears in My Tickets list', async ({ page }) => {
    await page.goto('/private/tickets/mine');

    const subjectLink = page.getByRole('link', { name: ticketSubject });
    await expect(subjectLink).toBeVisible();

    // Status badge for this ticket is Unanswered
    const row = subjectLink.locator('../..');
    await expect(row.getByText('Unanswered')).toBeVisible();
  });
});

// ─── Staff handles the ticket ─────────────────────────────────────────────────

test.describe('as staff user', () => {
  test.use({ storageState: AUTH_STAFF });

  test('P-09a: ticket appears in Staff Inbox', async ({ page }) => {
    await page.goto('/private/staff/inbox');
    await expect(page.getByRole('link', { name: ticketSubject })).toBeVisible();
  });

  test('P-09b: staff replies and status advances to Open', async ({ page }) => {
    await page.goto(`/private/staff/inbox/${ticketId}`);

    // Ticket subject should be visible in the heading
    await expect(
      page.getByRole('heading', { name: ticketSubject })
    ).toBeVisible();

    // Status is Unanswered before reply
    await expect(page.getByText('Unanswered')).toBeVisible();

    // Reply as staff
    await page.locator('#ticket-reply').fill('E2E staff reply — test.');
    await page.getByRole('button', { name: /send reply/i }).click();

    // Status badge updates to Open after staff reply
    await expect(page.getByText('Open')).toBeVisible();
    // Reply body appears in the thread
    await expect(page.getByText('E2E staff reply — test.')).toBeVisible();
  });

  test('P-09c: staff resolves ticket', async ({ page }) => {
    await page.goto(`/private/staff/inbox/${ticketId}`);

    await page.getByRole('button', { name: /^resolve$/i }).click();

    // Status badge changes to Resolved
    await expect(page.getByText('Resolved')).toBeVisible();
    // Resolve button disappears (ticket is now closed)
    await expect(
      page.getByRole('button', { name: /^resolve$/i })
    ).not.toBeVisible();
  });
});
