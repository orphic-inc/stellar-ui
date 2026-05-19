import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import Login from '../../components/auth/Login';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();
let mockLocationState: { notice?: string } | null = null;
let mockInstallStatus: { registrationStatus: string } | undefined = undefined;

jest.mock('../../store/services/authApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }]
}));

jest.mock('../../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => ({ data: mockInstallStatus })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState, pathname: '/login' }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const fillAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  email = 'test@example.com',
  password = 'password123'
) => {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('Login', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockLocationState = null;
    mockInstallStatus = undefined;
  });

  it('surfaces backend { msg } for a disabled account (403)', async () => {
    mockLogin.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'Account disabled' }, status: 403 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    await fillAndSubmit(user);

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Account disabled')).toBe(true);
    });
  });

  it('falls back to generic message for invalid credentials', async () => {
    mockLogin.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'Invalid credentials' }, status: 400 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    await fillAndSubmit(user);

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Invalid credentials')).toBe(true);
    });
  });

  it('shows rate-limit message on 429', async () => {
    mockLogin.mockReturnValue({
      unwrap: () => Promise.reject({ status: 429 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    await fillAndSubmit(user);

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(
        alerts.some((a) => a.msg === 'Too many attempts, try again later.')
      ).toBe(true);
    });
  });

  it('shows notice banner when location state has a notice', () => {
    mockLocationState = { notice: 'Your session expired. Please log in again.' };
    renderWithProviders(<Login />);
    expect(
      screen.getByText('Your session expired. Please log in again.')
    ).toBeInTheDocument();
  });

  it('shows Register link when registrationStatus is open', () => {
    mockInstallStatus = { registrationStatus: 'open' };
    renderWithProviders(<Login />);
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('hides Register link when registrationStatus is not open', () => {
    mockInstallStatus = { registrationStatus: 'closed' };
    renderWithProviders(<Login />);
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
  });

  it('redirects to /private when user is already logged in', async () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 1,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<Login />, { store });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private');
    });
  });

  it('dispatches fallback error message when rejection has no API message', async () => {
    mockLogin.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    await fillAndSubmit(user);

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(
        alerts.some((a) => a.msg === 'Invalid email or password.')
      ).toBe(true);
    });
  });
});
