import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankManager from '../../components/admin/UserRankManager';

const mockUseGetUserRanksQuery = jest.fn();
const mockDeleteUserRank = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetUserRanksQuery: () => mockUseGetUserRanksQuery(),
  useDeleteUserRankMutation: () => [mockDeleteUserRank, { isLoading: false }]
}));

const makeRank = (id: number, name: string, level: number) => ({
  id,
  name,
  level,
  userCount: id * 10
});

describe('UserRankManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
  });

  it('shows spinner while loading', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<UserRankManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<UserRankManager />);
    expect(
      screen.getByText(/failed to load user ranks/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no ranks defined', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserRankManager />);
    expect(
      screen.getByText(/no user ranks defined yet/i)
    ).toBeInTheDocument();
  });

  it('renders rank list with name, level, user count, and actions', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [makeRank(1, 'Member', 100), makeRank(2, 'Staff', 500)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserRankManager />);
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /edit/i }).length).toBe(2);
    expect(
      screen.getByRole('link', { name: /\+ new user rank/i })
    ).toBeInTheDocument();
  });

  it('calls deleteUserRank after confirm', async () => {
    mockDeleteUserRank.mockResolvedValue({});
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [makeRank(3, 'PowerUser', 200)],
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankManager />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteUserRank).toHaveBeenCalledWith(3);
  });

  it('does not delete when user cancels confirm', async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [makeRank(3, 'PowerUser', 200)],
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<UserRankManager />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDeleteUserRank).not.toHaveBeenCalled();
  });
});
