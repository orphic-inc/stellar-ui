/**
 * No image loads from another origin (#403), and the CSP that forbids it
 * (#402) breaks nothing.
 *
 * stellar-api imports every remote image into its asset store (ADR-0051), and
 * the UI draws each image from the api's resolved `*Src` field, never from
 * the raw URL a member wrote. That is what lets the CSP close `img-src` to
 * `'self'` without breaking a page.
 *
 * P-13  walks the main pages and fails on any image request that leaves this
 *       origin, after giving the member a remote avatar so something could.
 * P-14  fails on any CSP violation on the pages that draw images. The dev
 *       server emits no CSP, so it can only fail against a production build:
 *       stellar-compose runs these specs against the stack as shipped.
 */
import { test, expect, type Page } from '@playwright/test';
import { AUTH_USER } from './auth-paths';

// Unresolvable on purpose: the import fails, and a leaked request is still
// recorded even though it can never complete.
const REMOTE_AVATAR = 'https://images.invalid/e2e-avatar.png';
const REMOTE_POST_IMAGE = 'https://images.invalid/e2e-post.png';

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

/** Give the member a remote avatar, and return their id. */
const setRemoteAvatar = async (page: Page): Promise<number> => {
  const me = await page.request.get('/api/auth');
  expect(me.ok()).toBe(true);
  // GET /api/auth answers the AuthUser itself; only login wraps it in `user`.
  const { id } = (await me.json()) as { id: number };
  const set = await page.request.put('/api/profile/me', {
    data: { avatar: REMOTE_AVATAR }
  });
  expect(set.ok()).toBe(true);
  return id;
};

const clearAvatar = (page: Page) =>
  page.request.put('/api/profile/me', { data: { avatar: '' } });

/** Record every CSP violation, from before the app's first script runs. */
const watchCsp = (page: Page) =>
  page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = seen;
    document.addEventListener('securitypolicyviolation', (e) =>
      seen.push(`${e.effectiveDirective} ${e.blockedURI}`)
    );
  });

const cspViolations = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

/**
 * A forum topic whose first post holds a remote `[img]`. GET /api/forums
 * answers a bare array; the first forum that accepts the member's topic wins.
 */
const createImageTopic = async (page: Page): Promise<string> => {
  const forums = (await (await page.request.get('/api/forums')).json()) as {
    id: number;
    isTrash: boolean;
  }[];
  for (const forum of forums.filter((f) => !f.isTrash)) {
    const res = await page.request.post(`/api/forums/${forum.id}/topics`, {
      data: {
        title: 'P-14 image topic',
        body: `A remote image: [img]${REMOTE_POST_IMAGE}[/img]`
      }
    });
    if (res.status() === 201) {
      const topic = (await res.json()) as { id: number };
      return `/forums/${forum.id}/topics/${topic.id}`;
    }
  }
  throw new Error('No forum accepted a topic from the test user');
};

/** The first community, and the first release in it. */
const communityAndRelease = async (page: Page): Promise<string[]> => {
  await page.goto('/communities');
  const community = page.locator('a[href*="/communities/"]').first();
  await expect(community).toBeVisible();
  await community.click();
  await page.waitForURL('**/communities/**');
  const communityPath = new URL(page.url()).pathname;
  const release = page.locator('a[href*="/releases/"]').first();
  await expect(release).toBeVisible();
  const releasePath = await release.getAttribute('href');
  return [communityPath, releasePath!];
};

test.describe('image origin (as regular user)', () => {
  test.use({ storageState: AUTH_USER });

  test('P-13: no image on the main pages loads from another origin', async ({
    page,
    baseURL
  }) => {
    const origin = new URL(baseURL!).origin;
    const id = await setRemoteAvatar(page);
    try {
      const offOrigin = recordOffOrigin(page, origin);
      for (const path of [...PAGES, `/user/${id}`]) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
      expect(offOrigin).toEqual([]);
    } finally {
      await clearAvatar(page);
    }
  });

  test('P-14: the pages that draw images raise no CSP violation', async ({
    page
  }) => {
    const id = await setRemoteAvatar(page);
    try {
      const topic = await createImageTopic(page);
      const pages = [
        ...(await communityAndRelease(page)),
        `/user/${id}`,
        topic,
        // A form with a <select>: its chevron is a data: SVG, which img-src keeps.
        '/contribute'
      ];
      await watchCsp(page);
      const violations: string[] = [];
      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        violations.push(
          ...(await cspViolations(page)).map((v) => `${path}: ${v}`)
        );
      }
      expect(violations).toEqual([]);
    } finally {
      await clearAvatar(page);
    }
  });
});
