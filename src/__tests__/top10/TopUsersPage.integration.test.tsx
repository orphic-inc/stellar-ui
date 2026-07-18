import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopUsersPage from '../../components/top10/TopUsersPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// ── factory ───────────────────────────────────────────────────────────────────

const makeItem = (id: number, overrides: Record<string, unknown> = {}) => ({
  rank: id,
  userId: id,
  username: `user${id}`,
  rankName: 'Member',
  contributed: String(10737418240 * id), // ~10 GB, 20 GB, …
  consumed: String(5368709120 * id),
  ratio: 2.0,
  numContributions: 42 * id,
  contributionSpeed: 1048576 * id, // 1 MB/s per rank
  consumeSpeed: 524288 * id, // 512 KB/s per rank
  joinedAt: '2020-06-15T12:00:00.000Z',
  ...overrides
});

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  items?: ReturnType<typeof makeItem>[];
  status?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const { items = [makeItem(1), makeItem(2)], status = 200 } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/top10/users') {
      return Promise.resolve(
        makeResponse({
          status,
          body: status === 200 ? { items } : { msg: 'Server error' }
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

// ── helpers ───────────────────────────────────────────────────────────────────

const getUserRequests = () =>
  (global.fetch as jest.Mock).mock.calls
    .map((call) => call[0] as Request)
    .filter(
      (req) =>
        new URL(req.url, 'http://localhost').pathname === '/api/top10/users'
    );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('TopUsersPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('sends GET /api/top10/users with default type=contributed and limit=10', async () => {
    setupFetch();
    renderWithProviders(<TopUsersPage />);

    await waitFor(() => {
      const reqs = getUserRequests();
      expect(reqs.length).toBeGreaterThan(0);
      const url = new URL(reqs[0].url, 'http://localhost');
      expect(url.searchParams.get('type')).toBe('contributed');
      expect(url.searchParams.get('limit')).toBe('10');
    });
  });

  it('shows a spinner while the query is loading', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => undefined)
    );
    renderWithProviders(<TopUsersPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message on API failure', async () => {
    setupFetch({ status: 500 });
    renderWithProviders(<TopUsersPage />);
    expect(
      await screen.findByText(/failed to load top users/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when items array is empty', async () => {
    setupFetch({ items: [] });
    renderWithProviders(<TopUsersPage />);
    expect(await screen.findByText(/no data available/i)).toBeInTheDocument();
  });

  it('renders user rows with username link, rank name, ratio, and join year', async () => {
    setupFetch({ items: [makeItem(1)] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('user1');
    expect(screen.getByRole('link', { name: 'user1' })).toHaveAttribute(
      'href',
      '/user/1'
    );
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  // Ratio health now paints from the --st-success/warning/danger status tokens
  // (WS4 theming), not fixed tailwind hues.
  it('applies the success ratio color for ratio >= 1.0', async () => {
    setupFetch({ items: [makeItem(1, { ratio: 1.5 })] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('1.50');
    const cell = screen.getByText('1.50');
    expect(cell.className).toContain('--st-success');
  });

  it('applies the warning ratio color for ratio between 0.5 and 1.0', async () => {
    setupFetch({ items: [makeItem(1, { ratio: 0.75 })] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('0.75');
    expect(screen.getByText('0.75').className).toContain('--st-warning');
  });

  it('applies the danger ratio color for ratio below 0.5', async () => {
    setupFetch({ items: [makeItem(1, { ratio: 0.3 })] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('0.30');
    expect(screen.getByText('0.30').className).toContain('--st-danger');
  });

  it('shows Contributed column and hides Consumed column in contributed mode', async () => {
    setupFetch({ items: [makeItem(1)] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('user1');
    expect(
      screen.getByRole('columnheader', { name: /contributed/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: /consumed/i })
    ).toBeNull();
  });

  it('switches metric to consumed and sends new request with type=consumed', async () => {
    const user = userEvent.setup();
    setupFetch({ items: [] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText(/no data available/i);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'consumed'
    );

    await waitFor(() => {
      const hit = getUserRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('type') === 'consumed';
      });
      expect(hit).toBeDefined();
    });
  });

  it('shows Consumed column (not Contributed) after switching to consumed type', async () => {
    const user = userEvent.setup();
    setupFetch({ items: [makeItem(1)] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('user1');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'consumed'
    );

    // Wait for re-render with consumed type selected
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /consumed/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('columnheader', { name: /contributed/i })
      ).toBeNull();
    });
  });

  it('shows Contributions column when numContributions type selected', async () => {
    const user = userEvent.setup();
    setupFetch({ items: [makeItem(1)] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('user1');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'numContributions'
    );

    expect(
      await screen.findByRole('columnheader', { name: /contributions/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/42/)[0]).toBeInTheDocument();
  });

  it('shows Contrib. Speed column for contributionSpeed type', async () => {
    const user = userEvent.setup();
    setupFetch({ items: [makeItem(1)] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('user1');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'contributionSpeed'
    );

    // Speed column header appears alongside contributed/consumed
    expect(
      await screen.findByRole('columnheader', { name: /contrib\. speed/i })
    ).toBeInTheDocument();
    // For non-zero speed, should show a formatted value (not "—")
    expect(screen.queryByText('—')).toBeNull();
  });

  it('shows — for zero contribution speed', async () => {
    const user = userEvent.setup();
    setupFetch({ items: [makeItem(1, { contributionSpeed: 0 })] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText('user1');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'contributionSpeed'
    );

    expect(await screen.findByText('—')).toBeInTheDocument();
  });

  it('changes limit to 100 and sends new request with limit=100', async () => {
    const user = userEvent.setup();
    setupFetch({ items: [] });
    renderWithProviders(<TopUsersPage />);

    await screen.findByText(/no data available/i);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /limit/i }),
      '100'
    );

    await waitFor(() => {
      const hit = getUserRequests().find((req) => {
        const url = new URL(req.url, 'http://localhost');
        return url.searchParams.get('limit') === '100';
      });
      expect(hit).toBeDefined();
    });
  });
});
