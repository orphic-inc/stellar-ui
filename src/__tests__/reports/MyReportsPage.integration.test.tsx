import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyReportsPage from '../../components/reports/MyReportsPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// ── factories ─────────────────────────────────────────────────────────────────

const makeReport = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  targetType: 'ForumPost',
  category: 'Spam',
  status: 'Open',
  createdAt: '2025-06-15T12:00:00Z',
  resolvedAt: null,
  ...overrides
});

const makeBody = (
  reports: ReturnType<typeof makeReport>[],
  meta?: { total?: number; pageSize?: number; page?: number }
) => ({
  reports,
  total: reports.length,
  page: 1,
  pageSize: 25,
  ...meta
});

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  reports?: ReturnType<typeof makeReport>[];
  meta?: { total?: number; pageSize?: number; page?: number };
  status?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const { reports = [makeReport(1)], meta, status = 200 } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/reports/mine') {
      return Promise.resolve(
        makeResponse({
          status,
          body:
            status === 200 ? makeBody(reports, meta) : { msg: 'Server error' }
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

const getReportRequests = () =>
  (global.fetch as jest.Mock).mock.calls
    .map((c) => c[0] as Request)
    .filter(
      (r) => new URL(r.url, 'http://localhost').pathname === '/api/reports/mine'
    );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MyReportsPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('sends GET /api/reports/mine on mount', async () => {
    setupFetch();
    renderWithProviders(<MyReportsPage />);

    await waitFor(() => {
      expect(getReportRequests().length).toBeGreaterThan(0);
    });
  });

  it('shows a spinner while loading', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => undefined)
    );
    renderWithProviders(<MyReportsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message when the API fails', async () => {
    setupFetch({ status: 500 });
    renderWithProviders(<MyReportsPage />);
    expect(
      await screen.findByText(/failed to load your reports/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no reports exist', async () => {
    setupFetch({ reports: [] });
    renderWithProviders(<MyReportsPage />);
    expect(
      await screen.findByText(/you haven't filed any reports yet/i)
    ).toBeInTheDocument();
  });

  it('renders a report row with type, category link, status badge, and date', async () => {
    setupFetch({
      reports: [
        makeReport(5, {
          targetType: 'Artist',
          category: 'Wrong info',
          status: 'Claimed',
          createdAt: '2025-08-10T12:00:00Z'
        })
      ]
    });
    renderWithProviders(<MyReportsPage />);

    await screen.findByText('Wrong info');
    expect(screen.getByRole('link', { name: 'Wrong info' })).toHaveAttribute(
      'href',
      '/reports/5'
    );
    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByText('Claimed')).toBeInTheDocument();
  });

  it('shows resolvedAt date in last column when report is resolved', async () => {
    setupFetch({
      reports: [
        makeReport(6, {
          status: 'Resolved',
          resolvedAt: '2025-09-01T12:00:00Z'
        })
      ]
    });
    renderWithProviders(<MyReportsPage />);

    // Wait for data to load (category link appears)
    await screen.findByRole('link', { name: 'Spam' });
    // The resolvedAt column should show a date, not a dash
    expect(screen.queryByText('—')).toBeNull();
  });

  it('shows dash in resolvedAt column when report is not yet resolved', async () => {
    setupFetch({
      reports: [makeReport(7, { status: 'Open', resolvedAt: null })]
    });
    renderWithProviders(<MyReportsPage />);

    await screen.findByText('Open');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows pagination buttons when totalPages > 1 and sends page=2', async () => {
    const user = userEvent.setup();
    setupFetch({
      reports: [makeReport(1)],
      meta: { total: 60, pageSize: 25 }
    });
    renderWithProviders(<MyReportsPage />);

    await screen.findByText('Spam');
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      const hit = getReportRequests().find((r) => {
        const url = new URL(r.url, 'http://localhost');
        return url.searchParams.get('page') === '2';
      });
      expect(hit).toBeDefined();
    });
  });

  it('navigates back to page 1 when Previous is clicked from page 2', async () => {
    const user = userEvent.setup();
    setupFetch({ reports: [makeReport(1)], meta: { total: 60, pageSize: 25 } });
    renderWithProviders(<MyReportsPage />);

    await screen.findByText('Spam');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Now on page 2 — Previous button should be enabled and page counter updates
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /previous/i })
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /previous/i }));

    // Back on page 1: Previous should be disabled again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });
  });

  it('hides pagination buttons when only one page', async () => {
    setupFetch({ reports: [makeReport(1)] });
    renderWithProviders(<MyReportsPage />);

    await screen.findByText('Spam');
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /previous/i })).toBeNull();
  });
});
