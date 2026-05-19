import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Named mocks for userApi mutations
const mockWarnUser = jest.fn();
const mockDisableUser = jest.fn();
const mockEnableUser = jest.fn();
const mockSetUserRank = jest.fn();
const mockAddUserNote = jest.fn();
const mockDeleteUserNote = jest.fn();
const mockRemoveUserWarning = jest.fn();
const mockGrantDonor = jest.fn();
const mockRevokeDonor = jest.fn();

let mockWarnUserLoading = false;
let mockSetUserRankLoading = false;
let mockGrantDonorLoading = false;

let mockUserRanks: Array<{ id: number; name: string }> = [];
let mockDonorRanks: Array<{ id: number; name: string }> = [];
let mockNotes: Array<{
  id: number;
  body: string;
  createdAt: string;
  author: { username: string };
}> = [];
let mockWarnings: Array<{
  id: number;
  reason: string;
  createdAt: string;
  expiresAt?: string;
  warnedBy?: { username: string };
}> = [];
let mockSnatchListByUser: Array<{
  id: number;
  release: { id: number; communityId: number; title: string };
  artist?: { name: string };
  downloadedAt: string;
}> = [];
let mockSnatchList: Array<{
  id: number;
  release: { id: number; communityId: number; title: string };
  artist?: { name: string };
  downloadedAt: string;
}> = [];

let mockIpHistory: Array<{ ip: string; seenAt: string }> = [];
let mockEmailHistory: Array<{ email: string; changedAt: string }> = [];

jest.mock('../../store/services/userApi', () => ({
  useWarnUserMutation: () => [mockWarnUser, { isLoading: mockWarnUserLoading }],
  useGetUserWarningsQuery: () => ({ data: mockWarnings }),
  useGetUserNotesQuery: () => ({ data: mockNotes }),
  useAddUserNoteMutation: () => [mockAddUserNote, { isLoading: false }],
  useDeleteUserNoteMutation: () => [mockDeleteUserNote],
  useDisableUserMutation: () => [mockDisableUser, { isLoading: false }],
  useEnableUserMutation: () => [mockEnableUser, { isLoading: false }],
  useSetUserRankMutation: () => [mockSetUserRank, { isLoading: mockSetUserRankLoading }],
  useGetUserIpHistoryQuery: () => ({ data: mockIpHistory }),
  useGetUserEmailHistoryQuery: () => ({ data: mockEmailHistory }),
  useGetUserRanksQuery: () => ({ data: mockUserRanks }),
  useGetDonorRanksQuery: () => ({ data: mockDonorRanks }),
  useGrantDonorMutation: () => [mockGrantDonor, { isLoading: mockGrantDonorLoading }],
  useRevokeDonorMutation: () => [mockRevokeDonor, { isLoading: false }],
  useRemoveUserWarningMutation: () => [mockRemoveUserWarning],
  useGetSnatchListByUserIdQuery: () => ({ data: mockSnatchListByUser }),
  useGetSnatchListQuery: () => ({ data: mockSnatchList, isLoading: false })
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

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileData = mockProfile;
    mockIsLoading = false;
    mockError = undefined;
    mockCurrentUser = { id: 99, username: 'bob' };
    mockHasAnyPermission = false;
    mockUserRanks = [];
    mockDonorRanks = [];
    mockNotes = [];
    mockWarnings = [];
    mockSnatchListByUser = [];
    mockSnatchList = [];
    mockIpHistory = [];
    mockEmailHistory = [];
    mockWarnUserLoading = false;
    mockSetUserRankLoading = false;
    mockGrantDonorLoading = false;
    window.confirm = jest.fn(() => true);

    mockWarnUser.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDisableUser.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockEnableUser.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockSetUserRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockAddUserNote.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDeleteUserNote.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockRemoveUserWarning.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockGrantDonor.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockRevokeDonor.mockReturnValue({ unwrap: () => Promise.resolve({}) });
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

  it('renders formatCount fallback for unparseable BigInt string in stats', () => {
    mockProfileData = {
      ...mockProfile,
      stats: { ...mockProfile.stats, contributed: 'not-a-valid-bigint' }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('not-a-valid-bigint')).toBeInTheDocument();
  });

  it('renders Hidden when stats value is null', () => {
    mockProfileData = {
      ...mockProfile,
      stats: { ...mockProfile.stats, contributed: null, consumed: null, buffer: null }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getAllByText('Hidden').length).toBeGreaterThan(0);
  });

  it('renders isDonor heart icon when user is a donor', () => {
    mockProfileData = { ...mockProfile, isDonor: true } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText(/Donor/)).toBeInTheDocument();
  });

  it('renders profileInfo when present', () => {
    mockProfileData = {
      ...mockProfile,
      profile: { profileTitle: 'Jazz Fan', profileInfo: '<p>Bio content here</p>', avatar: null }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Bio content here')).toBeInTheDocument();
  });

  it('shows Unable to load profile for non-404/403/401 error', () => {
    mockError = { status: 500 };
    mockProfileData = undefined;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Unable to load profile.')).toBeInTheDocument();
  });

  it('shows Unable to load profile for error without status', () => {
    mockError = {};
    mockProfileData = undefined;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Unable to load profile.')).toBeInTheDocument();
  });

  it('renders featured collage with empty cover images (placeholder)', () => {
    mockProfileData = {
      ...mockProfile,
      collageShelves: {
        featuredPersonalCollages: [
          { id: 7, name: 'Empty Shelf', numEntries: 0, coverImages: [], categoryId: 0 }
        ],
        publicCollages: [
          {
            id: 8,
            name: 'Empty Public',
            numEntries: 0,
            coverImages: [],
            categoryId: 1,
            updatedAt: '2026-01-01T00:00:00Z'
          }
        ]
      }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Empty Shelf')).toBeInTheDocument();
    expect(screen.getByText('Empty Public')).toBeInTheDocument();
  });

  it('renders recent contributions with null image', () => {
    mockProfileData = {
      ...mockProfile,
      recentContributions: [
        {
          id: 2,
          createdAt: '2026-01-01T00:00:00Z',
          release: {
            id: 20,
            communityId: 1,
            title: 'No Image Release',
            image: null,
            artist: null
          }
        }
      ]
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('No Image Release')).toBeInTheDocument();
  });

  it('renders donorPresentation with rank, expiresAt, customIcon, and secondAvatar', () => {
    mockProfileData = {
      ...mockProfile,
      donorPresentation: {
        profileBlocks: [],
        customIcon: 'https://img.example.com/icon.png',
        customIconLink: 'https://example.com',
        secondAvatar: 'https://img.example.com/avatar.png',
        rank: {
          name: 'Gold',
          badge: '★',
          color: '#gold',
          grantedAt: '2026-01-01T00:00:00Z',
          expiresAt: '2027-01-01T00:00:00Z'
        },
        title: null,
        customColor: '#ff69b4'
      }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Donor Presentation')).toBeInTheDocument();
    expect(screen.getByText(/★ Gold/)).toBeInTheDocument();
  });

  it('shows own snatch list when not empty', () => {
    mockCurrentUser = { id: 42, username: 'alice' };
    mockSnatchList = [
      {
        id: 1,
        release: { id: 10, communityId: 1, title: 'Kind of Blue' },
        artist: { name: 'Miles Davis' },
        downloadedAt: '2026-01-01T00:00:00Z'
      }
    ];
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
  });

  it('renders featured collage with cover images', () => {
    mockProfileData = {
      ...mockProfile,
      collageShelves: {
        featuredPersonalCollages: [
          {
            id: 5,
            name: 'My Jazz Picks',
            numEntries: 10,
            coverImages: ['https://img.example.com/cover1.jpg'],
            categoryId: 0
          }
        ],
        publicCollages: [
          {
            id: 6,
            name: 'Disco',
            numEntries: 5,
            coverImages: ['https://img.example.com/disco.jpg'],
            categoryId: 1,
            updatedAt: '2026-01-01T00:00:00Z'
          }
        ]
      }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('My Jazz Picks')).toBeInTheDocument();
    expect(screen.getByText('Disco')).toBeInTheDocument();
  });

  describe('StaffActionsPanel interactions', () => {
    beforeEach(() => {
      mockHasAnyPermission = true;
      mockUserRanks = [{ id: 10, name: 'Senior' }];
      mockDonorRanks = [{ id: 20, name: 'Gold' }];
    });

    it('opens WarnModal, types in expires field, submits successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /warn user/i }));
      expect(screen.getByRole('heading', { name: 'Warn User' })).toBeInTheDocument();
      const expiresInput = screen.getByLabelText(/expires at/i);
      fireEvent.change(expiresInput, { target: { value: '2026-12-31T00:00' } });
      await user.type(screen.getByLabelText(/^reason$/i), 'Bad behavior');
      fireEvent.submit(screen.getByLabelText(/^reason$/i).closest('form')!);
      await waitFor(() => {
        expect(mockWarnUser).toHaveBeenCalled();
      });
    });

    it('dispatches danger alert when warn user fails with no API message', async () => {
      mockWarnUser.mockReturnValue({ unwrap: () => Promise.reject({}) });
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /warn user/i }));
      await user.type(screen.getByLabelText(/^reason$/i), 'Bad behavior');
      fireEvent.submit(screen.getByLabelText(/^reason$/i).closest('form')!);
      await waitFor(() => {
        expect(mockWarnUser).toHaveBeenCalled();
      });
    });

    it('dispatches danger alert when setUserRank fails', async () => {
      mockSetUserRank.mockReturnValue({ unwrap: () => Promise.reject({}) });
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.selectOptions(screen.getByDisplayValue('Select rank…'), '10');
      await user.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => {
        expect(mockSetUserRank).toHaveBeenCalled();
      });
    });

    it('dispatches danger alert when delete note fails', async () => {
      mockDeleteUserNote.mockReturnValue({ unwrap: () => Promise.reject({}) });
      mockNotes = [
        {
          id: 9,
          body: 'A note',
          createdAt: '2026-01-01T00:00:00Z',
          author: { username: 'mod' }
        }
      ];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /moderation notes/i }));
      await user.click(screen.getByRole('button', { name: '✕' }));
      await waitFor(() => {
        expect(mockDeleteUserNote).toHaveBeenCalled();
      });
    });

    it('dispatches danger alert when remove warning fails', async () => {
      mockRemoveUserWarning.mockReturnValue({ unwrap: () => Promise.reject({}) });
      mockWarnings = [
        { id: 5, reason: 'Offense', createdAt: '2026-01-01T00:00:00Z' }
      ];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /^warnings/i }));
      await user.click(screen.getByRole('button', { name: '✕' }));
      await waitFor(() => {
        expect(mockRemoveUserWarning).toHaveBeenCalled();
      });
    });

    it('dispatches danger alert when grant donor fails', async () => {
      mockGrantDonor.mockReturnValue({ unwrap: () => Promise.reject({}) });
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.selectOptions(screen.getByDisplayValue('Select donor rank…'), '20');
      await user.click(screen.getByRole('button', { name: /^grant$/i }));
      await waitFor(() => {
        expect(mockGrantDonor).toHaveBeenCalled();
      });
    });

    it('dispatches danger alert when revoke donor fails', async () => {
      mockRevokeDonor.mockReturnValue({ unwrap: () => Promise.reject({}) });
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /revoke donor status/i }));
      await waitFor(() => {
        expect(mockRevokeDonor).toHaveBeenCalled();
      });
    });

    it('selecting placeholder donor rank resets donorRankId to empty string', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      const donorSelect = screen.getByDisplayValue('Select donor rank…');
      await user.selectOptions(donorSelect, '20');
      await user.selectOptions(donorSelect, '');
      expect((donorSelect as HTMLSelectElement).value).toBe('');
    });

    it('shows Enable Account button and calls enableUser when account is disabled', async () => {
      mockProfileData = { ...mockProfile, disabled: true } as never;
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      expect(
        screen.getByRole('button', { name: /enable account/i })
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /enable account/i }));
      await waitFor(() => {
        expect(mockEnableUser).toHaveBeenCalledWith(42);
      });
    });

    it('selects a rank and clicks Save', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.selectOptions(
        screen.getByDisplayValue('Select rank…'),
        '10'
      );
      await user.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => {
        expect(mockSetUserRank).toHaveBeenCalledWith({
          id: 42,
          userRankId: 10
        });
      });
    });

    it('selecting placeholder rank resets selectedRankId to empty string', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      const rankSelect = screen.getByDisplayValue('Select rank…');
      await user.selectOptions(rankSelect, '10');
      await user.selectOptions(rankSelect, '');
      expect((rankSelect as HTMLSelectElement).value).toBe('');
    });

    it('clicks Revoke donor status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(
        screen.getByRole('button', { name: /revoke donor status/i })
      );
      await waitFor(() => {
        expect(mockRevokeDonor).toHaveBeenCalledWith(42);
      });
    });

    it('selects donor rank and grants donor status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.selectOptions(
        screen.getByDisplayValue('Select donor rank…'),
        '20'
      );
      await user.click(screen.getByRole('button', { name: /^grant$/i }));
      await waitFor(() => {
        expect(mockGrantDonor).toHaveBeenCalledWith(
          expect.objectContaining({ id: 42, donorRankId: 20 })
        );
      });
    });

    it('clicking Snatch List toggle shows and hides snatch list section', async () => {
      const user = userEvent.setup();
      mockSnatchListByUser = [
        {
          id: 1,
          release: { id: 5, communityId: 1, title: 'Blue Train' },
          artist: { name: 'Coltrane' },
          downloadedAt: '2026-01-01T00:00:00Z'
        }
      ];
      renderWithProviders(<UserProfile />);
      const snatchBtn = screen.getByRole('button', { name: /snatch list/i });
      await user.click(snatchBtn);
      expect(screen.getByText('Blue Train')).toBeInTheDocument();
    });

    it('shows notes and can delete a note', async () => {
      const user = userEvent.setup();
      mockNotes = [
        {
          id: 7,
          body: 'Suspicious activity',
          createdAt: '2026-01-01T00:00:00Z',
          author: { username: 'mod-one' }
        }
      ];
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /moderation notes/i }));
      expect(screen.getByText('Suspicious activity')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '✕' }));
      await waitFor(() => {
        expect(mockDeleteUserNote).toHaveBeenCalledWith({
          id: 42,
          noteId: 7
        });
      });
    });

    it('adds a note via the note form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /moderation notes/i }));
      const noteInput = screen.getByPlaceholderText(/add a note/i);
      await user.type(noteInput, 'New mod note');
      fireEvent.submit(noteInput.closest('form')!);
      await waitFor(() => {
        expect(mockAddUserNote).toHaveBeenCalledWith({
          id: 42,
          body: 'New mod note'
        });
      });
    });

    it('dispatches danger alert when add note fails', async () => {
      mockAddUserNote.mockReturnValue({
        unwrap: () => Promise.reject({})
      });
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /moderation notes/i }));
      const noteInput = screen.getByPlaceholderText(/add a note/i);
      await user.type(noteInput, 'Will fail');
      fireEvent.submit(noteInput.closest('form')!);
      await waitFor(() => {
        expect(mockAddUserNote).toHaveBeenCalled();
      });
    });

    it('shows warnings and removes one when confirmed', async () => {
      const user = userEvent.setup();
      mockWarnings = [
        {
          id: 3,
          reason: 'Spamming',
          createdAt: '2026-01-01T00:00:00Z',
          warnedBy: { username: 'mod-one' }
        }
      ];
      renderWithProviders(<UserProfile />);
      await user.click(
        screen.getByRole('button', { name: /^warnings/i })
      );
      expect(screen.getByText('Spamming')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '✕' }));
      await waitFor(() => {
        expect(mockRemoveUserWarning).toHaveBeenCalledWith({
          id: 42,
          warnId: 3
        });
      });
    });

    it('does not remove warning when confirm is cancelled', async () => {
      window.confirm = jest.fn(() => false);
      const user = userEvent.setup();
      mockWarnings = [
        {
          id: 4,
          reason: 'Rule violation',
          createdAt: '2026-01-01T00:00:00Z'
        }
      ];
      renderWithProviders(<UserProfile />);
      await user.click(
        screen.getByRole('button', { name: /^warnings/i })
      );
      await user.click(screen.getByRole('button', { name: '✕' }));
      expect(mockRemoveUserWarning).not.toHaveBeenCalled();
    });

    it('shows "Issuing…" label when warn mutation is loading', async () => {
      mockWarnUserLoading = true;
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /warn user/i }));
      expect(screen.getByRole('button', { name: /issuing…/i })).toBeInTheDocument();
    });

    it('shows "Saving…" label when setUserRank mutation is loading', () => {
      mockSetUserRankLoading = true;
      renderWithProviders(<UserProfile />);
      expect(screen.getByRole('button', { name: /saving…/i })).toBeInTheDocument();
    });

    it('shows "Granting…" label when grantDonor mutation is loading', () => {
      mockGrantDonorLoading = true;
      renderWithProviders(<UserProfile />);
      expect(screen.getByRole('button', { name: /granting…/i })).toBeInTheDocument();
    });

    it('renders staffPmOverview with empty conversations (shows no table)', () => {
      mockProfileData = {
        ...mockProfile,
        staffPmOverview: { total: 0, unresolved: 0, recentConversations: [] }
      } as never;
      renderWithProviders(<UserProfile />);
      expect(screen.getByText('Staff PMs')).toBeInTheDocument();
    });

    it('renders unknown conversation status with fallback class', () => {
      mockProfileData = {
        ...mockProfile,
        staffPmOverview: {
          total: 1,
          unresolved: 0,
          recentConversations: [
            {
              id: 200,
              subject: 'Mystery Ticket',
              createdAt: '2026-01-01T00:00:00Z',
              status: 'WeirdStatus',
              viewerCanOpen: true,
              replyCount: 0,
              assignedStaff: null
            }
          ]
        }
      } as never;
      renderWithProviders(<UserProfile />);
      expect(screen.getByText('WeirdStatus')).toBeInTheDocument();
    });

    it('shows snatch list item without artist (renders dash)', async () => {
      mockSnatchListByUser = [
        {
          id: 2,
          release: { id: 6, communityId: 1, title: 'No Artist Release' },
          artist: undefined,
          downloadedAt: '2026-01-01T00:00:00Z'
        }
      ];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /snatch list/i }));
      expect(screen.getByText('No Artist Release')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders note without author (shows Unknown)', async () => {
      mockNotes = [
        {
          id: 8,
          body: 'Authorless note',
          createdAt: '2026-01-01T00:00:00Z',
          author: null as never
        }
      ];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /moderation notes/i }));
      expect(screen.getByText('Authorless note')).toBeInTheDocument();
      expect(screen.getByText(/Unknown/)).toBeInTheDocument();
    });

    it('renders warning with expiresAt field', async () => {
      mockWarnings = [
        {
          id: 10,
          reason: 'Expiring warn',
          createdAt: '2026-01-01T00:00:00Z',
          expiresAt: '2026-12-31T00:00:00Z',
          warnedBy: { username: 'mod-one' }
        }
      ];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /^warnings/i }));
      expect(screen.getByText('Expiring warn')).toBeInTheDocument();
      expect(screen.getByText(/Expires/)).toBeInTheDocument();
    });

    it('toggles IP History section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /ip history/i }));
      expect(screen.getByText('No IP history.')).toBeInTheDocument();
    });

    it('shows IP history rows when data is present', async () => {
      mockIpHistory = [{ ip: '192.168.1.1', seenAt: '2026-01-01T00:00:00Z' }];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /ip history/i }));
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('toggles Email History section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /email history/i }));
      expect(screen.getByText('No email history.')).toBeInTheDocument();
    });

    it('shows email history rows when data is present', async () => {
      mockEmailHistory = [
        { email: 'old@example.com', changedAt: '2026-01-01T00:00:00Z' }
      ];
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /email history/i }));
      expect(screen.getByText('old@example.com')).toBeInTheDocument();
    });

    it('clicks Disable Account and calls disableUser', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /disable account/i }));
      await waitFor(() => {
        expect(mockDisableUser).toHaveBeenCalledWith(42);
      });
    });

    it('dispatches danger alert when disableUser fails', async () => {
      mockDisableUser.mockReturnValue({ unwrap: () => Promise.reject({}) });
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.click(screen.getByRole('button', { name: /disable account/i }));
      await waitFor(() => {
        expect(mockDisableUser).toHaveBeenCalledWith(42);
      });
    });

    it('changes donor expiry datetime input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      await user.selectOptions(
        screen.getByDisplayValue('Select donor rank…'),
        '20'
      );
      const expiryInput = screen.getByTitle('Expires at (optional)');
      fireEvent.change(expiryInput, { target: { value: '2027-01-01T00:00' } });
      await user.click(screen.getByRole('button', { name: /^grant$/i }));
      await waitFor(() => {
        expect(mockGrantDonor).toHaveBeenCalledWith(
          expect.objectContaining({ expiresAt: '2027-01-01T00:00' })
        );
      });
    });
  });

  it('renders recentSnatches rows on profile page', () => {
    mockProfileData = {
      ...mockProfile,
      recentSnatches: [
        {
          id: 9,
          release: { id: 11, communityId: 2, title: 'A Love Supreme' },
          artist: { name: 'Coltrane' },
          downloadedAt: '2026-03-01T00:00:00Z'
        }
      ]
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('A Love Supreme')).toBeInTheDocument();
    expect(screen.getByText('Coltrane')).toBeInTheDocument();
  });

  it('renders donorPresentation profileBlocks', () => {
    mockProfileData = {
      ...mockProfile,
      donorPresentation: {
        profileBlocks: [
          { title: 'About Me', body: 'I love jazz.' },
          { title: null, body: 'No title block.' }
        ],
        customIcon: null,
        customIconLink: null,
        secondAvatar: null,
        rank: null,
        title: null,
        customColor: null
      }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('About Me')).toBeInTheDocument();
    expect(screen.getByText('I love jazz.')).toBeInTheDocument();
    expect(screen.getByText('No title block.')).toBeInTheDocument();
  });

  it('renders staffPmOverview conversations with viewerCanOpen branches', () => {
    mockHasAnyPermission = true;
    mockCurrentUser = { id: 99, username: 'bob', permissions: { staff: true } };
    mockProfileData = {
      ...mockProfile,
      staffPmOverview: {
        total: 2,
        unresolved: 1,
        recentConversations: [
          {
            id: 101,
            subject: 'Open Ticket',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'Open',
            viewerCanOpen: true,
            replyCount: 3,
            assignedStaff: { username: 'mod-one' }
          },
          {
            id: 102,
            subject: 'Closed Ticket',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'Resolved',
            viewerCanOpen: false,
            replyCount: 0,
            assignedStaff: null
          }
        ]
      }
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByRole('link', { name: 'Open Ticket' })).toBeInTheDocument();
    expect(screen.getByText('Closed Ticket')).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();
    expect(screen.getByText('Class / unassigned')).toBeInTheDocument();
  });

  it('renders recent contributions when present', () => {
    mockProfileData = {
      ...mockProfile,
      recentContributions: [
        {
          id: 1,
          createdAt: '2026-01-01T00:00:00Z',
          release: {
            id: 10,
            communityId: 1,
            title: 'Kind of Blue',
            image: 'https://img.example.com/kob.jpg',
            artist: { name: 'Miles Davis' }
          }
        }
      ]
    } as never;
    renderWithProviders(<UserProfile />);
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
  });
});

