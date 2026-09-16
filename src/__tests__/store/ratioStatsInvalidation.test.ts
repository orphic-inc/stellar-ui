import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { profileApi } from '../../store/services/profileApi';
import { downloadApi } from '../../store/services/downloadApi';
import { authApi } from '../../store/services/authApi';

/**
 * A download moves the member's ratio, and ADR-0044 puts `OK -> WATCH` after a
 * download and only after a download — so the ratio policy notice on the
 * member's own profile (ui#334) reads data the download itself invalidates.
 * `getMyRatioStats` provides 'Profile'; before this the download mutations
 * invalidated only 'Contribution' and 'Download', leaving the notice on the
 * pre-download cache.
 *
 * Asserted by watching the refetch happen, since the tag list is not readable
 * off a built endpoint (the `inviteSession` spec does the same).
 */
const fetchMock = jest.fn();

const readsOf = (pathname: string) => () =>
  fetchMock.mock.calls
    .map((call) => call[0] as Request)
    .filter((req) => new URL(req.url, 'http://localhost').pathname === pathname)
    .length;

const ratioReads = readsOf('/api/profile/me/ratio');
const sessionReads = readsOf('/api/auth');

beforeAll(() => {
  ensureRequestPolyfill();
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    writable: true
  });
});

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((request: Request) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname === '/api/auth')
      return Promise.resolve(
        makeResponse({
          body: {
            id: 7,
            username: 'kai',
            canDownload: true,
            ratioPolicy: {
              status: 'WATCH',
              watchExpiresAt: null,
              disabledCause: null
            },
            userRank: { name: 'User', level: 100, color: '', permissions: {} }
          }
        })
      );
    if (pathname === '/api/profile/me/ratio')
      return Promise.resolve(
        makeResponse({
          body: {
            ratio: 0.42,
            requiredRatio: 0.6,
            meetsRequirement: false,
            bracket: { label: '5-10 GiB', maxRequired: 0, minRequired: 0 },
            contributed: '1000',
            consumed: '2000',
            eligibleContributionBytes: '1000',
            contributionCoverage: 1,
            policy: {
              status: 'WATCH',
              watchStartedAt: null,
              watchExpiresAt: null,
              downloadDisabledAt: null,
              disabledCause: null,
              lastEvaluatedAt: new Date().toISOString()
            }
          }
        })
      );
    return Promise.resolve(makeResponse({ body: { ok: true } }));
  });
});

describe('a download refetches the ratio stats behind the policy notice', () => {
  it.each([
    [
      'a grant',
      (store: ReturnType<typeof createTestStore>) =>
        store.dispatch(
          downloadApi.endpoints.grantAccess.initiate({ contributionId: 1 })
        )
    ],
    [
      'a reversal',
      (store: ReturnType<typeof createTestStore>) =>
        store.dispatch(
          downloadApi.endpoints.reverseGrant.initiate({ grantId: 1 })
        )
    ]
  ])('refetches /profile/me/ratio after %s', async (_name, run) => {
    const store = createTestStore();
    await store.dispatch(profileApi.endpoints.getMyRatioStats.initiate());
    expect(ratioReads()).toBe(1);

    await run(store);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ratioReads()).toBe(2);
  });
});

/**
 * The session carries the same policy state (stellar-api#659) and feeds the
 * site-wide banner (ui#345), so a download has to invalidate 'Auth' as well.
 *
 * This closes only the member's own actions. The daily sweep and a staff
 * override move the state with nothing to invalidate on, and the api evaluates
 * the policy AFTER the grant responds — so the poll in `PrivateLayout`, not
 * this, is what makes the banner eventually right.
 */
describe('a download refetches the session behind the policy banner', () => {
  it.each([
    [
      'a grant',
      (store: ReturnType<typeof createTestStore>) =>
        store.dispatch(
          downloadApi.endpoints.grantAccess.initiate({ contributionId: 1 })
        )
    ],
    [
      'a reversal',
      (store: ReturnType<typeof createTestStore>) =>
        store.dispatch(
          downloadApi.endpoints.reverseGrant.initiate({ grantId: 1 })
        )
    ]
  ])('refetches /auth after %s', async (_name, run) => {
    const store = createTestStore();
    await store.dispatch(authApi.endpoints.getMe.initiate());
    expect(sessionReads()).toBe(1);

    await run(store);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sessionReads()).toBe(2);
  });
});

/**
 * `PrivateLayout` polls the session every 15 minutes for the banner, and
 * `getMe`'s `onQueryStarted` dispatches `setCredentials` on every fulfilment.
 * ui#345 asked whether that churns the app, and told us to measure rather than
 * assume. Measured, and the answer is yes-but-harmlessly:
 *
 *  - the auth slice DOES get a new object reference on every poll, so every
 *    `selectCurrentUser` consumer re-renders once per interval. RTK Query's
 *    structural sharing does not carry through `setCredentials`;
 *  - the CONTENT is identical, so nothing the member sees changes.
 *
 * At one re-render per 15 minutes that is not worth a deep-equality guard in
 * `setCredentials`, which would change behaviour on every login path to save
 * four renders an hour. Pinned here so a future shorter interval has to confront
 * the cost knowingly.
 */
describe('polling the session re-renders consumers but changes nothing they see', () => {
  it('gives a new reference with identical content on an unchanged poll', async () => {
    const store = createTestStore();
    await store.dispatch(authApi.endpoints.getMe.initiate());
    const first = store.getState().auth.user;

    // A poll is just another fetch of the same endpoint.
    await store.dispatch(
      authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })
    );
    expect(sessionReads()).toBe(2);

    const second = store.getState().auth.user;
    expect(second).not.toBe(first); // re-renders consumers
    expect(second).toEqual(first); // but nothing visibly changes
  });

  it('does update when the policy actually changes', async () => {
    const store = createTestStore();
    await store.dispatch(authApi.endpoints.getMe.initiate());

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        makeResponse({
          body: {
            id: 7,
            username: 'kai',
            canDownload: false,
            ratioPolicy: {
              status: 'DOWNLOAD_DISABLED',
              watchExpiresAt: null,
              disabledCause: 'RATIO'
            },
            userRank: { name: 'User', level: 100, color: '', permissions: {} }
          }
        })
      )
    );
    await store.dispatch(
      authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })
    );

    expect(store.getState().auth.user?.canDownload).toBe(false);
    expect(store.getState().auth.user?.ratioPolicy?.status).toBe(
      'DOWNLOAD_DISABLED'
    );
  });
});
