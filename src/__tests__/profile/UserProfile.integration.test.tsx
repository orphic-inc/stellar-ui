import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from '../../components/profile/UserProfile';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders, createTestStore } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';

// Keep child components that aren't the focus of these tests lightweight
jest.mock('dompurify', () => ({ sanitize: (html: string) => html }));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

jest.mock('../../components/profile/RatioStats', () => ({
  __esModule: true,
  default: () => <div data-testid="ratio-stats" />
}));

jest.mock('../../components/layout/UserBadges', () => ({
  __esModule: true,
  default: () => null
}));

// useParams requires a Route match — mock it so the component always sees id='42'
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '42' })
}));

// ── auth user fixtures ────────────────────────────────────────────────────────

const REGULAR_USER = {
  id: 99,
  username: 'bob',
  userRank: { name: 'Member', level: 100, permissions: {} }
};

const STAFF_USER = {
  id: 99,
  username: 'staffmod',
  userRank: { name: 'Staff', level: 800, permissions: { staff: true } }
};

// ── profile fixture factory ───────────────────────────────────────────────────

const makeProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 42,
  username: 'alice',
  email: null,
  profile: null,
  avatar: null,
  userRank: { name: 'Elite', color: '#ff0', level: 100 },
  inviteCount: 3,
  dateRegistered: '2020-01-01T00:00:00Z',
  lastSeen: '2024-01-01T00:00:00Z',
  stats: {
    contributed: '1000000000',
    consumed: '500000000',
    ratio: '2.00',
    buffer: '500000000'
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
  recentSnatches: [],
  ...overrides
});

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  profile?: ReturnType<typeof makeProfile>;
  profileStatus?: number;
  ipHistory?: Array<{ ip: string; seenAt: string }>;
  emailHistory?: Array<{ email: string; changedAt: string }>;
  notes?: Array<{
    id: number;
    body: string;
    createdAt: string;
    author: { id: number; username: string } | null;
  }>;
  warnings?: Array<{
    id: number;
    reason: string;
    expiresAt: string | null;
    createdAt: string;
    warnedBy: { username: string } | null;
  }>;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const {
    profile = makeProfile(),
    profileStatus = 200,
    ipHistory = [],
    emailHistory = [],
    notes = [],
    warnings = []
  } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');
    const { pathname, method } = {
      pathname: url.pathname,
      method: request.method
    };

    if (pathname === '/api/auth')
      return Promise.resolve(makeResponse({ body: REGULAR_USER }));
    if (pathname === `/api/profile/user/42`)
      return Promise.resolve(
        makeResponse({
          status: profileStatus,
          body: profileStatus === 200 ? profile : { msg: 'Not found' }
        })
      );
    if (pathname === '/api/tools/user-ranks')
      return Promise.resolve(
        makeResponse({
          body: [
            { id: 1, name: 'Member' },
            { id: 2, name: 'Elite' }
          ]
        })
      );
    if (pathname === '/api/users/donor-ranks')
      return Promise.resolve(
        makeResponse({ body: [{ id: 1, name: 'Bronze', badge: '🥉' }] })
      );
    if (pathname === `/api/users/42/ip-history`)
      return Promise.resolve(makeResponse({ body: ipHistory }));
    if (pathname === `/api/users/42/email-history`)
      return Promise.resolve(makeResponse({ body: emailHistory }));
    if (pathname === `/api/users/42/notes` && method === 'GET')
      return Promise.resolve(makeResponse({ body: notes }));
    if (pathname.match(/^\/api\/users\/42\/notes\/\d+$/) && method === 'DELETE')
      return Promise.resolve(makeResponse({ status: 204, body: undefined }));
    if (pathname === `/api/users/42/warnings` && method === 'GET')
      return Promise.resolve(makeResponse({ body: warnings }));
    if (
      pathname.match(/^\/api\/users\/42\/warnings\/\d+$/) &&
      method === 'DELETE'
    )
      return Promise.resolve(makeResponse({ status: 204, body: undefined }));
    if (pathname === `/api/users/42/warn` && method === 'POST')
      return Promise.resolve(
        makeResponse({ body: { msg: 'Warning issued.' } })
      );
    if (pathname === `/api/users/42/disable`)
      return Promise.resolve(
        makeResponse({ body: { msg: 'Account disabled.' } })
      );
    if (pathname === `/api/users/42/enable`)
      return Promise.resolve(
        makeResponse({ body: { msg: 'Account enabled.' } })
      );
    if (pathname === `/api/users/42/snatch-list`)
      return Promise.resolve(makeResponse({ body: [] }));
    if (pathname === '/api/users/me/snatch-list')
      return Promise.resolve(makeResponse({ body: [] }));
    if (pathname === `/api/friends/status/42`)
      return Promise.resolve(makeResponse({ body: { isFriend: false } }));

    return Promise.resolve(
      makeResponse({
        status: 404,
        body: { msg: `Unhandled: ${method} ${pathname}` }
      })
    );
  });
};

// ── render helper ─────────────────────────────────────────────────────────────

const renderAs = (authUser: typeof REGULAR_USER | typeof STAFF_USER) => {
  const store = createTestStore();
  store.dispatch(setCredentials(authUser as never));
  renderWithProviders(<UserProfile />, { store });
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('UserProfile RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders username, rank, and activity summary from the profile API', async () => {
    setupFetch({ profile: makeProfile() });
    renderAs(REGULAR_USER);

    expect(
      await screen.findByRole('heading', { name: 'alice' })
    ).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // contributions
    expect(screen.getByText(/80th percentile/i)).toBeInTheDocument();
  });

  it('shows the profile bio when profileInfo is present', async () => {
    setupFetch({
      profile: makeProfile({
        profile: {
          profileTitle: 'Jazz Fan',
          profileInfo: '<p>Hello from alice!</p>',
          avatar: null
        }
      })
    });
    renderAs(REGULAR_USER);

    expect(await screen.findByText('Hello from alice!')).toBeInTheDocument();
    expect(screen.getByText('Jazz Fan')).toBeInTheDocument();
  });

  it('shows email in sidebar when the API response includes it', async () => {
    setupFetch({ profile: makeProfile({ email: 'alice@example.com' }) });
    renderAs(REGULAR_USER);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
  });

  it('shows "Donor ♥" and transfer stats for a donor profile', async () => {
    setupFetch({ profile: makeProfile({ isDonor: true }) });
    renderAs(REGULAR_USER);

    expect(await screen.findByText(/donor ♥/i)).toBeInTheDocument();
  });

  it('renders the donor presentation section when donorPresentation is set', async () => {
    setupFetch({
      profile: makeProfile({
        isDonor: true,
        donorPresentation: {
          rank: {
            name: 'Gold',
            badge: '🥇',
            color: '#FFD700',
            grantedAt: '2024-01-01T00:00:00Z',
            expiresAt: null
          },
          customIcon: null,
          customIconLink: null,
          secondAvatar: null,
          profileBlocks: [{ title: 'Favourite Albums', body: 'Kind of Blue' }]
        }
      })
    });
    renderAs(REGULAR_USER);

    expect(await screen.findByText('Donor Presentation')).toBeInTheDocument();
    expect(screen.getByText('🥇 Gold')).toBeInTheDocument();
    expect(screen.getByText('Favourite Albums')).toBeInTheDocument();
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
  });

  it('renders staffPmOverview with total, unresolved count, and conversation rows', async () => {
    setupFetch({
      profile: makeProfile({
        staffPmOverview: {
          total: 5,
          unresolved: 2,
          recentConversations: [
            {
              id: 101,
              subject: 'Ticket subject',
              createdAt: '2024-03-01T00:00:00Z',
              assignedStaff: { username: 'modperson' },
              replyCount: 3,
              status: 'Open',
              viewerCanOpen: true
            }
          ]
        }
      })
    });
    renderAs(STAFF_USER);

    expect(await screen.findByText('Staff PMs')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // total
    expect(screen.getByText('2')).toBeInTheDocument(); // unresolved
    expect(
      screen.getByRole('link', { name: 'Ticket subject' })
    ).toHaveAttribute('href', '/private/messages/tickets/101');
    expect(screen.getByText('modperson')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows "No staff PMs" when recentConversations is empty', async () => {
    setupFetch({
      profile: makeProfile({
        staffPmOverview: {
          total: 0,
          unresolved: 0,
          recentConversations: []
        }
      })
    });
    renderAs(STAFF_USER);

    expect(
      await screen.findByText(/no staff pms for this user/i)
    ).toBeInTheDocument();
  });

  it('renders featured collage shelves and public collages from profile data', async () => {
    setupFetch({
      profile: makeProfile({
        collageShelves: {
          featuredPersonalCollages: [
            {
              id: 10,
              name: 'My Jazz Collection',
              numEntries: 12,
              coverImages: []
            }
          ],
          publicCollages: [
            {
              id: 20,
              name: 'Public Picks',
              numEntries: 5,
              categoryId: 0,
              coverImages: [],
              updatedAt: '2024-01-01T00:00:00Z'
            }
          ]
        }
      })
    });
    renderAs(REGULAR_USER);

    expect(await screen.findByText('Featured Shelves')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /my jazz collection/i })
    ).toHaveAttribute('href', '/private/collages/10');

    expect(screen.getByText('Public Collages')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /public picks/i })
    ).toBeInTheDocument();
  });

  it('renders recent contributions grid when data is present', async () => {
    setupFetch({
      profile: makeProfile({
        recentContributions: [
          {
            id: 1,
            createdAt: '2024-01-10T00:00:00Z',
            release: {
              id: 5,
              title: 'Kind of Blue',
              communityId: 2,
              image: null,
              artist: { id: 3, name: 'Miles Davis' }
            }
          }
        ]
      })
    });
    renderAs(REGULAR_USER);

    expect(await screen.findByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /kind of blue/i })).toHaveAttribute(
      'href',
      '/private/communities/2/releases/5'
    );
  });

  it('shows recent snatches section when snatches are present', async () => {
    setupFetch({
      profile: makeProfile({
        recentSnatches: [
          {
            id: 9,
            downloadedAt: '2024-02-01T00:00:00Z',
            release: { id: 7, title: 'A Love Supreme', communityId: 3 },
            artist: { name: 'John Coltrane' }
          }
        ]
      })
    });
    renderAs(REGULAR_USER);

    expect(await screen.findByText('Recent Snatches')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'A Love Supreme' })
    ).toHaveAttribute('href', '/private/communities/3/releases/7');
    expect(screen.getByText('John Coltrane')).toBeInTheDocument();
  });

  it('shows the Staff Actions panel for a staff user viewing another profile', async () => {
    setupFetch();
    renderAs(STAFF_USER);

    expect(await screen.findByText('Staff Actions')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /warn user/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /disable account/i })
    ).toBeInTheDocument();
  });

  it('shows Enable Account when the profile is already disabled', async () => {
    setupFetch({ profile: makeProfile({ disabled: true }) });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    expect(
      screen.getByRole('button', { name: /enable account/i })
    ).toBeInTheDocument();
  });

  it('opens the WarnModal and submits a warn mutation', async () => {
    const user = userEvent.setup();
    setupFetch();
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');

    await user.click(screen.getByRole('button', { name: /warn user/i }));
    expect(
      screen.getByRole('heading', { name: /warn user/i })
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/reason/i), 'Rule violation');
    await user.click(screen.getByRole('button', { name: /issue warning/i }));

    await waitFor(() => {
      const warnReqs = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter(
          (req) =>
            new URL(req.url, 'http://localhost').pathname ===
              '/api/users/42/warn' && req.method === 'POST'
        );
      expect(warnReqs.length).toBe(1);
    });
  });

  it('expands IP history and shows fetched IP rows', async () => {
    const user = userEvent.setup();
    setupFetch({
      ipHistory: [{ ip: '192.168.1.1', seenAt: '2024-01-01T00:00:00Z' }]
    });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');

    // The IP History toggle section should be visible
    await user.click(screen.getByRole('button', { name: /ip history/i }));

    expect(await screen.findByText('192.168.1.1')).toBeInTheDocument();
  });

  it('clicks Disable Account and sends the disable request', async () => {
    const user = userEvent.setup();
    setupFetch({ profile: makeProfile({ disabled: false }) });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    await user.click(screen.getByRole('button', { name: /disable account/i }));

    await waitFor(() => {
      const disableReqs = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter(
          (req) =>
            new URL(req.url, 'http://localhost').pathname ===
            '/api/users/42/disable'
        );
      expect(disableReqs.length).toBe(1);
    });
  });

  it('clicks Enable Account and sends the enable request', async () => {
    const user = userEvent.setup();
    setupFetch({ profile: makeProfile({ disabled: true }) });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    await user.click(screen.getByRole('button', { name: /enable account/i }));

    await waitFor(() => {
      const enableReqs = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter(
          (req) =>
            new URL(req.url, 'http://localhost').pathname ===
            '/api/users/42/enable'
        );
      expect(enableReqs.length).toBe(1);
    });
  });

  it('expands Email History and shows email rows', async () => {
    const user = userEvent.setup();
    setupFetch({
      emailHistory: [
        { email: 'old@example.com', changedAt: '2024-01-01T00:00:00Z' }
      ]
    });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    await user.click(screen.getByRole('button', { name: /email history/i }));

    expect(await screen.findByText('old@example.com')).toBeInTheDocument();
  });

  it('expands Warnings section and shows existing warnings', async () => {
    const user = userEvent.setup();
    setupFetch({
      warnings: [
        {
          id: 10,
          reason: 'Spamming',
          expiresAt: null,
          createdAt: '2024-02-01T00:00:00Z',
          warnedBy: { username: 'mod-alice' }
        }
      ]
    });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    await user.click(screen.getByRole('button', { name: /warnings/i }));

    expect(await screen.findByText('Spamming')).toBeInTheDocument();
    expect(screen.getByText(/mod-alice/)).toBeInTheDocument();
  });

  it('deletes a moderation note when × is clicked', async () => {
    const user = userEvent.setup();
    setupFetch({
      notes: [
        {
          id: 5,
          body: 'Watch this user',
          createdAt: '2024-03-01T00:00:00Z',
          author: { id: 99, username: 'staffmod' }
        }
      ]
    });
    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    await user.click(screen.getByRole('button', { name: /moderation notes/i }));
    await screen.findByText('Watch this user');

    await user.click(screen.getByRole('button', { name: '✕' }));

    await waitFor(() => {
      const deleteReqs = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter(
          (req) =>
            new URL(req.url, 'http://localhost').pathname ===
              '/api/users/42/notes/5' && req.method === 'DELETE'
        );
      expect(deleteReqs.length).toBe(1);
    });
  });

  it('expands Moderation Notes and adds a note via the form', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementation((request: Request) => {
      const url = new URL(request.url, 'http://localhost');
      const { pathname, method } = {
        pathname: url.pathname,
        method: request.method
      };

      if (pathname === '/api/auth')
        return Promise.resolve(makeResponse({ body: STAFF_USER }));
      if (pathname === '/api/profile/user/42')
        return Promise.resolve(makeResponse({ body: makeProfile() }));
      if (pathname === '/api/tools/user-ranks')
        return Promise.resolve(makeResponse({ body: [] }));
      if (pathname === '/api/users/donor-ranks')
        return Promise.resolve(makeResponse({ body: [] }));
      if (pathname === '/api/users/42/notes') {
        if (method === 'POST')
          return Promise.resolve(
            makeResponse({ body: { msg: 'Note added.' } })
          );
        return Promise.resolve(makeResponse({ body: [] }));
      }
      if (pathname === '/api/users/42/snatch-list')
        return Promise.resolve(makeResponse({ body: [] }));

      return Promise.resolve(makeResponse({ status: 404, body: {} }));
    });

    renderAs(STAFF_USER);

    await screen.findByText('Staff Actions');
    await user.click(screen.getByRole('button', { name: /moderation notes/i }));

    const noteInput = await screen.findByPlaceholderText(/add a note/i);
    await user.type(noteInput, 'Watch this user');

    const addBtn = screen.getByRole('button', { name: /^add$/i });
    await user.click(addBtn);

    await waitFor(() => {
      const notePostReqs = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter(
          (req) =>
            new URL(req.url, 'http://localhost').pathname ===
              '/api/users/42/notes' && req.method === 'POST'
        );
      expect(notePostReqs.length).toBe(1);
    });
  });
});
