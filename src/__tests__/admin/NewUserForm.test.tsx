import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import NewUserForm from '../../components/admin/NewUserForm';

const mockCreateUser = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useCreateUserMutation: () => [mockCreateUser, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

describe('NewUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username, email, password fields and Create User button', () => {
    renderWithProviders(<NewUserForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create user/i })
    ).toBeInTheDocument();
  });

  it('shows back link to Toolbox', () => {
    renderWithProviders(<NewUserForm />);
    expect(
      screen.getByRole('link', { name: /back to toolbox/i })
    ).toBeInTheDocument();
  });

  it('submits form data and navigates on success', async () => {
    mockCreateUser.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 5 })
    });
    const user = userEvent.setup();
    renderWithProviders(<NewUserForm />);
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret99');
    await user.click(screen.getByRole('button', { name: /create user/i }));
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'secret99'
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private/staff/tools');
    });
  });

  it('shows inline error message on failure', async () => {
    mockCreateUser.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Username already taken.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<NewUserForm />);
    await user.type(screen.getByLabelText(/username/i), 'dupe');
    await user.type(screen.getByLabelText(/email/i), 'dupe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password1');
    await user.click(screen.getByRole('button', { name: /create user/i }));
    await waitFor(() => {
      expect(screen.getByText('Username already taken.')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
