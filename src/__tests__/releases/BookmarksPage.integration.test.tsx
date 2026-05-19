import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarksPage from '../../components/pages/private/bookmarks/BookmarksPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// ── factories ─────────────────────────────────────────────────────────────────

const makeArtistBookmark = (artistId: number, name: string) => ({
  artistId,
  artist: { id: artistId, name },
  createdAt: '2025-06-15T12:00:00Z'
});

const makeReleaseBookmark = (
  releaseId: number,
  title: string,
  communityId: number | null = 1
) => ({
  releaseId,
  release: { id: releaseId, title, communityId },
  createdAt: '2025-06-15T12:00:00Z'
});

const makeCommunityBookmark = (communityId: number, name: string) => ({
  communityId,
  community: { id: communityId, name },
  createdAt: '2025-06-15T12:00:00Z'
});

const makeRequestBookmark = (requestId: number, title: string) => ({
  requestId,
  request: { id: requestId, title },
  createdAt: '2025-06-15T12:00:00Z'
});

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  artists?: object[];
  artistsStatus?: number;
  releases?: object[];
  releasesStatus?: number;
  communities?: object[];
  communitiesStatus?: number;
  requests?: object[];
  requestsStatus?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const {
    artists = [makeArtistBookmark(1, 'Miles Davis')],
    artistsStatus = 200,
    releases = [makeReleaseBookmark(10, 'Kind of Blue')],
    releasesStatus = 200,
    communities = [makeCommunityBookmark(1, 'Jazz Vault')],
    communitiesStatus = 200,
    requests = [makeRequestBookmark(20, 'Looking for Coltrane')],
    requestsStatus = 200
  } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/bookmarks/artists') {
      return Promise.resolve(
        makeResponse({
          status: artistsStatus,
          body: artistsStatus === 200 ? artists : { msg: 'Server error' }
        })
      );
    }
    if (url.pathname === '/api/bookmarks/releases') {
      return Promise.resolve(
        makeResponse({
          status: releasesStatus,
          body: releasesStatus === 200 ? releases : { msg: 'Server error' }
        })
      );
    }
    if (url.pathname === '/api/bookmarks/communities') {
      return Promise.resolve(
        makeResponse({
          status: communitiesStatus,
          body:
            communitiesStatus === 200 ? communities : { msg: 'Server error' }
        })
      );
    }
    if (url.pathname === '/api/bookmarks/requests') {
      return Promise.resolve(
        makeResponse({
          status: requestsStatus,
          body: requestsStatus === 200 ? requests : { msg: 'Server error' }
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

// ── tests ─────────────────────────────────────────────────────────────────────

describe('BookmarksPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('sends GET /api/bookmarks/artists on mount (default tab)', async () => {
    setupFetch();
    renderWithProviders(<BookmarksPage />);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls
        .map((c) => c[0] as Request)
        .filter(
          (r) =>
            new URL(r.url, 'http://localhost').pathname ===
            '/api/bookmarks/artists'
        );
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  it('shows a spinner while artists are loading', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => undefined)
    );
    renderWithProviders(<BookmarksPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when the artists API fails', async () => {
    setupFetch({ artistsStatus: 500 });
    renderWithProviders(<BookmarksPage />);
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('shows empty state when no artists are bookmarked', async () => {
    setupFetch({ artists: [] });
    renderWithProviders(<BookmarksPage />);
    expect(
      await screen.findByText(/no bookmarked artists yet/i)
    ).toBeInTheDocument();
  });

  it('renders artist name as a link to the artist page', async () => {
    setupFetch({
      artists: [makeArtistBookmark(7, 'John Coltrane')]
    });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('John Coltrane');
    expect(screen.getByRole('link', { name: 'John Coltrane' })).toHaveAttribute(
      'href',
      '/private/artists/7'
    );
  });

  it('switches to Releases tab and fetches /api/bookmarks/releases', async () => {
    const user = userEvent.setup();
    setupFetch();
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Releases' }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls
        .map((c) => c[0] as Request)
        .filter(
          (r) =>
            new URL(r.url, 'http://localhost').pathname ===
            '/api/bookmarks/releases'
        );
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  it('renders release as a link when communityId is set', async () => {
    const user = userEvent.setup();
    setupFetch({
      releases: [makeReleaseBookmark(10, 'Kind of Blue', 3)]
    });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Releases' }));

    await screen.findByText('Kind of Blue');
    expect(screen.getByRole('link', { name: 'Kind of Blue' })).toHaveAttribute(
      'href',
      '/private/communities/3/releases/10'
    );
  });

  it('renders release as plain text when communityId is null', async () => {
    const user = userEvent.setup();
    setupFetch({
      releases: [makeReleaseBookmark(11, 'Orphaned Release', null)]
    });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Releases' }));

    await screen.findByText('Orphaned Release');
    expect(screen.queryByRole('link', { name: 'Orphaned Release' })).toBeNull();
  });

  it('shows empty state when no releases are bookmarked', async () => {
    const user = userEvent.setup();
    setupFetch({ releases: [] });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Releases' }));

    expect(
      await screen.findByText(/no bookmarked releases yet/i)
    ).toBeInTheDocument();
  });

  it('switches to Communities tab and renders community link', async () => {
    const user = userEvent.setup();
    setupFetch({
      communities: [makeCommunityBookmark(5, 'Rock Shelf')]
    });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Communities' }));

    await screen.findByText('Rock Shelf');
    expect(screen.getByRole('link', { name: 'Rock Shelf' })).toHaveAttribute(
      'href',
      '/private/communities/5'
    );
  });

  it('shows empty state when no communities are bookmarked', async () => {
    const user = userEvent.setup();
    setupFetch({ communities: [] });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Communities' }));

    expect(
      await screen.findByText(/no bookmarked communities yet/i)
    ).toBeInTheDocument();
  });

  it('switches to Requests tab and renders request link', async () => {
    const user = userEvent.setup();
    setupFetch({
      requests: [makeRequestBookmark(20, 'Looking for Coltrane')]
    });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Requests' }));

    await screen.findByText('Looking for Coltrane');
    expect(
      screen.getByRole('link', { name: 'Looking for Coltrane' })
    ).toHaveAttribute('href', '/private/requests/20');
  });

  it('shows empty state when no requests are bookmarked', async () => {
    const user = userEvent.setup();
    setupFetch({ requests: [] });
    renderWithProviders(<BookmarksPage />);

    await screen.findByText('Miles Davis');
    await user.click(screen.getByRole('button', { name: 'Requests' }));

    expect(
      await screen.findByText(/no bookmarked requests yet/i)
    ).toBeInTheDocument();
  });
});
