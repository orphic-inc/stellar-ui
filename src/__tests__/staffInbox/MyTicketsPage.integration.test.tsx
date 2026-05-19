import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyTicketsPage from '../../components/staffInbox/MyTicketsPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

// ── factories ─────────────────────────────────────────────────────────────────

const makeTicket = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  subject: `Ticket ${id}`,
  status: 'Open',
  isReadByUser: true,
  assignedUser: null,
  updatedAt: '2025-06-15T12:00:00Z',
  ...overrides
});

const makeBody = (
  conversations: ReturnType<typeof makeTicket>[],
  meta?: { total?: number; pageSize?: number; page?: number }
) => ({
  conversations,
  total: conversations.length,
  page: 1,
  pageSize: 25,
  ...meta
});

// ── fetch mock helper ─────────────────────────────────────────────────────────

type FetchOpts = {
  tickets?: ReturnType<typeof makeTicket>[];
  meta?: { total?: number; pageSize?: number; page?: number };
  status?: number;
};

const setupFetch = (opts: FetchOpts = {}) => {
  const { tickets = [makeTicket(1)], meta, status = 200 } = opts;

  (global.fetch as jest.Mock).mockImplementation((request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/staff-inbox/tickets') {
      return Promise.resolve(
        makeResponse({
          status,
          body:
            status === 200 ? makeBody(tickets, meta) : { msg: 'Server error' }
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

const getTicketRequests = () =>
  (global.fetch as jest.Mock).mock.calls
    .map((c) => c[0] as Request)
    .filter(
      (r) =>
        new URL(r.url, 'http://localhost').pathname ===
        '/api/staff-inbox/tickets'
    );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MyTicketsPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('sends GET /api/staff-inbox/tickets on mount', async () => {
    setupFetch();
    renderWithProviders(<MyTicketsPage />);

    await waitFor(() => {
      expect(getTicketRequests().length).toBeGreaterThan(0);
    });
  });

  it('shows a spinner while loading', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => undefined)
    );
    renderWithProviders(<MyTicketsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error message when the API fails', async () => {
    setupFetch({ status: 500 });
    renderWithProviders(<MyTicketsPage />);
    expect(
      await screen.findByText(/failed to load tickets/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no tickets exist', async () => {
    setupFetch({ tickets: [] });
    renderWithProviders(<MyTicketsPage />);
    expect(
      await screen.findByText(/you have no support tickets/i)
    ).toBeInTheDocument();
  });

  it('renders a ticket row with subject link, status badge, and assigned staff', async () => {
    setupFetch({
      tickets: [
        makeTicket(3, {
          subject: 'Cannot download',
          status: 'Unanswered',
          assignedUser: { username: 'staffmod' }
        })
      ]
    });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Cannot download');
    expect(
      screen.getByRole('link', { name: /cannot download/i })
    ).toHaveAttribute('href', '/private/messages/tickets/3');
    expect(screen.getByText('Unanswered')).toBeInTheDocument();
    expect(screen.getByText('staffmod')).toBeInTheDocument();
  });

  it('shows dash when no staff is assigned', async () => {
    setupFetch({ tickets: [makeTicket(4, { assignedUser: null })] });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Ticket 4');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows unread indicator (●) for unread open tickets', async () => {
    setupFetch({
      tickets: [makeTicket(5, { status: 'Open', isReadByUser: false })]
    });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Ticket 5');
    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('hides unread indicator for Unanswered tickets even if unread', async () => {
    setupFetch({
      tickets: [makeTicket(6, { status: 'Unanswered', isReadByUser: false })]
    });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Ticket 6');
    expect(screen.queryByText('●')).toBeNull();
  });

  it('shows pagination when totalPages > 1 and sends page=2', async () => {
    const user = userEvent.setup();
    setupFetch({
      tickets: [makeTicket(1)],
      meta: { total: 60, pageSize: 25 }
    });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Ticket 1');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      const hit = getTicketRequests().find((r) => {
        const url = new URL(r.url, 'http://localhost');
        return url.searchParams.get('page') === '2';
      });
      expect(hit).toBeDefined();
    });
  });

  it('navigates back to page 1 when Previous is clicked from page 2', async () => {
    const user = userEvent.setup();
    setupFetch({
      tickets: [makeTicket(1)],
      meta: { total: 60, pageSize: 25 }
    });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Ticket 1');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /previous/i })
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /previous/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });
  });

  it('hides pagination buttons when only one page', async () => {
    setupFetch({ tickets: [makeTicket(1)] });
    renderWithProviders(<MyTicketsPage />);

    await screen.findByText('Ticket 1');
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /previous/i })).toBeNull();
  });
});
