import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { authApi } from '../../store/services/authApi';
import { profileApi } from '../../store/services/profileApi';

/**
 * The header's invite count comes from the SESSION, not the profile, so a send
 * or a withdraw has to invalidate 'Auth' as well (stellar-ui#331). Asserted by
 * watching the session actually refetch, since the tag list is not readable off
 * a built endpoint.
 */
const fetchMock = jest.fn();

const sessionReads = () =>
  fetchMock.mock.calls
    .map((call) => call[0] as Request)
    .filter(
      (req) => new URL(req.url, 'http://localhost').pathname === '/api/auth'
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
    if (pathname === '/api/auth')
      return Promise.resolve(
        makeResponse({ body: { user: { id: 7, inviteCount: 3 } } })
      );
    if (pathname === '/api/profile/referral/create-invite')
      return Promise.resolve(
        makeResponse({ status: 201, body: { inviteKey: 'k', emailSent: true } })
      );
    return Promise.resolve(makeResponse({ body: { msg: 'Invite withdrawn' } }));
  });
});

describe('the invite count in the header follows a send and a withdraw', () => {
  it.each([
    [
      'a send',
      (store: ReturnType<typeof createTestStore>) =>
        store.dispatch(
          profileApi.endpoints.createInvite.initiate({ email: 'a@b.co' })
        )
    ],
    [
      'a withdraw',
      (store: ReturnType<typeof createTestStore>) =>
        store.dispatch(profileApi.endpoints.withdrawInvite.initiate(5))
    ]
  ])('refetches the session after %s', async (_name, run) => {
    const store = createTestStore();
    await store.dispatch(authApi.endpoints.getMe.initiate());
    expect(sessionReads()).toBe(1);

    await run(store);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sessionReads()).toBe(2);
  });
});
