import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Recovery from '../../components/auth/Recovery';

const mockRequestRecovery = jest.fn();
const mockResetPassword = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockUseSearchParams = jest.fn();
let mockIsRequesting = false;
let mockIsResetting = false;

jest.mock('../../store/services/authApi', () => ({
  useRequestRecoveryMutation: () => [
    mockRequestRecovery,
    { isLoading: mockIsRequesting }
  ],
  useResetPasswordMutation: () => [
    mockResetPassword,
    { isLoading: mockIsResetting }
  ]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

describe('Recovery — request form (no token)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  it('renders email form and back-to-login link', () => {
    renderWithProviders(<Recovery />);
    expect(
      screen.getByRole('button', { name: /send recovery email/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to login/i })
    ).toBeInTheDocument();
  });

  it('calls requestRecovery with email on submit', async () => {
    mockRequestRecovery.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(
      screen.getByLabelText(/email address/i),
      'alice@example.com'
    );
    await user.click(
      screen.getByRole('button', { name: /send recovery email/i })
    );
    expect(mockRequestRecovery).toHaveBeenCalledWith({
      email: 'alice@example.com'
    });
  });

  it('shows submitted confirmation message after success', async () => {
    mockRequestRecovery.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await user.click(
      screen.getByRole('button', { name: /send recovery email/i })
    );
    expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
  });

  it('dispatches danger alert on request failure with API message', async () => {
    mockRequestRecovery.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Server error.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/email address/i), 'bad@email.com');
    await user.click(
      screen.getByRole('button', { name: /send recovery email/i })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Server error.',
          alertType: 'danger'
        })
      })
    );
  });

  it('dispatches fallback danger alert on request failure without API message', async () => {
    mockRequestRecovery.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/email address/i), 'bad@email.com');
    await user.click(
      screen.getByRole('button', { name: /send recovery email/i })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Failed to send recovery email.',
          alertType: 'danger'
        })
      })
    );
  });

  it('shows "Sending…" button label when isLoading is true', () => {
    mockIsRequesting = true;
    renderWithProviders(<Recovery />);
    expect(
      screen.getByRole('button', { name: /sending…/i })
    ).toBeInTheDocument();
  });
});

describe('Recovery — reset form (with token)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams('token=abc123')]);
  });

  it('renders new password and confirm password fields', () => {
    renderWithProviders(<Recovery />);
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reset password/i })
    ).toBeInTheDocument();
  });

  it('calls resetPassword and navigates on success', async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/^new password/i), 'newpass123');
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      'newpass123'
    );
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(mockResetPassword).toHaveBeenCalledWith({
      token: 'abc123',
      newPassword: 'newpass123'
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('dispatches success alert on successful reset', async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/^new password/i), 'newpass123');
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      'newpass123'
    );
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Password reset successfully. Please log in.',
          alertType: 'success'
        })
      })
    );
  });

  it('dispatches fallback danger alert on reset API failure', async () => {
    mockResetPassword.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/^new password/i), 'newpass123');
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      'newpass123'
    );
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Failed to reset password.',
          alertType: 'danger'
        })
      })
    );
  });

  it('dispatches danger alert when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Recovery />);
    await user.type(screen.getByLabelText(/^new password/i), 'pass1234');
    await user.type(screen.getByLabelText(/confirm new password/i), 'pass5678');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Passwords do not match.',
          alertType: 'danger'
        })
      })
    );
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows "Resetting…" button label when isLoading is true', () => {
    mockIsResetting = true;
    renderWithProviders(<Recovery />);
    expect(
      screen.getByRole('button', { name: /resetting…/i })
    ).toBeInTheDocument();
  });
});
