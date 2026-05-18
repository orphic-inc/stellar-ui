import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxPage from '../../components/messages/InboxPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { renderWithProviders } from '../testUtils';

const makeConversation = (
  id: number,
  subject: string,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  subject,
  participants: [
    {
      userId: 7,
      isRead: false,
      isSticky: false,
      receivedAt: '2026-05-17T12:00:00.000Z'
    }
  ],
  messages: [{ sender: { username: 'alice' } }],
  ...overrides
});

describe('InboxPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('loads inbox data through RTK Query, performs bulk update and delete mutations, and refetches', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Unexpected fetch call'))
    );
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        makeResponse({
          body: {
            total: 2,
            page: 1,
            pageSize: 25,
            conversations: [
              makeConversation(1, 'Unread thread', {
                participants: [
                  {
                    userId: 7,
                    isRead: false,
                    isSticky: true,
                    receivedAt: '2026-05-17T12:00:00.000Z'
                  }
                ],
                messages: [{ sender: { username: 'alice' } }]
              }),
              makeConversation(2, 'Read thread', {
                participants: [
                  {
                    userId: 7,
                    isRead: true,
                    isSticky: false,
                    receivedAt: '2026-05-16T12:00:00.000Z'
                  }
                ],
                messages: [{ sender: { username: 'bob' } }]
              })
            ]
          }
        })
      )
      .mockResolvedValueOnce(makeResponse({ status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          body: {
            total: 2,
            page: 1,
            pageSize: 25,
            conversations: [
              makeConversation(1, 'Unread thread', {
                participants: [
                  {
                    userId: 7,
                    isRead: true,
                    isSticky: true,
                    receivedAt: '2026-05-17T12:00:00.000Z'
                  }
                ]
              }),
              makeConversation(2, 'Read thread', {
                participants: [
                  {
                    userId: 7,
                    isRead: true,
                    isSticky: false,
                    receivedAt: '2026-05-16T12:00:00.000Z'
                  }
                ],
                messages: [{ sender: { username: 'bob' } }]
              })
            ]
          }
        })
      )
      .mockResolvedValueOnce(makeResponse({ status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          body: {
            total: 1,
            page: 1,
            pageSize: 25,
            conversations: [
              makeConversation(2, 'Read thread', {
                participants: [
                  {
                    userId: 7,
                    isRead: true,
                    isSticky: false,
                    receivedAt: '2026-05-16T12:00:00.000Z'
                  }
                ],
                messages: [{ sender: { username: 'bob' } }]
              })
            ]
          }
        })
      );

    renderWithProviders(<InboxPage />);

    expect(await screen.findByText('Unread thread')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();

    const firstRequest = (global.fetch as jest.Mock).mock
      .calls[0][0] as Request;
    expect(firstRequest.url).toContain('/api/messages?page=1');
    expect(firstRequest.method).toBe('GET');

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole('button', { name: /mark read/i }));

    await waitFor(async () => {
      const bulkRequest = (global.fetch as jest.Mock).mock
        .calls[1][0] as Request;
      expect(bulkRequest.url).toContain('/api/messages/bulk');
      expect(bulkRequest.method).toBe('POST');
      expect(await bulkRequest.text()).toBe(
        JSON.stringify({ ids: [1], action: 'markRead' })
      );
    });

    const row = screen.getByText('Unread thread').closest('tr');
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByTitle('Delete'));

    await waitFor(() => {
      expect(screen.queryByText('Unread thread')).not.toBeInTheDocument();
      expect(screen.getByText('Read thread')).toBeInTheDocument();
    });

    const deleteRequest = (global.fetch as jest.Mock).mock
      .calls[3][0] as Request;
    expect(deleteRequest.url).toContain('/api/messages/1');
    expect(deleteRequest.method).toBe('DELETE');
  });

  it('shows an error state when the inbox query fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({ status: 500 })
    );

    renderWithProviders(<InboxPage />);

    expect(
      await screen.findByText('Failed to load inbox.')
    ).toBeInTheDocument();
  });
});
