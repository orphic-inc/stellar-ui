import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Login from '../../components/auth/Login';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockLogin = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null, pathname: '/login' })
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => {
    if (selector.toString().includes('selectCurrentUser')) return null;
    return selector({ auth: { user: null }, alert: [] });
  }
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
});
