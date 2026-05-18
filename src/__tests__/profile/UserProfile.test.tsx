import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import UserProfile from '../../components/profile/UserProfile';

jest.mock('dompurify', () => ({ sanitize: (html: string) => html }));

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

jest.mock('../../components/profile/RatioStats', () => ({
  __esModule: true,
  default: () => <div>RatioStats</div>
}));

jest.mock('../../components/layout/UserBadges', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '42' }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

let mockCurrentUser: {
  id: number;
  username: string;
  permissions?: Record<string, boolean>;
} | null = {
  id: 99,
  username: 'bob'
};
let mockHasAnyPermission = false;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockCurrentUser,
  useDispatch: () => jest.fn()
}));

jest.mock('../../utils/permissions', () => ({
  hasAnyPermission: () => mockHasAnyPermission
}));

const mockProfile = {
  id: 42,
  username: 'alice',
  email: 'alice@example.com',
  profile: {
    profileTitle: 'Jazz Enthusiast',
    profileInfo: null,
    avatar: null
  },
  avatar: null,
  userRank: { name: 'Elite', color: '#ff0', level: 100 },
  inviteCount: 3,
  dateRegistered: '2020-01-01',
  lastSeen: '2024-01-01',
  stats: {
    contributed: '1000000000',
    consumed: '500000000',
    ratio: '2.00',
    buffer: '500000000',
    requestsFilled: 5,
    forumPosts: 100,
    contributions: 10
  },
  activitySummary: {
    contributions: 10,
    requestsCreated: 3,
    requestsFilled: 5,
    forumTopics: 2,
    forumPosts: 100,
    collagesStarted: 1,
    collageEntries: 15,
    comments: 50
  },
  donorPresentation: null,
  collageShelves: { featuredPersonalCollages: [], publicCollages: [] },
  percentiles: {
    contributed: { percentile: 80, rank: 5, total: 25 },
    consumed: { percentile: 60, rank: 10, total: 25 },
    contributions: { percentile: 70, rank: 7, total: 25 },
    forumPosts: { percentile: 50, rank: 12, total: 25 },
    requestsFilled: { percentile: 40, rank: 15, total: 25 }
  },
  staffPmOverview: null,
  disabled: false,
  warned: null,
  isDonor: false,
  recentContributions: [],
  recentSnatches: []
};

let mockProfileData: typeof mockProfile | undefined = mockProfile;
let mockIsLoading = false;
let mockError: unknown = undefined;

jest.mock('../../store/services/profileApi', () => ({
  useGetProfileByUserIdQuery: () => ({
    data: mockProfileData,
    isLoading: mockIsLoading,
    error: mockError
  }),
  useGetMyRatioStatsQuery: () => ({ data: null, isLoading: false })
}));

jest.mock('../../store/services/userApi', () => ({
  useWarnUserMutation: () => [jest.fn(), { isLoading: false }],
  useGetUserWarningsQuery: () => ({ data: [] }),
  useGetUserNotesQuery: () => ({ data: [] }),
  useAddUserNoteMutation: () => [jest.fn(), { isLoading: false }],
  useDeleteUserNoteMutation: () => [jest.fn()],
  useDisableUserMutation: () => [jest.fn(), { isLoading: false }],
  useEnableUserMutation: () => [jest.fn(), { isLoading: false }],
  useSetUserRankMutation: () => [jest.fn(), { isLoading: false }],
  useGetUserIpHistoryQuery: () => ({ data: [] }),
  useGetUserEmailHistoryQuery: () => ({ data: [] }),
  useGetUserRanksQuery: () => ({ data: [] }),
  useGetDonorRanksQuery: () => ({ data: [] }),
  useGrantDonorMutation: () => [jest.fn(), { isLoading: false }],
  useRevokeDonorMutation: () => [jest.fn(), { isLoading: false }],
  useRemoveUserWarningMutation: () => [jest.fn()],
  useGetSnatchListByUserIdQuery: () => ({ data: [] }),
  useGetSnatchListQuery: () => ({ data: [], isLoading: false })
}));

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileData = mockProfile;
    mockIsLoading = false;
    mockError = undefined;
    mockCurrentUser = { id: 99, username: 'bob' };
    mockHasAnyPermission = false;
  });

  it('shows spinner when loading', () => {
    mockIsLoading = true;
    mockProfileData = undefined;
    renderWithProviders(<UserProfile />);
    expect(screen.getAllByText('Loading…').length).toBeGreaterThan(0);
  });

  it('shows User not found message for 404 error', () => {
    mockError = { status: 404 };
    mockProfileData = undefined;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('User not found.')).toBeInTheDocument();
  });

  it('shows permission denied message for 403 error', () => {
    mockError = { status: 403 };
    mockProfileData = undefined;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('shows must be signed in message for 401 error', () => {
    mockError = { status: 401 };
    mockProfileData = undefined;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText(/must be signed in/i)).toBeInTheDocument();
  });

  it('renders username in page header', () => {
    renderWithProviders(<UserProfile />);
    expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
  });

  it('shows Settings link for own profile', () => {
    mockCurrentUser = { id: 42, username: 'alice' };
    renderWithProviders(<UserProfile />);
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  it("shows Send Message and Report links for other users' profile", () => {
    renderWithProviders(<UserProfile />);
    expect(
      screen.getByRole('link', { name: /send message/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /report/i })).toBeInTheDocument();
  });

  it('hides Send Message link on own profile', () => {
    mockCurrentUser = { id: 42, username: 'alice' };
    renderWithProviders(<UserProfile />);
    expect(
      screen.queryByRole('link', { name: /send message/i })
    ).not.toBeInTheDocument();
  });

  it('shows Staff Actions panel for staff user', () => {
    mockHasAnyPermission = true;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Staff Actions')).toBeInTheDocument();
  });

  it('hides Staff Actions panel for regular user', () => {
    renderWithProviders(<UserProfile />);
    expect(screen.queryByText('Staff Actions')).not.toBeInTheDocument();
  });

  it('shows RatioStats on own profile', () => {
    mockCurrentUser = { id: 42, username: 'alice' };
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('RatioStats')).toBeInTheDocument();
  });

  it('shows user class and rank name', () => {
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Elite')).toBeInTheDocument();
  });
});
