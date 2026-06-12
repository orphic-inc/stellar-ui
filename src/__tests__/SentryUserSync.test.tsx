import { act } from '@testing-library/react';
import { renderWithProviders } from './testUtils';
import SentryUserSync from '../components/SentryUserSync';
import { setCredentials, logout } from '../store/slices/authSlice';
import type { AuthUser } from '../types';

const mockSetUser = jest.fn();
jest.mock('@sentry/react', () => ({ setUser: (u: unknown) => mockSetUser(u) }));

const user = {
  id: 7,
  username: 'kai',
  avatar: null,
  userRank: { level: 100, name: 'User', color: '#fff' }
} as AuthUser;

describe('SentryUserSync', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears the Sentry user when logged out', () => {
    renderWithProviders(<SentryUserSync />);
    expect(mockSetUser).toHaveBeenLastCalledWith(null);
  });

  it('sets the Sentry user on login and clears it on logout', () => {
    const { store } = renderWithProviders(<SentryUserSync />);

    act(() => {
      store.dispatch(setCredentials(user));
    });
    expect(mockSetUser).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: '7', username: 'kai' })
    );

    act(() => {
      store.dispatch(logout());
    });
    expect(mockSetUser).toHaveBeenLastCalledWith(null);
  });
});
