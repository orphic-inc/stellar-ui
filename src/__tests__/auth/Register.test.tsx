import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Register from '../../components/auth/Register';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockRegister = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useRegisterMutation: () => [mockRegister, { isLoading: false }]
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
