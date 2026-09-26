import React from 'react';
import { screen } from '@testing-library/react';
import { createTestStore, renderWithProviders } from '../testUtils';
import PrivateLayout from '../../components/pages/private/layout/PrivateLayout';
import { setCredentials } from '../../store/slices/authSlice';

const mockUseGetMeQuery = jest.fn();

// Arguments are forwarded, not discarded: the layout's polling option is part
// of the contract here (#345), and a mock that swallowed it would let the poll
// be deleted with every test still green.
jest.mock('../../store/services/authApi', () => ({
  useGetMeQuery: (...args: unknown[]) => mockUseGetMeQuery(...args)
}));

jest.mock('../../components/pages/private/layout/PrivateHeader', () => ({
  __esModule: true,
  default: ({ user }: { user: { username: string } }) => (
    <div data-testid="private-header">{user.username}</div>
  )
}));

jest.mock('../../components/pages/private/layout/PrivateFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="private-footer">Footer</div>
}));

jest.mock('../../components/layout/NotificationCorner', () => ({
  __esModule: true,
  default: () => <div data-testid="notification-corner">Notifications</div>
}));

// These shell children each fire their own RTK Query on mount; stub them so the
// layout test doesn't issue real fetches (no jsdom Request → no unhandled-
// rejection / act() noise). Neither is asserted by these tests.
jest.mock('../../components/layout/StylesheetInjector', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../components/layout/GlobalNoticeBanner', () => ({
  __esModule: true,
  default: () => null
}));

describe('PrivateLayout', () => {
  beforeEach(() => {
    mockUseGetMeQuery.mockReset();
  });

  it('shows a spinner while auth state is unresolved', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: true,
      isUninitialized: false,
      isError: false,
      data: undefined
    });

    const { container } = renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>
    );

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: false,
      isUninitialized: false,
      isError: true,
      data: undefined
    });

    renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>,
      { initialEntries: ['/messages'] }
    );

    expect(window.location.pathname).not.toBe('/messages');
  });

  it('renders the authenticated layout shell', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: false,
      isUninitialized: false,
      isError: false,
      data: { username: 'kai' }
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'kai',
        email: 'kai@example.com',
        avatar: null,
        canDownload: true,
        contributed: '0',
        consumed: '0',
        ratio: 1,
        userRank: {
          name: 'User',
          level: 100,
          color: 'gray',
          permissions: {},
          notificationFilterLimit: null
        }
      })
    );

    const { container } = renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>,
      { store }
    );

    expect(screen.getByTestId('private-header')).toHaveTextContent('kai');
    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.getByTestId('private-footer')).toBeInTheDocument();
    expect(screen.getByTestId('notification-corner')).toBeInTheDocument();
    // the shell root paints from the surface token (data-st contract)
    expect(container.querySelector('[class*="st-base"]')).not.toBeNull();
  });

  /**
   * The ratio policy banner (#345), asserted through the LAYOUT with the real
   * component — deliberately not following this file's mock-the-child
   * convention.
   *
   * Mocking it would prove the element is in the tree but not that
   * `user.ratioPolicy` reaches it, and with a presentational banner fed by a
   * prop that mis-wiring is the likeliest bug. #334 exists because a component
   * with a full green spec went unmounted for four months, and #346 deleted a
   * `jest.mock` that had been asserting nothing for just as long.
   */
  describe('the ratio policy banner is mounted and wired', () => {
    const DAY_MS = 86400000;
    // An hour of slack: `untilTime` floors to whole days, so an exact
    // `now + 2 days` reads as "in 1 day" by the time it renders.
    const inDays = (n: number) =>
      new Date(Date.now() + n * DAY_MS + 3600000).toISOString();

    const signIn = (over: {
      canDownload?: boolean;
      ratioPolicy?: {
        status: 'OK' | 'WATCH' | 'DOWNLOAD_DISABLED';
        watchExpiresAt: string | null;
        disabledCause: 'RATIO' | 'STAFF' | null;
      } | null;
    }) => {
      mockUseGetMeQuery.mockReturnValue({
        isLoading: false,
        isUninitialized: false,
        isError: false,
        data: { username: 'kai' }
      });
      const store = createTestStore();
      store.dispatch(
        setCredentials({
          id: 7,
          username: 'kai',
          email: 'kai@example.com',
          avatar: null,
          canDownload: true,
          contributed: '0',
          consumed: '0',
          ratio: 1,
          userRank: {
            name: 'User',
            level: 100,
            color: 'gray',
            permissions: {},
            notificationFilterLimit: null
          },
          ...over
        })
      );
      return renderWithProviders(
        <PrivateLayout>
          <div>Child content</div>
        </PrivateLayout>,
        { store }
      );
    };

    it('subscribes to the session with a poll', () => {
      // Three of the four things that move ratio policy are not member actions
      // — the daily sweep, a staff override, and the api's own post-response
      // evaluation of a download. Invalidation sees none of them reliably, so
      // without this a swept or staff-disabled member sees nothing until they
      // reload. Asserted because a deleted poll is otherwise invisible: every
      // other test in this file passes without it.
      signIn({ ratioPolicy: null });

      expect(mockUseGetMeQuery).toHaveBeenCalledWith(undefined, {
        pollingInterval: 15 * 60 * 1000
      });
    });

    it('renders the watch banner from the session', () => {
      signIn({
        ratioPolicy: {
          status: 'WATCH',
          watchExpiresAt: inDays(2),
          disabledCause: null
        }
      });

      const banner = screen.getByText(/Ratio watch\./).closest('div')!;
      expect(banner).toHaveTextContent('Your watch ends in 2 days');
      expect(banner).toHaveTextContent('download 10 GiB or more before it is');
      // A banner is an interrupt, not a report: no arithmetic.
      expect(banner).not.toHaveTextContent('Your ratio is');
    });

    it('renders the disabled banner, keyed on canDownload', () => {
      signIn({
        canDownload: false,
        ratioPolicy: {
          status: 'DOWNLOAD_DISABLED',
          watchExpiresAt: null,
          disabledCause: 'RATIO'
        }
      });

      expect(
        screen.getByText(/come back automatically once your ratio meets it/)
      ).toBeInTheDocument();
    });

    it('explains a disable the ratio domain does not own', () => {
      // `canDownload` is documented as NOT a projection of ratio, with future
      // writers expected to gate it. Such a member must still be told why their
      // downloads stopped, even though the policy has nothing specific to say.
      signIn({ canDownload: false, ratioPolicy: null });

      const banner = screen.getByText(/Downloads disabled\./).closest('div')!;
      expect(banner).toHaveTextContent('Contact staff through Staff PM');
      expect(banner).not.toHaveTextContent('Your ratio fell short');
    });

    it('prefers the disable when a watched member also cannot download', () => {
      signIn({
        canDownload: false,
        ratioPolicy: {
          status: 'WATCH',
          watchExpiresAt: inDays(2),
          disabledCause: null
        }
      });

      expect(screen.getByText(/Downloads disabled\./)).toBeInTheDocument();
      expect(screen.queryByText(/Ratio watch\./)).not.toBeInTheDocument();
    });

    it('renders nothing for a member in good standing', () => {
      signIn({
        ratioPolicy: { status: 'OK', watchExpiresAt: null, disabledCause: null }
      });

      expect(screen.queryByText(/Ratio watch\./)).not.toBeInTheDocument();
      expect(screen.queryByText(/Downloads disabled/)).not.toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders nothing when the session carries no policy at all', () => {
      // An api too old to send the field, or a member with no row.
      signIn({ ratioPolicy: null });

      expect(screen.queryByText(/Ratio watch\./)).not.toBeInTheDocument();
      expect(screen.queryByText(/Downloads disabled/)).not.toBeInTheDocument();
    });
  });

  it('redirects after logout even when getMe still has cached user data', () => {
    mockUseGetMeQuery.mockReturnValue({
      isLoading: false,
      isUninitialized: false,
      isError: false,
      data: { username: 'stale-user' }
    });

    renderWithProviders(
      <PrivateLayout>
        <div>Child content</div>
      </PrivateLayout>,
      { initialEntries: ['/forums'] }
    );

    expect(window.location.pathname).not.toBe('/forums');
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });
});
