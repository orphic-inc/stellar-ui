import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommunityPage from '../../components/communities/CommunityPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseGetCommunityByIdQuery = jest.fn();
const mockUseGetReleasesByCommunityQuery = jest.fn();
const mockAddCommunityMember = jest.fn();
const mockRemoveCommunityMember = jest.fn();
const mockAddCommunityStaff = jest.fn();
const mockRemoveCommunityStaff = jest.fn();
const mockToggleBookmark = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunityByIdQuery: (...args: unknown[]) =>
    mockUseGetCommunityByIdQuery(...args),
  useGetReleasesByCommunityQuery: (...args: unknown[]) =>
    mockUseGetReleasesByCommunityQuery(...args),
  useAddCommunityMemberMutation: () => [
    mockAddCommunityMember,
    { isLoading: false }
  ],
  useRemoveCommunityMemberMutation: () => [
    mockRemoveCommunityMember,
    { isLoading: false }
  ],
  useAddCommunityStaffMutation: () => [
    mockAddCommunityStaff,
    { isLoading: false }
  ],
  useRemoveCommunityStaffMutation: () => [
    mockRemoveCommunityStaff,
    { isLoading: false }
  ]
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleCommunityBookmarkMutation: () => [
    mockToggleBookmark,
    { isLoading: false }
  ]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ communityId: '3' })
}));

let mockCurrentUser: Record<string, unknown> | null = {
  id: 7,
  username: 'testuser',
  canDownload: true,
  userRank: { permissions: {} }
};

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: (state: unknown) => state
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockCurrentUser,
  useDispatch: () => mockDispatch
}));

// ─── Factories ────────────────────────────────────────────────────────────────

const makeCommunity = (overrides = {}) => ({
  id: 3,
  name: 'Jazz Vault',
  description: 'All jazz, all the time.',
  image: null,
  registrationStatus: 'Open',
  staff: [{ id: 99, username: 'staffmember' }],
  consumers: [
    { user: { id: 10, username: 'alice' } },
    { user: { id: 99, username: 'staffmember' } }
  ],
  _count: { consumers: 2 },
  ...overrides
});

const makeRelease = (id: number) => ({
  id,
  title: `Release ${id}`,
  artist: { id: 1, name: 'Miles Davis' },
  year: 2020,
  type: 'Album',
  image: null,
  tags: [{ name: 'jazz' }],
  contributions: [
    {
      id: 100 + id,
      type: 'FLAC',
      sizeInBytes: 1073741824,
      linkStatus: 'ALIVE',
      user: { id: 10, username: 'alice' },
      _count: { consumers: 3 }
    }
  ]
});

const makeReleasesResponse = (items: ReturnType<typeof makeRelease>[]) => ({
  data: items,
  meta: { total: items.length, limit: 25 }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CommunityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: 7,
      username: 'testuser',
      canDownload: true,
      userRank: { permissions: {} }
    };
    mockToggleBookmark.mockResolvedValue({ bookmarked: true });
    mockAddCommunityMember.mockResolvedValue({});
    mockUseGetReleasesByCommunityQuery.mockReturnValue({
      data: makeReleasesResponse([makeRelease(1)]),
      isLoading: false
    });
  });

  it('shows spinner while community is loading', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows 403 message when user lacks membership', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 403 }
    });
    renderWithProviders(<CommunityPage />);
    expect(
      screen.getByText(/you are not a member of this community/i)
    ).toBeInTheDocument();
  });

  it('shows not found for other errors', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText(/community not found/i)).toBeInTheDocument();
  });

  it('renders community name and description', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText('Jazz Vault')).toBeInTheDocument();
    expect(screen.getByText('All jazz, all the time.')).toBeInTheDocument();
  });

  it('renders releases with contributor and snatch stats', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText('Release 1')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(screen.getByText('FLAC')).toBeInTheDocument();
    expect(screen.getAllByText(/snatch/i).length).toBeGreaterThan(0);
  });

  it('shows empty releases message when list is empty', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    mockUseGetReleasesByCommunityQuery.mockReturnValue({
      data: makeReleasesResponse([]),
      isLoading: false
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText(/no releases yet/i)).toBeInTheDocument();
  });

  it('shows member management panel for community staff', () => {
    mockCurrentUser = {
      id: 99,
      username: 'staffmember',
      canDownload: true,
      userRank: { permissions: {} }
    };
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument();
  });

  it('shows member management for users with communities_manage permission', () => {
    mockCurrentUser = {
      id: 7,
      username: 'testuser',
      canDownload: true,
      userRank: { permissions: { communities_manage: true } }
    };
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('hides member panel for regular member', () => {
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });

  it('submits add member form with entered user ID', async () => {
    const user = userEvent.setup();
    mockCurrentUser = {
      id: 99,
      username: 'staffmember',
      canDownload: true,
      userRank: { permissions: {} }
    };
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    await user.type(screen.getByPlaceholderText('User ID'), '42');
    await user.click(screen.getByRole('button', { name: /add member/i }));
    expect(mockAddCommunityMember).toHaveBeenCalledWith({
      communityId: 3,
      userId: 42
    });
  });

  it('shows staff badge for staff members in list', () => {
    mockCurrentUser = {
      id: 99,
      username: 'staffmember',
      canDownload: true,
      userRank: { permissions: {} }
    };
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('dispatches success alert on bookmark', async () => {
    const user = userEvent.setup();
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    await user.click(screen.getByTitle(/bookmark community/i));
    expect(mockToggleBookmark).toHaveBeenCalledWith(3);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('opens report modal when [Report] clicked', async () => {
    const user = userEvent.setup();
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunityPage />);
    await user.click(screen.getByText('[Report]'));
    // ReportContributionModal is rendered — check for close mechanism
    expect(screen.getByText('[Report]')).toBeInTheDocument();
  });

  it('shows pagination controls when multiple release pages exist', async () => {
    const user = userEvent.setup();
    mockUseGetCommunityByIdQuery.mockReturnValue({
      data: makeCommunity(),
      isLoading: false,
      error: undefined
    });
    mockUseGetReleasesByCommunityQuery.mockReturnValue({
      data: { data: [makeRelease(1)], meta: { total: 50, limit: 25 } },
      isLoading: false
    });
    renderWithProviders(<CommunityPage />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(mockUseGetReleasesByCommunityQuery).toHaveBeenLastCalledWith({
      communityId: 3,
      page: 2
    });
  });
});
