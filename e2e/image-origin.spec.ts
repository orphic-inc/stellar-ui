/**
 * No image loads from another origin (#403).
 *
 * stellar-api imports every remote image into its asset store (ADR-0051), and
 * the UI draws each image from the api's resolved `*Src` field, never from
 * the raw URL a member wrote. That is what lets the CSP close `img-src` to
 * `'self'` (#402) without breaking a page. This walks the main pages and fails
 * on any image request that leaves this origin.
 *
 * It first gives the member a remote avatar, so there is something that could
 * leak. A remote image not yet imported must render as the default instead.
 */
import { test, expect, type Page } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

// Unresolvable on purpose: the import fails, and a leaked request is still
// recorded even though it can never complete.
const REMOTE_AVATAR = 'https://images.invalid/e2e-avatar.png';

const PAGES = ['/', '/communities', '/collages', '/requests', '/forums'];

/** Every image request the page makes to an origin other than its own. */
const recordOffOrigin = (page: Page, origin: string): string[] => {
  const offOrigin: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() !== 'image') return;
    const url = new URL(request.url());
    // `data:` images make no request to any host, and the CSP keeps them.
    if (url.protocol === 'data:') return;
    if (url.origin !== origin) offOrigin.push(request.url());
  });
  return offOrigin;
};

test.describe('image origin (as regular user)', () => {
  test.use({ storageState: AUTH_USER });

  test('P-13: no image on the main pages loads from another origin', async ({
    page,
    baseURL
  }) => {
    const origin = new URL(baseURL!).origin;
    const me = await page.request.get('/api/auth');
    expect(me.ok()).toBe(true);
    const { user } = (await me.json()) as { user: { id: number } };

    const set = await page.request.put('/api/profile/me', {
      data: { avatar: REMOTE_AVATAR }
    });
    expect(set.ok()).toBe(true);

    try {
      const offOrigin = recordOffOrigin(page, origin);
      for (const path of [...PAGES, `/user/${user.id}`]) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
      expect(offOrigin).toEqual([]);
    } finally {
      await page.request.put('/api/profile/me', { data: { avatar: '' } });
    }
  });
});
