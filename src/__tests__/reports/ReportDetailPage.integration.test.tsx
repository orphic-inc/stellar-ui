import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportDetailPage from '../../components/reports/ReportDetailPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { createTestStore, renderWithProviders } from '../testUtils';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '7' }),
  useNavigate: () => mockNavigate
}));

const makeReport = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  targetType: 'ForumPost',
  targetId: 42,
  category: 'spam',
  reason: 'This is spam.',
  evidence: 'Quoted evidence',
  status: 'Open',
  reporter: { id: 3, username: 'alice' },
  reporterId: 3,
  claimedById: null,
  claimedBy: null,
  resolvedBy: null,
  resolvedAt: null,
  resolution: null,
  resolutionAction: null,
  sourceUrl: '/private/forums/42',
  notes: [
    {
      id: 1,
      body: 'Investigated',
      createdAt: '2026-05-17T12:00:00.000Z',
      author: { username: 'mod-one' }
    }
  ],
  ...overrides
});

describe('ReportDetailPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve(
        makeResponse({
          status: 404,
          body: { msg: 'Unhandled test request' }
        })
      )
    );
  });

  it('loads a report and performs claim, resolve, and note mutations through RTK Query', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeResponse({ body: makeReport() }))
      .mockResolvedValueOnce(makeResponse({ status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          body: makeReport({
            status: 'Claimed',
            claimedById: 9,
            claimedBy: { id: 9, username: 'mod-one' }
          })
        })
      )
      .mockResolvedValueOnce(makeResponse({ status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          body: makeReport({
            status: 'Resolved',
            claimedById: 9,
            claimedBy: { id: 9, username: 'mod-one' },
            resolvedBy: { id: 9, username: 'mod-one' },
            resolvedAt: '2026-05-18T12:00:00.000Z',
            resolution: 'Removed post',
            resolutionAction: 'Dismissed'
          })
        })
      )
      .mockResolvedValueOnce(
        makeResponse({
          status: 201,
          body: {
            id: 2,
            body: 'Escalated to moderation log',
            createdAt: '2026-05-18T12:01:00.000Z',
            author: { username: 'mod-one' }
          }
        })
      )
      .mockResolvedValueOnce(
        makeResponse({
          body: makeReport({
            status: 'Resolved',
            claimedById: 9,
            claimedBy: { id: 9, username: 'mod-one' },
            resolvedBy: { id: 9, username: 'mod-one' },
            resolvedAt: '2026-05-18T12:00:00.000Z',
            resolution: 'Removed post',
            resolutionAction: 'Dismissed',
            notes: [
              {
                id: 1,
                body: 'Investigated',
                createdAt: '2026-05-17T12:00:00.000Z',
                author: { username: 'mod-one' }
              },
              {
                id: 2,
                body: 'Escalated to moderation log',
                createdAt: '2026-05-18T12:01:00.000Z',
                author: { username: 'mod-one' }
              }
            ]
          })
        })
      );

    renderWithProviders(<ReportDetailPage />, { store });

    expect(await screen.findByText(/ForumPost Report/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^claim$/i }));
    await waitFor(async () => {
      const req = (global.fetch as jest.Mock).mock.calls[1][0] as Request;
      expect(req.url).toContain('/api/reports/7/claim');
      expect(req.method).toBe('POST');
    });

    await user.click(screen.getByRole('button', { name: /^resolve$/i }));
    await user.type(screen.getByLabelText(/resolution notes/i), 'Removed post');
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));

    await waitFor(async () => {
      const req = (global.fetch as jest.Mock).mock.calls[3][0] as Request;
      expect(req.url).toContain('/api/reports/7/resolve');
      expect(req.method).toBe('POST');
      expect(await req.text()).toBe(
        JSON.stringify({
          resolution: 'Removed post',
          resolutionAction: 'Dismissed'
        })
      );
      expect(
        screen.getByText((text) => text.includes('Resolved by mod-one'))
      ).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/add moderator note/i),
      'Escalated to moderation log'
    );
    await user.click(screen.getByRole('button', { name: /add note/i }));

    await waitFor(async () => {
      const req = (global.fetch as jest.Mock).mock.calls[5][0] as Request;
      expect(req.url).toContain('/api/reports/7/notes');
      expect(req.method).toBe('POST');
      expect(await req.text()).toBe(
        JSON.stringify({ body: 'Escalated to moderation log' })
      );
      expect(
        screen.getByText('Escalated to moderation log')
      ).toBeInTheDocument();
    });
  });

  it('redirects non-staff users away from forbidden reports and shows mutation failures as alerts', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 3,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({
        status: 403,
        body: { msg: 'forbidden' }
      })
    );

    const { unmount } = renderWithProviders(<ReportDetailPage />, { store });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/private/reports/mine', {
        replace: true
      });
    });

    unmount();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve(
        makeResponse({
          status: 404,
          body: { msg: 'Unhandled test request' }
        })
      )
    );
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeResponse({ body: makeReport() }))
      .mockResolvedValueOnce(
        makeResponse({
          status: 500,
          body: { msg: 'claim_failed' }
        })
      );

    const staffStore = createTestStore();
    staffStore.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );

    renderWithProviders(<ReportDetailPage />, { store: staffStore });

    expect(await screen.findByText(/ForumPost Report/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^claim$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(staffStore.getState());
      expect(alerts.some((a) => a.msg === 'Failed to claim report.')).toBe(
        true
      );
    });
  });
});
