import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import Install from '../../components/pages/public/Install';

const mockInstall = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
let mockIsInstalling = false;

let mockConfigWarnings: string[] = [];

jest.mock('../../store/services/installApi', () => ({
  installApi: {
    util: {
      updateQueryData: jest.fn((...args: unknown[]) => {
        const fn = args[2];
        if (typeof fn === 'function')
          fn({
            installed: false,
            registrationStatus: 'open',
            configWarnings: [],
            setupChecklist: []
          });
        return { type: 'mock' };
      })
    }
  },
  useGetInstallStatusQuery: () => ({
    data: {
      installed: false,
      registrationStatus: 'open',
      configWarnings: mockConfigWarnings,
      setupChecklist: []
    }
  }),
  useInstallMutation: () => [mockInstall, { isLoading: mockIsInstalling }]
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
  await user.type(screen.getByLabelText(/username/i), username);
  await user.type(screen.getByLabelText(/^email$/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), confirm);
};

describe('Install', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInstalling = false;
    mockConfigWarnings = [];
  });

  it('renders labeled fields and Install button', () => {
    renderWithProviders(<Install />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^install$/i })
    ).toBeInTheDocument();
  });

  it('shows explanatory text about what will be created', () => {
    renderWithProviders(<Install />);
    expect(screen.getByText(/first-time setup/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sysop/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 gib/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /launch configuration reminders will remain visible in the staff bar until they are addressed or dismissed/i
      )
    ).toBeInTheDocument();
  });

  it('shows configWarnings from install status when present', () => {
    mockConfigWarnings = [
      'STELLAR_SITE_URL is not set or uses the development default.',
      'SMTP is not configured.'
    ];
    renderWithProviders(<Install />);
    expect(
      screen.getByText(
        /STELLAR_SITE_URL is not set or uses the development default./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/SMTP is not configured./i)).toBeInTheDocument();
  });

  it('does not render the warnings panel when configWarnings is empty', () => {
    mockConfigWarnings = [];
    renderWithProviders(<Install />);
    expect(
      screen.queryByText(/environment configuration notes/i)
    ).not.toBeInTheDocument();
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

  it('dispatches setCredentials and navigates to / on success', async () => {
    mockInstall.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ user: { id: 1, username: 'sysop', userRank: {} } })
    });
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'success' })
      })
    );
  });

  it('dispatches danger alert on install failure', async () => {
    mockInstall.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Already installed.' } })
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

  it('shows "Installing…" when isLoading is true', () => {
    mockIsInstalling = true;
    renderWithProviders(<Install />);
    expect(
      screen.getByRole('button', { name: /installing…/i })
    ).toBeInTheDocument();
  });

  it('dispatches fallback danger alert when install fails with no API message', async () => {
    mockInstall.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(<Install />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /^install$/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ msg: 'Installation failed' })
        })
      );
    });
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
