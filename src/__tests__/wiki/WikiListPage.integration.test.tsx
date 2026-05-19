import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WikiListPage from '../../components/wiki/WikiListPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// ── factories ─────────────────────────────────────────────────────────────────

const makePage = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Page ${id}`,
  slug: `page-${id}`,
  revision: 1,
  minReadLevel: 0,
  minEditLevel: 0,
  authorId: 1,
  author: { username: 'alice' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
  ...overrides
});

const makeListBody = (
  pages: ReturnType<typeof makePage>[],
  meta?: { total?: number; totalPages?: number; page?: number }
) => ({
  data: pages,
  meta: { total: pages.length, page: 1, limit: 25, totalPages: 1, ...meta }
});

// ── auth fixtures ─────────────────────────────────────────────────────────────

const AUTH_EDITOR = {
  id: 9,
  username: 'editor',
  userRank: { name: 'Staff', permissions: { wiki_edit: true } }
};

const AUTH_READER = {
  id: 4,
  username: 'reader',
  userRank: { name: 'Member', permissions: {} }
};

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  auth?: object;
  pages?: ReturnType<typeof makePage>[];
  pageMeta?: { total?: number; totalPages?: number; page?: number };
  wikiStatus?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const {
    auth = AUTH_READER,
    pages = [makePage(1)],
    pageMeta,
    wikiStatus = 200
  } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/auth') {
      return Promise.resolve(makeResponse({ body: auth }));
    }
    if (url.pathname === '/api/wiki') {
      return Promise.resolve(
        makeResponse({
          status: wikiStatus,
          body:
            wikiStatus === 200
              ? makeListBody(pages, pageMeta)
              : { msg: 'Server error' }
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

const getWikiRequests = () =>
  (global.fetch as jest.Mock).mock.calls
    .map((call) => call[0] as Request)
    .filter(
      (req) => new URL(req.url, 'http://localhost').pathname === '/api/wiki'
    );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('WikiListPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('sends GET /api/wiki with default params on mount', async () => {
    setupFetch();
    renderWithProviders(<WikiListPage />);

    await waitFor(() => {
      const reqs = getWikiRequests();
      expect(reqs.length).toBeGreaterThan(0);
      expect(reqs[0].method).toBe('GET');
    });
  });

  it('shows a spinner while wiki pages are loading', () => {
    (global.fetch as jest.Mock).mockImplementation((request: Request) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/api/auth')
        return Promise.resolve(makeResponse({ body: AUTH_READER }));
      return new Promise(() => undefined);
    });
    renderWithProviders(<WikiListPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message when the wiki API fails', async () => {
    setupFetch({ wikiStatus: 500 });
    renderWithProviders(<WikiListPage />);
    expect(
      await screen.findByText(/failed to load wiki pages/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no pages are returned', async () => {
    setupFetch({ pages: [] });
    renderWithProviders(<WikiListPage />);
    expect(await screen.findByText(/no pages found/i)).toBeInTheDocument();
  });

  it('renders page rows with title link, revision, author, and history link', async () => {
    setupFetch({ pages: [makePage(5)] });
    renderWithProviders(<WikiListPage />);

    await screen.findByText('Page 5');
    expect(screen.getByRole('link', { name: 'Page 5' })).toHaveAttribute(
      'href',
      '/private/wiki/5'
    );
    expect(screen.getByText(/rev 1/i)).toBeInTheDocument();
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute(
      'href',
      '/private/wiki/5/history'
    );
  });

  it('shows restricted indicator when minReadLevel > 0', async () => {
    setupFetch({ pages: [makePage(1, { minReadLevel: 500 })] });
    renderWithProviders(<WikiListPage />);

    expect(
      await screen.findByText(/restricted \(level 500\)/i)
    ).toBeInTheDocument();
  });

  it('shows "+ New Page" link for users with wiki_edit permission', async () => {
    setupFetch({ auth: AUTH_EDITOR });
    renderWithProviders(<WikiListPage />);

    expect(
      await screen.findByRole('link', { name: /\+ new page/i })
    ).toBeInTheDocument();
  });

  it('hides "+ New Page" link for users without wiki permission', async () => {
    setupFetch({ auth: AUTH_READER });
    renderWithProviders(<WikiListPage />);

    await screen.findByText('Page 1');
    expect(screen.queryByRole('link', { name: /\+ new page/i })).toBeNull();
  });

  it('reads q from initial URL and shows active filter indicator', async () => {
    setupFetch();
    renderWithProviders(<WikiListPage />, {
      initialEntries: ['/?q=synthesizers']
    });

    await waitFor(() => {
      const reqs = getWikiRequests();
      expect(reqs.length).toBeGreaterThan(0);
      const url = new URL(reqs[0].url, 'http://localhost');
      expect(url.searchParams.get('q')).toBe('synthesizers');
    });

    expect(await screen.findByText(/showing results for/i)).toBeInTheDocument();
    expect(screen.getByText(/synthesizers/i)).toBeInTheDocument();
  });

  it('shows "in titles" when type=title is set in URL', async () => {
    setupFetch();
    renderWithProviders(<WikiListPage />, {
      initialEntries: ['/?q=jazz&type=title']
    });

    expect(await screen.findByText(/in titles/i)).toBeInTheDocument();
  });

  it('shows Clear button only when a q filter is active', async () => {
    setupFetch();

    const { unmount } = renderWithProviders(<WikiListPage />, {
      initialEntries: ['/?q=jazz']
    });
    await screen.findByText('Page 1');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    unmount();

    (global.fetch as jest.Mock).mockReset();
    setupFetch();
    renderWithProviders(<WikiListPage />);
    await screen.findByText('Page 1');
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('submits search form and sends q in the new request', async () => {
    const user = userEvent.setup();
    setupFetch({ pages: [] });
    renderWithProviders(<WikiListPage />);

    await screen.findByText(/no pages found/i);

    await user.type(
      screen.getByRole('searchbox', { name: '' }),
      'Bebop history'
    );
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      const hit = getWikiRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('q') === 'Bebop history';
      });
      expect(hit).toBeDefined();
    });
  });

  it('clicking a sort button sends the order param in the next request', async () => {
    const user = userEvent.setup();
    setupFetch({ pages: [] });
    renderWithProviders(<WikiListPage />);

    await screen.findByText(/no pages found/i);
    await user.click(screen.getByRole('button', { name: /created/i }));

    await waitFor(() => {
      const hit = getWikiRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('order') === 'created';
      });
      expect(hit).toBeDefined();
    });
  });

  it('clicking active sort button again reverses direction to desc', async () => {
    const user = userEvent.setup();
    setupFetch({ pages: [] });
    // title is the default/active sort
    renderWithProviders(<WikiListPage />);

    await screen.findByText(/no pages found/i);

    // Title sort button is active by default — clicking it toggles to desc
    const titleBtn = screen.getByRole('button', { name: /title ↑/i });
    await user.click(titleBtn);

    await waitFor(() => {
      const hit = getWikiRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return (
          url.searchParams.get('order') === 'title' &&
          url.searchParams.get('way') === 'desc'
        );
      });
      expect(hit).toBeDefined();
    });
  });

  it('sends page=2 after clicking pagination button', async () => {
    const user = userEvent.setup();
    setupFetch({
      pages: [makePage(1)],
      pageMeta: { total: 50, totalPages: 3 }
    });
    renderWithProviders(<WikiListPage />);

    await screen.findByText('Page 1');
    await user.click(await screen.findByRole('button', { name: '2' }));

    await waitFor(() => {
      const hit = getWikiRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('page') === '2';
      });
      expect(hit).toBeDefined();
    });
  });
});
