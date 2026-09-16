import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { profileApi } from '../../store/services/profileApi';
import { downloadApi } from '../../store/services/downloadApi';

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

const ratioReads = () =>
  fetchMock.mock.calls
    .map((call) => call[0] as Request)
    .filter(
      (req) =>
        new URL(req.url, 'http://localhost').pathname ===
        '/api/profile/me/ratio'
    ).length;

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
