import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserMenu from '../../components/layout/UserMenu';

const mockLogout = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/authApi', () => ({
  useLogoutMutation: () => [mockLogout]
}));

jest.mock('../../store/api', () => ({
  ...jest.requireActual('../../store/api'),
  api: {
    ...jest.requireActual('../../store/api').api,
    util: { resetApiState: jest.fn(() => ({ type: 'api/reset' })) }
  }
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const mockUser = {
  id: 42,
  username: 'jazzfan',
  avatar: null,
  inviteCount: 3,
  userRank: { level: 100, name: 'User', color: '#fff' }
};

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockResolvedValue({});
  });

  it('renders username link and action links', () => {
    renderWithProviders(<UserMenu user={mockUser} />);
    expect(screen.getByRole('link', { name: 'jazzfan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /contribute/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('shows invite count', () => {
    renderWithProviders(<UserMenu user={mockUser} />);
    expect(screen.getByText(/invite \(3\)/i)).toBeInTheDocument();
  });

  it('shows ∞ when invite count is null', () => {
    renderWithProviders(
      <UserMenu user={{ ...mockUser, inviteCount: undefined }} />
    );
    expect(screen.getByText(/invite \(∞\)/i)).toBeInTheDocument();
  });

  it('calls logout, dispatches actions, and navigates to /login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu user={mockUser} />);
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('profile link points to /private/user/jazzfan', () => {
    renderWithProviders(<UserMenu user={mockUser} />);
    expect(screen.getByRole('link', { name: 'jazzfan' })).toHaveAttribute(
      'href',
      '/private/user/jazzfan'
    );
  });
});
