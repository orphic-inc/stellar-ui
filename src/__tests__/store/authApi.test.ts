import { setCredentials } from '../../store/slices/authSlice';
import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { authApi } from '../../store/services/authApi';

const fetchMock = jest.fn();

const getLastRequest = async () => {
  const request = fetchMock.mock.calls.at(-1)?.[0] as Request | undefined;
  if (!request) throw new Error('Expected fetch to be called');

  return {
    url: request.url,
    method: request.method,
    body: await request.text()
  };
};

beforeAll(() => {
  ensureRequestPolyfill();
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    writable: true
  });
});

beforeEach(() => {
  fetchMock.mockReset();
});

describe('authApi', () => {
  const authUser = {
    id: 7,
    username: 'kai',
    email: 'kai@example.com',
    avatar: null,
    donorPresentation: null,
    userRank: {
      id: 1,
      name: 'User',
      level: 100,
      color: 'gray',
      permissions: {}
    }
  };

  it('stores credentials on getMe success and logs out on 403', async () => {
    const successStore = createTestStore();
    fetchMock.mockResolvedValueOnce(makeResponse({ body: authUser }));

    await successStore.dispatch(authApi.endpoints.getMe.initiate()).unwrap();

    expect(successStore.getState().auth).toMatchObject({
      isAuthenticated: true,
      user: authUser
    });

    const request = await getLastRequest();
    expect(request).toEqual({
      url: '/api/auth',
      method: 'GET',
      body: ''
    });

    const forbiddenStore = createTestStore();
    forbiddenStore.dispatch(setCredentials(authUser));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 403, body: { msg: 'Forbidden' } })
    );

    await expect(
      forbiddenStore.dispatch(authApi.endpoints.getMe.initiate()).unwrap()
    ).rejects.toMatchObject({
      status: 403
    });

    expect(forbiddenStore.getState().auth).toEqual({
      user: null,
      isAuthenticated: false
    });
  });

  it('logs out on base-query 401 and stores credentials on login success', async () => {
    const unauthorizedStore = createTestStore();
    unauthorizedStore.dispatch(setCredentials(authUser));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 401, body: { msg: 'Unauthorized' } })
    );

    await expect(
      unauthorizedStore.dispatch(authApi.endpoints.getMe.initiate()).unwrap()
    ).rejects.toMatchObject({
      status: 401
    });

    expect(unauthorizedStore.getState().auth).toEqual({
      user: null,
      isAuthenticated: false
    });

    const loginStore = createTestStore();
    fetchMock.mockResolvedValueOnce(makeResponse({ body: { user: authUser } }));

    await loginStore
      .dispatch(
        authApi.endpoints.login.initiate({
          email: 'kai@example.com',
          password: 'password123'
        })
      )
      .unwrap();

    expect(loginStore.getState().auth).toMatchObject({
      isAuthenticated: true,
      user: authUser
    });

    const request = await getLastRequest();
    expect(request).toEqual({
      url: '/api/auth',
      method: 'POST',
      body: JSON.stringify({
        email: 'kai@example.com',
        password: 'password123'
      })
    });
  });

  it('does not dispatch logout for non-401/403 errors in getMe onQueryStarted', async () => {
    const store = createTestStore();
    setCredentials(authUser);
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 500, body: { msg: 'Server Error' } })
    );

    await expect(
      store.dispatch(authApi.endpoints.getMe.initiate()).unwrap()
    ).rejects.toMatchObject({ status: 500 });

    // Auth state unchanged (no logout dispatched for 500)
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('builds requests for register, account maintenance, recovery, and sessions', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            authApi.endpoints.register.initiate({
              username: 'newuser',
              email: 'new@example.com',
              password: 'password123'
            })
          ),
        response: { status: 201, body: { user: authUser } },
        expected: {
          url: '/api/auth/register',
          method: 'POST',
          body: JSON.stringify({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            authApi.endpoints.changePassword.initiate({
              currentPassword: 'old-password',
              newPassword: 'new-password'
            })
          ),
        response: { status: 200, body: { msg: 'Password updated' } },
        expected: {
          url: '/api/auth/password',
          method: 'POST',
          body: JSON.stringify({
            currentPassword: 'old-password',
            newPassword: 'new-password'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            authApi.endpoints.changeEmail.initiate({
              newEmail: 'next@example.com',
              password: 'password123'
            })
          ),
        response: { status: 200, body: { msg: 'Email updated' } },
        expected: {
          url: '/api/auth/email',
          method: 'PUT',
          body: JSON.stringify({
            newEmail: 'next@example.com',
            password: 'password123'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            authApi.endpoints.requestRecovery.initiate({
              email: 'kai@example.com'
            })
          ),
        response: {
          status: 200,
          body: { msg: 'If that email exists, a recovery link has been sent' }
        },
        expected: {
          url: '/api/auth/recovery/request',
          method: 'POST',
          body: JSON.stringify({ email: 'kai@example.com' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            authApi.endpoints.resetPassword.initiate({
              token: 'reset-token',
              newPassword: 'brand-new-password'
            })
          ),
        response: { status: 200, body: { msg: 'Password reset successfully' } },
        expected: {
          url: '/api/auth/recovery/reset',
          method: 'POST',
          body: JSON.stringify({
            token: 'reset-token',
            newPassword: 'brand-new-password'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(authApi.endpoints.getSessions.initiate()),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/auth/sessions',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(authApi.endpoints.revokeSession.initiate('sess-1')),
        response: { status: 204 },
        expected: {
          url: '/api/auth/sessions/sess-1',
          method: 'DELETE',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(authApi.endpoints.logout.initiate()),
        response: { status: 204 },
        expected: {
          url: '/api/auth/logout',
          method: 'POST',
          body: ''
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });
});
