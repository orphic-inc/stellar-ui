import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import UserRankManager from '../../components/admin/UserRankManager';
import type { UserRankRecord } from '../../store/services/userApi';

const mockUseGetUserRanksQuery = jest.fn();
const mockDeleteUserRank = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetUserRanksQuery: () => mockUseGetUserRanksQuery(),
  useDeleteUserRankMutation: () => [mockDeleteUserRank, { isLoading: false }]
}));

// Mirrors what formatRank() actually sends (stellar-api routes/api/tools.ts):
// every field unconditionally, `secondary` and `permittedForumIds` included.
// The old fixture omitted both, so the Type and Forum Overrides columns below
// rendered their undefined fallbacks and nothing ever asserted on them.
const makeRank = (
  id: number,
  name: string,
  level: number,
  overrides: Partial<UserRankRecord> = {}
): UserRankRecord => ({
  id,
  name,
  level,
  permissions: {},
  secondary: false,
  permittedForumIds: [],
  color: '',
  badge: '',
  personalCollageLimit: 0,
  authorStylesheetLimit: 0,
  assetLimit: 0,
  displayStaff: false,
  staffGroupId: null,
  primaryUserCount: id * 10,
  secondaryUserCount: 0,
  userCount: id * 10,
  ...overrides
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
    expect(screen.getByText(/failed to load user ranks/i)).toBeInTheDocument();
  });

  it('shows empty state when no ranks defined', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserRankManager />);
    expect(screen.getByText(/no user ranks defined yet/i)).toBeInTheDocument();
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

  it('renders the Type and Forum Overrides columns off the real fields', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [
        makeRank(1, 'Member', 100),
        makeRank(2, 'Donor', 500, {
          secondary: true,
          permittedForumIds: [7, 9]
        })
      ],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserRankManager />);
    const rows = document.querySelectorAll('table[data-st="grid"] tbody tr');
    expect(rows).toHaveLength(2);
    // Member: primary, no forum overrides.
    expect(rows[0]).toHaveTextContent('Primary');
    // Donor: secondary, two forum overrides.
    expect(rows[1]).toHaveTextContent('Secondary');
    expect(within(rows[1] as HTMLElement).getByText('2')).toBeInTheDocument();
  });

  it('renders ranks on the grid table (kit hooks present)', () => {
    mockUseGetUserRanksQuery.mockReturnValue({
      data: [makeRank(1, 'Member', 100)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<UserRankManager />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
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
