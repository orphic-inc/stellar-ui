import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
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

  // An api older than #622 answers the same 403 with `msg` alone: no panel to
  // build from, so the toast it always showed is still what happens.
  it('falls back to the toast for a 403 that carries no destination', async () => {
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
    mockLocationState = {
      notice: 'Your session expired. Please log in again.'
    };
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
    const { container } = renderWithProviders(<Login />);
    expect(
      screen.queryByRole('link', { name: /register/i })
    ).not.toBeInTheDocument();
    // The separator goes with it: a closed registration used to leave a
    // trailing "·" after "Forgot password?".
    expect(container.textContent).not.toContain('·');
  });

  it('separates the two links when Register is shown', () => {
    mockInstallStatus = { registrationStatus: 'open' };
    const { container } = renderWithProviders(<Login />);
    expect(container.textContent).toContain('·');
  });

  it('redirects to / when user is already logged in', async () => {
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
      expect(mockNavigate).toHaveBeenCalledWith('/');
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
      expect(alerts.some((a) => a.msg === 'Invalid email or password.')).toBe(
        true
      );
    });
  });

  describe('a disabled account is told where to go (#324, api#622)', () => {
    const DISABLED = {
      msg: 'Account disabled',
      disabledChannel: '#disabled',
      ircGuideUrl: 'https://korin.pink/wiki/irc'
    };

    const refuseAsDisabled = (data: Record<string, unknown> = DISABLED) =>
      mockLogin.mockReturnValue({
        unwrap: () => Promise.reject({ status: 403, data })
      });

    const signIn = async () => {
      const user = userEvent.setup();
      const view = renderWithProviders(<Login />);
      await fillAndSubmit(user);
      return { ...view, user };
    };

    it('names the channel and links the guide, and says who reinstates', async () => {
      refuseAsDisabled();
      await signIn();
      const panel = await screen.findByRole('alert');
      expect(panel).toHaveTextContent('Account disabled');
      expect(panel).toHaveTextContent('#disabled');
      expect(panel).toHaveTextContent(
        'Reactivation is handled by staff on IRC.'
      );
      const link = within(panel).getByRole('link', {
        name: /how to connect to irc/i
      });
      expect(link).toHaveAttribute('href', DISABLED.ircGuideUrl);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('stays on the form instead of announcing it once as a toast', async () => {
      refuseAsDisabled();
      const { store } = await signIn();
      await screen.findByRole('alert');
      expect(selectAlerts(store.getState())).toHaveLength(0);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('clears when the next attempt starts, so it cannot outlive its account', async () => {
      refuseAsDisabled();
      const { user, store } = await signIn();
      await screen.findByRole('alert');

      mockLogin.mockReturnValue({
        unwrap: () =>
          Promise.reject({ status: 400, data: { msg: 'Invalid credentials' } })
      });
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(
          selectAlerts(store.getState()).some(
            (a) => a.msg === 'Invalid credentials'
          )
        ).toBe(true)
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it.each([
      [
        'no channel',
        { msg: 'Account disabled', ircGuideUrl: 'https://x.test' }
      ],
      ['no guide', { msg: 'Account disabled', disabledChannel: '#disabled' }]
    ])('shows no panel with %s, only the toast', async (_name, data) => {
      refuseAsDisabled(data);
      const { store } = await signIn();
      await waitFor(() =>
        expect(
          selectAlerts(store.getState()).some(
            (a) => a.msg === 'Account disabled'
          )
        ).toBe(true)
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
