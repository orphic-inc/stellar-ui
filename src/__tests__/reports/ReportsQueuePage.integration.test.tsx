import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsQueuePage from '../../components/reports/ReportsQueuePage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

const makeQueuePayload = (overrides: Record<string, unknown> = {}) => ({
  total: 1,
  page: 1,
  pageSize: 25,
  reports: [
    {
      id: 1,
      targetType: 'ForumPost',
      targetId: 42,
      category: 'spam',
      status: 'Open',
      sourceUrl: '/forums/42',
      claimedBy: null,
      createdAt: '2026-05-17T12:00:00.000Z',
      reporter: { username: 'alice' },
      notes: [
        {
          id: 9,
          body: 'Investigated',
          createdAt: '2026-05-17T13:00:00.000Z',
          author: { username: 'mod-one' }
        }
      ]
    }
  ],
  ...overrides
});

describe('ReportsQueuePage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve(
        makeResponse({
          body: makeQueuePayload({
            reports: [
              {
                id: 1,
                targetType: 'ForumPost',
                targetId: 42,
                category: 'spam',
                status: 'Claimed',
                sourceUrl: '/forums/42',
                claimedBy: { username: 'mod-one' },
                createdAt: '2026-05-17T12:00:00.000Z',
                reporter: { username: 'alice' },
                notes: [
                  {
                    id: 9,
                    body: 'Investigated',
                    createdAt: '2026-05-17T13:00:00.000Z',
                    author: { username: 'mod-one' }
                  }
                ]
              }
            ]
          })
        })
      )
    );
  });

  it('loads queue data, applies filters through real query params, and expands notes', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeResponse({ body: makeQueuePayload() }))
      .mockResolvedValueOnce(makeResponse({ body: { open: 3, claimed: 1 } }))
      .mockResolvedValueOnce(
        makeResponse({
          body: {
            last24h: 2,
            lastWeek: 5,
            lastMonth: 9,
            allTime: 30,
            byStaff: [{ userId: 7, username: 'mod-one', count: 11 }]
          }
        })
      )
      .mockResolvedValueOnce(
        makeResponse({
          body: makeQueuePayload({
            page: 1,
            reports: [
              {
                id: 1,
                targetType: 'ForumPost',
                targetId: 42,
                category: 'spam',
                status: 'Claimed',
                sourceUrl: '/forums/42',
                claimedBy: { username: 'mod-one' },
                createdAt: '2026-05-17T12:00:00.000Z',
                reporter: { username: 'alice' },
                notes: [
                  {
                    id: 9,
                    body: 'Investigated',
                    createdAt: '2026-05-17T13:00:00.000Z',
                    author: { username: 'mod-one' }
                  }
                ]
              }
            ]
          })
        })
      );

    renderWithProviders(<ReportsQueuePage />);

    expect(await screen.findByText('Reports')).toBeInTheDocument();
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes('Open:'))
    ).toBeInTheDocument();

    const initialRequest = (global.fetch as jest.Mock).mock
      .calls[0][0] as Request;
    expect(initialRequest.url).toContain('/api/reports?');
    expect(initialRequest.url).toContain('page=1');
    expect(initialRequest.url).toContain('status=Open');
    expect(initialRequest.url).toContain('targetType=all');
    expect(initialRequest.url).toContain('claimedByMe=false');

    await user.selectOptions(screen.getByLabelText('Status:'), 'Claimed');
    await user.selectOptions(screen.getByLabelText('Type:'), 'ForumPost');
    await user.click(screen.getByLabelText(/claimed by me/i));
    await user.type(screen.getByLabelText('Reporter:'), 'alice');
    await user.click(screen.getByRole('button', { name: /^filter$/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.map(
        (call) => call[0] as Request
      );
      expect(
        calls.some(
          (req) =>
            req.url.includes('/api/reports?') &&
            req.url.includes('status=Claimed') &&
            req.url.includes('targetType=ForumPost') &&
            req.url.includes('claimedByMe=true') &&
            req.url.includes('reporterUsername=alice')
        )
      ).toBe(true);
      expect(
        screen.getByRole('button', { name: /1 note/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /1 note/i }));

    expect(await screen.findByText('Investigated')).toBeInTheDocument();
  });

  it('renders stats from the real stats query and shows queue error states', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        makeResponse({ status: 500, body: { msg: 'bad' } })
      )
      .mockResolvedValueOnce(makeResponse({ body: { open: 3, claimed: 1 } }))
      .mockResolvedValueOnce(
        makeResponse({
          body: {
            last24h: 2,
            lastWeek: 5,
            lastMonth: 9,
            allTime: 30,
            byStaff: [{ userId: 7, username: 'mod-one', count: 11 }]
          }
        })
      );

    renderWithProviders(<ReportsQueuePage />);

    expect(
      await screen.findByText('Failed to load reports queue.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^stats$/i }));

    expect(await screen.findByText('Last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });
});
