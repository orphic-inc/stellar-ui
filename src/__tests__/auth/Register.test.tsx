import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Register from '../../components/auth/Register';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockRegister = jest.fn();
const mockUseGetInstallStatusQuery = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useRegisterMutation: () => [mockRegister, { isLoading: false }]
}));

jest.mock('../../store/services/installApi', () => ({
  useGetInstallStatusQuery: () => mockUseGetInstallStatusQuery()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{
    username: string;
    email: string;
    password: string;
    password2: string;
  }> = {}
) => {
  const fields = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    password2: 'password123',
    ...overrides
  };
  await user.type(screen.getByLabelText(/username/i), fields.username);
  await user.type(screen.getByLabelText(/email/i), fields.email);
  await user.type(screen.getByLabelText(/^password$/i), fields.password);
  await user.type(screen.getByLabelText(/confirm password/i), fields.password2);
};

describe('Register', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { registrationStatus: 'open' }
    });
  });

  it('dispatches success alert and navigates on successful registration', async () => {
    mockRegister.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 1 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Account created.')).toBe(true);
    });
  });

  it('shows closed-registration message when registrationStatus is closed', () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { registrationStatus: 'closed' }
    });
    renderWithProviders(<Register />);
    expect(
      screen.getByText(/registration is currently closed/i)
    ).toBeInTheDocument();
  });

  describe('a full site (#327)', () => {
    it('replaces the form with the full notice in open mode', () => {
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { registrationStatus: 'open', registrationFull: true }
      });
      renderWithProviders(<Register />);

      expect(
        screen.getByText(
          /registration is full: the site has reached its member limit/i
        )
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /register/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    });

    it('says the same thing in invite mode, and promises nothing about the key', () => {
      // stellar-api#627 keeps an invite's clock running while the site is full,
      // so this page must not promise the key stays valid. The api's own reply
      // to the POST names the expiry date; before a key is entered there is no
      // date to name.
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { registrationStatus: 'invite', registrationFull: true }
      });
      renderWithProviders(<Register />);

      expect(
        screen.getByText(
          /registration is full: the site has reached its member limit/i
        )
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/invite key/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/still valid|valid until/i)
      ).not.toBeInTheDocument();
    });

    it('renders the form while the site is not full', () => {
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { registrationStatus: 'open', registrationFull: false }
      });
      renderWithProviders(<Register />);

      expect(
        screen.getByRole('button', { name: /register/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/registration is full/i)
      ).not.toBeInTheDocument();
    });

    it('keeps the closed wording when a closed site is also full', () => {
      // The api forces registrationFull false while closed, but the branch
      // order is what guarantees the closed wording wins if it ever did not.
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { registrationStatus: 'closed', registrationFull: true }
      });
      renderWithProviders(<Register />);

      expect(
        screen.getByText(/registration is currently closed/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/registration is full/i)
      ).not.toBeInTheDocument();
    });

    it("surfaces the api's expiry-qualified refusal when the site fills mid-visit", async () => {
      // registrationFull is a snapshot; the submit is authoritative and its
      // words are the api's, expiry date included.
      const full =
        'Registration is full: the site has reached its member limit. Your invite is valid until Fri, 19 Sep 2026 12:00:00 GMT.';
      mockUseGetInstallStatusQuery.mockReturnValue({
        data: { registrationStatus: 'invite', registrationFull: false }
      });
      mockRegister.mockReturnValue({
        unwrap: () => Promise.reject({ status: 403, data: { msg: full } })
      });
      const user = userEvent.setup();
      const { store } = renderWithProviders(<Register />);

      await fillForm(user);
      await user.type(screen.getByLabelText(/invite key/i), 'KEY-LATE');
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        const alerts = selectAlerts(store.getState());
        expect(alerts.some((a) => a.msg === full)).toBe(true);
      });
    });
  });

  it('shows "Passwords do not match" when passwords differ', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await fillForm(user, { password2: 'different' });
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Passwords do not match.')).toBe(
        true
      );
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('surfaces backend { msg } when the user already exists', async () => {
    mockRegister.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'User already exists' }, status: 400 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'User already exists')).toBe(true);
    });
  });

  it('surfaces backend { errors } for field-level validation failures', async () => {
    mockRegister.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: {
            msg: 'Validation failed',
            errors: { username: ['Username is too short'] }
          },
          status: 400
        })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Username is too short')).toBe(true);
    });
  });

  it('shows invite key field and submits with inviteKey in invite mode', async () => {
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { registrationStatus: 'invite' }
    });
    mockRegister.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 2 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    expect(
      screen.getByText(/enter your invite key to register/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/invite key/i)).toBeInTheDocument();

    await fillForm(user);
    await user.type(screen.getByLabelText(/invite key/i), 'KEY-1234');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ inviteKey: 'KEY-1234' })
      );
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Account created.')).toBe(true);
    });
  });

  it("shows the api's expired-invite message as-is (#330)", async () => {
    // stellar-api#627: a lapsed key answers 403 with this exact message.
    const expired =
      'This invite has expired. Ask the member who invited you to send a new one.';
    mockUseGetInstallStatusQuery.mockReturnValue({
      data: { registrationStatus: 'invite' }
    });
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({ status: 403, data: { msg: expired } })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await fillForm(user);
    await user.type(screen.getByLabelText(/invite key/i), 'KEY-LAPSED');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === expired)).toBe(true);
    });
  });

  it('falls back to generic message when error has no recognized shape', async () => {
    mockRegister.mockReturnValue({
      unwrap: () => Promise.reject({ status: 500 })
    });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Registration failed.')).toBe(true);
    });
  });
});
