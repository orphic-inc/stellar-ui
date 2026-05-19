import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReleaseBrowsePage from '../../components/releases/ReleaseBrowsePage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// Suppress random-link fetch calls — they're unrelated to this page's behavior
jest.mock('../../components/search/RandomLinks', () => ({
  RandomReleaseLink: () => null,
  RandomArtistLink: () => null
}));

// ── factories ─────────────────────────────────────────────────────────────────

const makeRelease = (id: number, communityId: number | null = 1) => ({
  id,
  title: `Release ${id}`,
  year: 2020 + id,
  type: 'Music',
  releaseType: 'Album',
  communityId,
  catalogueNumber: null,
  recordLabel: null,
  description: '',
  createdAt: '2024-01-15T00:00:00.000Z',
  artist: { id: 10 + id, name: `Artist ${id}`, vanityHouse: false },
  tags: [{ id: 1, name: 'jazz' }],
  _count: { consumers: 5, contributors: 2 }
});

const makeSearchBody = (
  releases: ReturnType<typeof makeRelease>[],
  meta?: { total?: number; totalPages?: number; page?: number }
) => ({
  data: releases,
  meta: { total: releases.length, page: 1, limit: 25, totalPages: 1, ...meta }
});

// ── fixtures ──────────────────────────────────────────────────────────────────

const AUTH_BASIC = {
  id: 1,
  username: 'alice',
  userRank: { name: 'Member', permissions: {} }
};

const AUTH_ADVANCED = {
  id: 2,
  username: 'staffuser',
  userRank: { name: 'Staff', permissions: { advanced_search: true } }
};

const COMMUNITIES_BODY = {
  data: [
    { id: 1, name: 'Jazz Vault' },
    { id: 2, name: 'Rock Shelf' }
  ],
  meta: { total: 2, page: 1, limit: 25, totalPages: 1 }
};

// ── fetch mock helper ─────────────────────────────────────────────────────────

type SetupOpts = {
  auth?: object;
  releases?: ReturnType<typeof makeRelease>[];
  releaseMeta?: { total?: number; totalPages?: number; page?: number };
  releaseStatus?: number;
};

const setupFetch = (opts: SetupOpts = {}) => {
  const {
    auth = AUTH_BASIC,
    releases = [makeRelease(1), makeRelease(2)],
    releaseMeta,
    releaseStatus = 200
  } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/auth') {
      return Promise.resolve(makeResponse({ body: auth }));
    }
    if (url.pathname === '/api/communities') {
      return Promise.resolve(makeResponse({ body: COMMUNITIES_BODY }));
    }
    if (url.pathname === '/api/search/releases') {
      return Promise.resolve(
        makeResponse({
          status: releaseStatus,
          body:
            releaseStatus === 200
              ? makeSearchBody(releases, releaseMeta)
              : { msg: 'Internal error' }
        })
      );
    }

    return Promise.resolve(
      makeResponse({
        status: 404,
        body: { msg: `Unhandled: ${request.method} ${url.pathname}` }
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
        new URL(req.url, 'http://localhost').pathname === '/api/search/releases'
    );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ReleaseBrowsePage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('sends a real GET /api/search/releases request on mount', async () => {
    setupFetch();
    renderWithProviders(<ReleaseBrowsePage />);

    await waitFor(() => {
      const reqs = getSearchRequests();
      expect(reqs.length).toBeGreaterThan(0);
      expect(reqs[0].method).toBe('GET');
    });
  });

  it('shows a spinner while the releases query is pending', () => {
    // Hold the releases fetch so isLoading stays true
    (global.fetch as jest.Mock).mockImplementation((request: Request) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/api/auth')
        return Promise.resolve(makeResponse({ body: AUTH_BASIC }));
      if (url.pathname === '/api/communities')
        return Promise.resolve(makeResponse({ body: COMMUNITIES_BODY }));
      // releases never resolves
      return new Promise(() => undefined);
    });

    renderWithProviders(<ReleaseBrowsePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message when the releases API returns a server error', async () => {
    setupFetch({ releaseStatus: 500 });
    renderWithProviders(<ReleaseBrowsePage />);

    expect(
      await screen.findByText(/failed to load results/i)
    ).toBeInTheDocument();
  });

  it('shows empty state and zero result count when the API returns no results', async () => {
    setupFetch({ releases: [] });
    renderWithProviders(<ReleaseBrowsePage />);

    expect(await screen.findByText(/no releases found/i)).toBeInTheDocument();
    expect(await screen.findByText(/^0 results/i)).toBeInTheDocument();
  });

  it('renders result rows with title link, artist link, tags, year, and releaseType', async () => {
    setupFetch({ releases: [makeRelease(1), makeRelease(2)] });
    renderWithProviders(<ReleaseBrowsePage />);

    expect(await screen.findByText('Release 1')).toBeInTheDocument();
    expect(screen.getByText('Release 2')).toBeInTheDocument();

    expect(
      screen.getAllByRole('link', { name: /artist \d/i }).length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('jazz').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Album').length).toBeGreaterThan(0);
    // Year: 2021, 2022
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
  });

  it('links the title to the release page when communityId is set, plain text when null', async () => {
    setupFetch({ releases: [makeRelease(1, 5), makeRelease(2, null)] });
    renderWithProviders(<ReleaseBrowsePage />);

    await screen.findByText('Release 1');

    expect(screen.getByRole('link', { name: 'Release 1' })).toHaveAttribute(
      'href',
      '/private/communities/5/releases/1'
    );
    // Release 2 has no communityId — should be a span, not a link
    expect(screen.queryByRole('link', { name: 'Release 2' })).toBeNull();
    expect(screen.getByText('Release 2')).toBeInTheDocument();
  });

  it('renders community filter checkboxes fetched from the communities API', async () => {
    setupFetch();
    renderWithProviders(<ReleaseBrowsePage />);

    expect(await screen.findByLabelText('Jazz Vault')).toBeInTheDocument();
    expect(screen.getByLabelText('Rock Shelf')).toBeInTheDocument();
  });

  it('reads q, tags, and page from the initial URL and passes them to the query', async () => {
    setupFetch();
    renderWithProviders(<ReleaseBrowsePage />, {
      initialEntries: ['/?q=blues&tags=modal&page=3']
    });

    await waitFor(() => {
      const reqs = getSearchRequests();
      expect(reqs.length).toBeGreaterThan(0);
      const url = new URL(reqs[0].url, 'http://localhost');
      expect(url.searchParams.get('q')).toBe('blues');
      expect(url.searchParams.get('tags')).toBe('modal');
      expect(url.searchParams.get('page')).toBe('3');
    });
  });

  it('sends a new request with the typed search term on form submit', async () => {
    const user = userEvent.setup();
    setupFetch({ releases: [] });
    renderWithProviders(<ReleaseBrowsePage />);

    await screen.findByText(/no releases found/i);

    const searchInput = screen.getByRole('textbox', { name: /search terms/i });
    await user.type(searchInput, 'Kind of Blue');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      const hit = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('q') === 'Kind of Blue';
      });
      expect(hit).toBeDefined();
    });
  });

  it('sends page=2 in the request after clicking the pagination button', async () => {
    const user = userEvent.setup();
    setupFetch({
      releases: [makeRelease(1)],
      releaseMeta: { total: 50, totalPages: 3 }
    });
    renderWithProviders(<ReleaseBrowsePage />);

    await screen.findByText('Release 1');

    await user.click(await screen.findByRole('button', { name: '2' }));

    await waitFor(() => {
      const hit = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('page') === '2';
      });
      expect(hit).toBeDefined();
    });
  });

  it('clears all filters and re-fetches without them when reset is clicked', async () => {
    const user = userEvent.setup();
    setupFetch({ releases: [] });
    renderWithProviders(<ReleaseBrowsePage />, {
      initialEntries: ['/?q=jazz&tags=blues']
    });

    await screen.findByText(/no releases found/i);

    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      const resetReq = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return !url.searchParams.has('q') && !url.searchParams.has('tags');
      });
      expect(resetReq).toBeDefined();
    });
  });

  it('hides the advanced search toggle for users without advanced_search permission', async () => {
    setupFetch({ auth: AUTH_BASIC, releases: [] });
    renderWithProviders(<ReleaseBrowsePage />);

    await screen.findByText(/no releases found/i);

    expect(
      screen.queryByRole('button', { name: /advanced options/i })
    ).toBeNull();
  });

  it('shows advanced fields when the toggle is clicked by a permitted user', async () => {
    const user = userEvent.setup();
    setupFetch({ auth: AUTH_ADVANCED, releases: [] });
    renderWithProviders(<ReleaseBrowsePage />);

    await screen.findByText(/no releases found/i);

    await user.click(
      screen.getByRole('button', { name: /\+ advanced options/i })
    );

    expect(screen.getByLabelText(/artist name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/album\/release name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/record label/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year from/i)).toBeInTheDocument();
  });

  it('submits advanced params (artist, year) in the query when advanced form is used', async () => {
    const user = userEvent.setup();
    setupFetch({ auth: AUTH_ADVANCED, releases: [] });
    renderWithProviders(<ReleaseBrowsePage />);

    await screen.findByText(/no releases found/i);

    await user.click(
      screen.getByRole('button', { name: /\+ advanced options/i })
    );
    await user.type(screen.getByLabelText(/artist name/i), 'Miles Davis');
    await user.type(screen.getByLabelText(/year from/i), '1959');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      const hit = getSearchRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return (
          url.searchParams.get('artist') === 'Miles Davis' &&
          url.searchParams.get('year') === '1959'
        );
      });
      expect(hit).toBeDefined();
    });
  });
});
