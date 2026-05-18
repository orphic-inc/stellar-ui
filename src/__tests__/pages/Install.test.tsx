import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Install from '../../components/pages/public/Install';

const mockInstall = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/installApi', () => ({
  installApi: { util: { updateQueryData: jest.fn(() => ({ type: 'mock' })) } },
  useInstallMutation: () => [mockInstall, { isLoading: false }]
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  {
    username = 'sysop',
    email = 'sysop@example.com',
    password = 'secret123',
    confirm = 'secret123'
  } = {}
) => {
  await user.type(
    document.querySelector('input[autocomplete="username"]') as HTMLElement,
    username
  );
  await user.type(
    document.querySelector('input[autocomplete="email"]') as HTMLElement,
    email
  );
  const passwordInputs = document.querySelectorAll(
    'input[autocomplete="new-password"]'
  );
  await user.type(passwordInputs[0] as HTMLElement, password);
  await user.type(passwordInputs[1] as HTMLElement, confirm);
};

describe('Install', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username, email, password, confirm fields and Install button', () => {
    renderWithProviders(<Install />);
    expect(
      document.querySelector('input[autocomplete="username"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[autocomplete="email"]')
    ).toBeInTheDocument();
    const passwordInputs = document.querySelectorAll(
      'input[autocomplete="new-password"]'
    );
    expect(passwordInputs.length).toBe(2);
    expect(screen.getByRole('button', { name: /^install$/i })).toBeInTheDocument();
  });

  it('shows explanatory text about what will be created', () => {
    renderWithProviders(<Install />);
    expect(screen.getByText(/first-time setup/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sysop/i).length).toBeGreaterThan(0);
  });

  it('calls install mutation with correct values on submit', async () => {
    mockInstall.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { id: 1, username: 'sysop' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    expect(mockInstall).toHaveBeenCalledWith({
      username: 'sysop',
      email: 'sysop@example.com',
      password: 'secret123'
    });
  });

  it('dispatches setCredentials and navigates to /private on success', async () => {
    mockInstall.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ user: { id: 1, username: 'sysop', userRank: {} } })
    });
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private');
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ alertType: 'success' }) })
    );
  });

  it('dispatches danger alert on install failure', async () => {
    mockInstall.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { msg: 'Already installed.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await fillForm(user, { password: 'secret123', confirm: 'wrong999' });
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('shows validation error when username is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });
});
