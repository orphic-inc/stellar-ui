import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import UserProfile from '../../components/profile/UserProfile';

/**
 * The ratio policy notice, asserted through `UserProfile` (ui#334).
 *
 * The defect this covers is not "the notice renders wrong" — it is "the notice
 * is not mounted". `RatioStats` had a full green spec for months while nothing
 * in the app rendered it, so a spec that mounts the notice DIRECTLY would
 * reproduce the bug rather than catch it. Every case here renders the page.
 *
 * Its own file because `UserProfile.test.tsx` is already ~1400 lines.
 */

jest.mock('dompurify', () => ({ sanitize: (html: string) => html }));

jest.mock('../../components/layout/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading…</div>
}));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
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

let mockCurrentUser: { id: number; username: string } | null = null;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockCurrentUser,
  useDispatch: () => jest.fn()
}));

jest.mock('../../utils/permissions', () => ({
  hasAnyPermission: () => false
}));

jest.mock('../../store/services/userApi', () => ({
  useWarnUserMutation: () => [jest.fn(), { isLoading: false }],
  useGetUserWarningsQuery: () => ({ data: [] }),
  useGetUserNotesQuery: () => ({ data: [] }),
  useAddUserNoteMutation: () => [jest.fn(), { isLoading: false }],
  useDeleteUserNoteMutation: () => [jest.fn()],
  useDisableUserMutation: () => [jest.fn(), { isLoading: false }],
  useEnableUserMutation: () => [jest.fn(), { isLoading: false }],
  useGetUserRankAssignmentQuery: () => ({ data: undefined }),
  useSetUserRankMutation: () => [jest.fn(), { isLoading: false }],
  useSetUserRankLockMutation: () => [jest.fn(), { isLoading: false }],
  useGetUserIpHistoryQuery: () => ({ data: [] }),
  useGetUserEmailHistoryQuery: () => ({ data: [] }),
  useGetUserRanksQuery: () => ({ data: [] }),
  useGetDonorRanksQuery: () => ({ data: [] }),
  useGrantDonorMutation: () => [jest.fn(), { isLoading: false }],
  useRevokeDonorMutation: () => [jest.fn(), { isLoading: false }],
  useRemoveUserWarningMutation: () => [jest.fn()],
  useGetSnatchListByUserIdQuery: () => ({ data: undefined }),
  useGetSnatchListQuery: () => ({ data: undefined, isLoading: false }),
  useTriggerUserRecoveryMutation: () => [jest.fn(), { isLoading: false }],
  useSetStaffBioMutation: () => [jest.fn(), { isLoading: false }]
}));

const mockProfile = {
  id: 42,
  username: 'alice',
  profile: { profileTitle: null, profileInfo: null, avatar: null },
  avatar: null,
  userRank: { name: 'Elite', color: '#ff0', level: 100, displayStaff: false },
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
  staffBio: null,
  isDonor: false,
  recentContributions: [],
  recentSnatches: [],
  community: null
};

type Policy = {
  status: 'OK' | 'WATCH' | 'DOWNLOAD_DISABLED';
  watchStartedAt: string | null;
  watchExpiresAt: string | null;
  downloadDisabledAt: string | null;
  disabledCause: 'RATIO' | 'STAFF' | null;
  lastEvaluatedAt: string;
};

const DAY_MS = 86400000;
// An hour of slack on future dates: `untilTime` floors to whole days, so an
// exact `now + 2 days` becomes "in 1 day" by the time the component renders.
const inDays = (n: number) =>
  new Date(Date.now() + n * DAY_MS + (n > 0 ? 3600000 : 0)).toISOString();

const baseStats = {
  ratio: 0.42,
  requiredRatio: 0.6,
  meetsRequirement: false,
  bracket: { label: '5–10 GiB', maxRequired: 0, minRequired: 0 },
  contributed: '1000000000',
  consumed: '500000000',
  eligibleContributionBytes: '500000000',
  contributionCoverage: 1
};

let mockMyRatioStats: typeof baseStats & { policy: Policy | null } = {
  ...baseStats,
  policy: null
};

jest.mock('../../store/services/profileApi', () => ({
  useGetProfileByUserIdQuery: () => ({
    data: mockProfile,
    isLoading: false,
    error: undefined
  }),
  useGetMyRatioStatsQuery: () => ({ data: mockMyRatioStats, isLoading: false })
}));

jest.mock('../../store/services/friendApi', () => ({
  useGetFriendStatusQuery: () => ({
    data: { status: 'none', isFriend: false }
  }),
  useAddFriendMutation: () => [jest.fn(), { isLoading: false }],
  useAcceptFriendRequestMutation: () => [jest.fn(), { isLoading: false }],
  useRemoveFriendMutation: () => [jest.fn(), { isLoading: false }]
}));

const policy = (over: Partial<Policy> = {}): Policy => ({
  status: 'OK',
  watchStartedAt: null,
  watchExpiresAt: null,
  downloadDisabledAt: null,
  disabledCause: null,
  lastEvaluatedAt: new Date().toISOString(),
  ...over
});

/** The member is looking at their own profile (`mockProfile.id` is 42). */
const asOwner = () => {
  mockCurrentUser = { id: 42, username: 'alice' };
};

describe('UserProfile — ratio policy notice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = { id: 99, username: 'bob' };
    mockMyRatioStats = { ...baseStats, policy: null };
  });

  describe('is mounted on the own profile', () => {
    it('renders the watch notice when the member is on ratio watch', () => {
      asOwner();
      mockMyRatioStats = {
        ...baseStats,
        policy: policy({
          status: 'WATCH',
          watchStartedAt: inDays(-1),
          watchExpiresAt: inDays(2)
        })
      };

      renderWithProviders(<UserProfile />);

      expect(screen.getByText(/Ratio watch\./)).toBeInTheDocument();
    });

    it('renders the disabled notice when downloads are disabled', () => {
      asOwner();
      mockMyRatioStats = {
        ...baseStats,
        policy: policy({
          status: 'DOWNLOAD_DISABLED',
          downloadDisabledAt: inDays(-1),
          disabledCause: 'RATIO'
        })
      };

      renderWithProviders(<UserProfile />);

      expect(screen.getByText(/Downloads disabled\./)).toBeInTheDocument();
    });
  });

  describe('watch wording mirrors the api PM', () => {
    beforeEach(() => {
      asOwner();
      mockMyRatioStats = {
        ...baseStats,
        policy: policy({
          status: 'WATCH',
          watchStartedAt: inDays(-1),
          watchExpiresAt: inDays(2)
        })
      };
    });

    it('names the current ratio and the required ratio', () => {
      renderWithProviders(<UserProfile />);

      const notice = screen.getByText(/Ratio watch\./).closest('div')!;
      expect(notice).toHaveTextContent('Your ratio is 0.420');
      expect(notice).toHaveTextContent('your required ratio is 0.600');
    });

    it('names the deadline in prose', () => {
      renderWithProviders(<UserProfile />);

      // Via the container: the sentence is split across text nodes.
      const notice = screen.getByText(/Ratio watch\./).closest('div')!;
      expect(notice).toHaveTextContent('Your watch ends in 2 days');
    });

    it('names the 10 GiB trigger, not only the deadline', () => {
      renderWithProviders(<UserProfile />);

      expect(
        screen.getByText(/download 10 GiB or more before it is/)
      ).toBeInTheDocument();
    });

    it('links to the ratio rules', () => {
      renderWithProviders(<UserProfile />);

      const notice = screen.getByText(/Ratio watch\./).closest('div')!;
      expect(
        within(notice).getByRole('link', { name: 'ratio rules' })
      ).toHaveAttribute('href', '/ratio');
    });
  });

  it('omits the deadline clause when the watch has no expiry', () => {
    asOwner();
    mockMyRatioStats = {
      ...baseStats,
      policy: policy({ status: 'WATCH', watchExpiresAt: null })
    };

    renderWithProviders(<UserProfile />);

    // `untilTime` renders a missing date as "shortly", which would read as an
    // imminent deadline the api never set.
    expect(screen.queryByText(/Your watch ends/)).not.toBeInTheDocument();
    expect(screen.queryByText(/shortly/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/download 10 GiB or more before it is/)
    ).toBeInTheDocument();
  });

  describe('the disable names its cause', () => {
    const disabled = (cause: 'RATIO' | 'STAFF' | null) => {
      asOwner();
      mockMyRatioStats = {
        ...baseStats,
        policy: policy({
          status: 'DOWNLOAD_DISABLED',
          downloadDisabledAt: inDays(-1),
          disabledCause: cause
        })
      };
    };

    it('says a ratio disable lifts itself, and links the rules', () => {
      disabled('RATIO');
      renderWithProviders(<UserProfile />);

      expect(
        screen.getByText(/come back automatically once your ratio meets it/)
      ).toBeInTheDocument();
    });

    it('says a staff disable does not lift, and points at Staff PM', () => {
      disabled('STAFF');
      renderWithProviders(<UserProfile />);

      expect(
        screen.getByText(/Downloads disabled by staff\./)
      ).toBeInTheDocument();
      expect(screen.getByText(/does not lift on its own/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Staff PM' })).toHaveAttribute(
        'href',
        '/inbox/staff/new'
      );
    });

    it('stays neutral about the cause when there is none', () => {
      disabled(null);
      renderWithProviders(<UserProfile />);

      const notice = screen.getByText(/Downloads disabled\./).closest('div')!;
      expect(notice).toHaveTextContent('Contact staff through Staff PM');
      expect(notice).not.toHaveTextContent('Your ratio fell short');
      expect(notice).not.toHaveTextContent('by staff');
    });
  });

  describe('stays silent when it should', () => {
    it('renders nothing when the policy status is OK', () => {
      asOwner();
      mockMyRatioStats = { ...baseStats, policy: policy({ status: 'OK' }) };

      renderWithProviders(<UserProfile />);

      expect(screen.queryByText(/Ratio watch\./)).not.toBeInTheDocument();
      expect(screen.queryByText(/Downloads disabled/)).not.toBeInTheDocument();
    });

    it('renders nothing when there is no policy state at all', () => {
      asOwner();
      mockMyRatioStats = { ...baseStats, policy: null };

      renderWithProviders(<UserProfile />);

      expect(screen.queryByText(/Ratio watch\./)).not.toBeInTheDocument();
      expect(screen.queryByText(/Downloads disabled/)).not.toBeInTheDocument();
    });

    it("renders nothing on another member's profile", () => {
      // Not the owner: `mockCurrentUser` is bob (99), the profile is alice (42).
      mockMyRatioStats = {
        ...baseStats,
        policy: policy({
          status: 'WATCH',
          watchStartedAt: inDays(-1),
          watchExpiresAt: inDays(2)
        })
      };

      renderWithProviders(<UserProfile />);

      expect(screen.queryByText(/Ratio watch\./)).not.toBeInTheDocument();
    });
  });
});
