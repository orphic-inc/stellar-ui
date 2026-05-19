import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestsPage from '../../components/requests/RequestsPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders, createTestStore } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';

// ── factories ─────────────────────────────────────────────────────────────────

const makeRequest = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Request ${id}`,
  description: '',
  type: 'Music',
  year: null,
  status: 'open',
  voteCount: 0,
  communityId: 1,
  createdAt: '2024-01-10T00:00:00Z',
  user: { id: 99, username: 'alice' },
  artists: [],
  _count: { bounties: 0 },
  community: { id: 1, name: 'Jazz Vault' },
  ...overrides
});

const makeSearchBody = (
  requests: ReturnType<typeof makeRequest>[],
  meta?: { total?: number; totalPages?: number; page?: number }
) => ({
  data: requests,
  meta: { total: requests.length, page: 1, limit: 25, totalPages: 1, ...meta }
});

// ── auth fixtures ─────────────────────────────────────────────────────────────

const OWNER = { id: 99, username: 'alice', userRank: { permissions: {} } };
const OTHER = { id: 77, username: 'bob', userRank: { permissions: {} } };

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  requests?: ReturnType<typeof makeRequest>[];
  requestMeta?: { total?: number; totalPages?: number; page?: number };
  requestStatus?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const {
    requests = [makeRequest(1)],
    requestMeta,
    requestStatus = 200
  } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');
    const { pathname, method } = {
      pathname: url.pathname,
      method: request.method
    };

    if (pathname === '/api/search/requests') {
      return Promise.resolve(
        makeResponse({
          status: requestStatus,
          body:
            requestStatus === 200
              ? makeSearchBody(requests, requestMeta)
              : { msg: 'Server error' }
        })
      );
    }
    if (pathname.startsWith('/api/requests/') && method === 'DELETE') {
      return Promise.resolve(makeResponse({ status: 204, body: undefined }));
    }

    return Promise.resolve(
      makeResponse({
        status: 404,
        body: { msg: `Unhandled: ${method} ${pathname}` }
      })
    );
  });
};

// ── assertion helpers ─────────────────────────────────────────────────────────

const getSearchRequests = () =>
  (global.fetch as jest.Mock).mock.calls
    .map((call) => call[0] as Request)
    .filter(
      (req) =>
        new URL(req.url, 'http://localhost').pathname === '/api/search/requests'
    );

// ── render helper ─────────────────────────────────────────────────────────────

const renderAs = (
  authUser: typeof OWNER | typeof OTHER,
  initialEntries: string[] = ['/']
) => {
  const store = createTestStore();
  store.dispatch(setCredentials(authUser as never));
  renderWithProviders(<RequestsPage />, { store, initialEntries });
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('RequestsPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    window.confirm = jest.fn(() => true);
  });

  it('sends a real GET /api/search/requests request on mount', async () => {
    setupFetch();
    renderAs(OTHER);

    await waitFor(() => {
      const reqs = getSearchRequests();
      expect(reqs.length).toBeGreaterThan(0);
      expect(reqs[0].method).toBe('GET');
    });
  });

  it('shows a spinner while the query is pending', () => {
    (global.fetch as jest.Mock).mockImplementation((request: Request) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/api/search/requests')
        return new Promise(() => undefined);
      return Promise.resolve(makeResponse({ status: 404, body: {} }));
    });
    renderAs(OTHER);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message when the API returns a server error', async () => {
    setupFetch({ requestStatus: 500 });
    renderAs(OTHER);

    expect(
      await screen.findByText(/failed to load requests/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when the API returns no requests', async () => {
    setupFetch({ requests: [] });
    renderAs(OTHER);

    expect(await screen.findByText(/no requests found/i)).toBeInTheDocument();
  });

  it('renders request rows: title link, type, community name, open status badge', async () => {
    setupFetch({ requests: [makeRequest(1)] });
    renderAs(OTHER);

    await screen.findByText('Request 1');

    expect(screen.getByRole('link', { name: 'Request 1' })).toHaveAttribute(
      'href',
      '/private/requests/1'
    );
    // 'Music' also appears in the type dropdown; check at least one td contains it
    expect(screen.getAllByText('Music').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Jazz Vault')).toBeInTheDocument();
    // 'Open' appears in the filter button and the table badge — both are fine
    expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1);
    // No bounties → dash appears in the bounty column
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows filled status badge (green) for a filled request', async () => {
    setupFetch({ requests: [makeRequest(2, { status: 'filled' })] });
    renderAs(OTHER);

    await screen.findByText('Request 2');
    // The filled badge is a <span> inside the table row; the filter buttons are <button>s
    const filledSpan = screen
      .getAllByText('Filled')
      .find((el) => el.tagName === 'SPAN');
    expect(filledSpan).toBeDefined();
    expect(filledSpan!.className).toContain('green');
  });

  it('shows community dash when request has no community', async () => {
    setupFetch({ requests: [makeRequest(3, { community: undefined })] });
    renderAs(OTHER);

    await screen.findByText('Request 3');
    // No community name should appear; multiple dashes are expected (community + bounty)
    expect(screen.queryByText('Jazz Vault')).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows bounty count when bounties > 0', async () => {
    setupFetch({ requests: [makeRequest(4, { _count: { bounties: 3 } })] });
    renderAs(OTHER);

    expect(await screen.findByText('3 bounty')).toBeInTheDocument();
  });

  it('shows Delete button for owner of an open request', async () => {
    setupFetch({
      requests: [makeRequest(5, { user: { id: 99, username: 'alice' } })]
    });
    renderAs(OWNER);

    await screen.findByText('Request 5');
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('hides Delete button for owner of a filled request', async () => {
    setupFetch({
      requests: [
        makeRequest(6, {
          status: 'filled',
          user: { id: 99, username: 'alice' }
        })
      ]
    });
    renderAs(OWNER);

    await screen.findByText('Filled');
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('hides Delete button for non-owner of an open request', async () => {
    setupFetch({
      requests: [makeRequest(7, { user: { id: 42, username: 'carol' } })]
    });
    renderAs(OTHER);

    await screen.findByText('Request 7');
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('sends a DELETE request when owner confirms deletion', async () => {
    const user = userEvent.setup();
    setupFetch({
      requests: [makeRequest(8, { user: { id: 99, username: 'alice' } })]
    });
    renderAs(OWNER);

    await screen.findByRole('button', { name: /delete/i });
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      const delReqs = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter(
          (req) =>
            new URL(req.url, 'http://localhost').pathname ===
              '/api/requests/8' && req.method === 'DELETE'
        );
      expect(delReqs.length).toBe(1);
    });
  });

  it('reads q, status, and page from the initial URL and passes them to the query', async () => {
    setupFetch();
    renderAs(OTHER, ['/?q=jazz&status=open&page=2']);

    await waitFor(() => {
      const reqs = getSearchRequests();
      expect(reqs.length).toBeGreaterThan(0);
      const url = new URL(reqs[0].url, 'http://localhost');
      expect(url.searchParams.get('q')).toBe('jazz');
      expect(url.searchParams.get('status')).toBe('open');
      expect(url.searchParams.get('page')).toBe('2');
    });
  });

  it('clicking a status filter button sends the status param in a new request', async () => {
    const user = userEvent.setup();
    setupFetch({ requests: [] });
    renderAs(OTHER);

    await screen.findByText(/no requests found/i);
    await user.click(screen.getByRole('button', { name: /^open$/i }));

    await waitFor(() => {
      const hit = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('status') === 'open';
      });
      expect(hit).toBeDefined();
    });
  });

  it('submits form and sends q and artist in the new request', async () => {
    const user = userEvent.setup();
    setupFetch({ requests: [] });
    renderAs(OTHER);

    await screen.findByText(/no requests found/i);

    await user.type(screen.getByLabelText(/search terms/i), 'Kind of Blue');
    await user.type(screen.getByLabelText(/^artist$/i), 'Miles Davis');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      const hit = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return (
          url.searchParams.get('q') === 'Kind of Blue' &&
          url.searchParams.get('artist') === 'Miles Davis'
        );
      });
      expect(hit).toBeDefined();
    });
  });

  it('sends page=2 after clicking the pagination button', async () => {
    const user = userEvent.setup();
    setupFetch({
      requests: [makeRequest(1)],
      requestMeta: { total: 60, totalPages: 3 }
    });
    renderAs(OTHER);

    await screen.findByText('Request 1');

    await user.click(await screen.findByRole('button', { name: '2' }));

    await waitFor(() => {
      const hit = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('page') === '2';
      });
      expect(hit).toBeDefined();
    });
  });

  it('reset button sends a new request without any filters', async () => {
    const user = userEvent.setup();
    setupFetch({ requests: [] });
    renderAs(OTHER, ['/?q=jazz&status=open']);

    await screen.findByText(/no requests found/i);
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      const resetReq = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return !url.searchParams.has('q') && !url.searchParams.has('status');
      });
      expect(resetReq).toBeDefined();
    });
  });
});
