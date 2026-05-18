import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationView from '../../components/messages/ConversationView';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { createTestStore, renderWithProviders } from '../testUtils';

const backMock = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' })
}));

const makeConversation = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  subject: 'Hello',
  participants: [
    {
      userId: 7,
      isSticky: true,
      isRead: true,
      user: { username: 'me' }
    },
    {
      userId: 8,
      isSticky: false,
      isRead: true,
      user: { username: 'alice' }
    }
  ],
  messages: [
    {
      id: 10,
      body: 'My message',
      createdAt: '2026-05-17T12:00:00.000Z',
      sender: { id: 7, username: 'me' }
    },
    {
      id: 11,
      body: 'Reply',
      createdAt: '2026-05-17T13:00:00.000Z',
      sender: { id: 8, username: 'alice' }
    }
  ],
  ...overrides
});

describe('ConversationView RTK Query integration', () => {
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
    Object.defineProperty(window, 'history', {
      configurable: true,
      value: { back: backMock }
    });
  });

  it('loads a conversation, sends flag/reply/delete mutations, and refetches updated data', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeResponse({ body: makeConversation() }))
      .mockResolvedValueOnce(makeResponse({ status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          body: makeConversation({
            participants: [
              {
                userId: 7,
                isSticky: false,
                isRead: true,
                user: { username: 'me' }
              },
              {
                userId: 8,
                isSticky: false,
                isRead: true,
                user: { username: 'alice' }
              }
            ]
          })
        })
      )
      .mockResolvedValueOnce(makeResponse({ status: 204 }))
      .mockResolvedValueOnce(
        makeResponse({
          body: makeConversation({
            participants: [
              {
                userId: 7,
                isSticky: false,
                isRead: false,
                user: { username: 'me' }
              },
              {
                userId: 8,
                isSticky: false,
                isRead: true,
                user: { username: 'alice' }
              }
            ]
          })
        })
      )
      .mockResolvedValueOnce(
        makeResponse({
          body: {
            id: 12,
            body: 'New reply',
            createdAt: '2026-05-17T14:00:00.000Z',
            sender: { id: 7, username: 'me' }
          }
        })
      )
      .mockResolvedValueOnce(
        makeResponse({
          body: makeConversation({
            participants: [
              {
                userId: 7,
                isSticky: false,
                isRead: false,
                user: { username: 'me' }
              },
              {
                userId: 8,
                isSticky: false,
                isRead: true,
                user: { username: 'alice' }
              }
            ],
            messages: [
              {
                id: 10,
                body: 'My message',
                createdAt: '2026-05-17T12:00:00.000Z',
                sender: { id: 7, username: 'me' }
              },
              {
                id: 11,
                body: 'Reply',
                createdAt: '2026-05-17T13:00:00.000Z',
                sender: { id: 8, username: 'alice' }
              },
              {
                id: 12,
                body: 'New reply',
                createdAt: '2026-05-17T14:00:00.000Z',
                sender: { id: 7, username: 'me' }
              }
            ]
          })
        })
      )
      .mockResolvedValueOnce(makeResponse({ status: 204 }));

    renderWithProviders(<ConversationView />, { store });

    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'alice' }).length
    ).toBeGreaterThan(0);

    const initialRequest = (global.fetch as jest.Mock).mock
      .calls[0][0] as Request;
    expect(initialRequest.url).toContain('/api/messages/1');
    expect(initialRequest.method).toBe('GET');

    await user.click(screen.getByTitle('Toggle sticky'));
    await waitFor(async () => {
      const stickyRequest = (global.fetch as jest.Mock).mock
        .calls[1][0] as Request;
      expect(stickyRequest.url).toContain('/api/messages/1');
      expect(stickyRequest.method).toBe('PATCH');
      expect(await stickyRequest.text()).toBe(
        JSON.stringify({ isSticky: false })
      );
    });

    await user.click(screen.getByTitle('Mark unread'));
    await waitFor(async () => {
      const unreadRequest = (global.fetch as jest.Mock).mock
        .calls[3][0] as Request;
      expect(unreadRequest.url).toContain('/api/messages/1');
      expect(unreadRequest.method).toBe('PATCH');
      expect(await unreadRequest.text()).toBe(
        JSON.stringify({ isRead: false })
      );
    });

    await user.type(screen.getByLabelText(/^reply$/i), 'New reply');
    await user.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(async () => {
      const replyRequest = (global.fetch as jest.Mock).mock
        .calls[5][0] as Request;
      expect(replyRequest.url).toContain('/api/messages/1/reply');
      expect(replyRequest.method).toBe('POST');
      expect(await replyRequest.text()).toBe(
        JSON.stringify({ body: 'New reply' })
      );
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByText('New reply')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Delete conversation'));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.map(
        (call) => call[0] as Request
      );
      expect(
        calls.some(
          (req) =>
            req.method === 'DELETE' && req.url.includes('/api/messages/1')
        )
      ).toBe(true);
      expect(backMock).toHaveBeenCalled();
    });
  });

  it('shows not found and reply failure states from real RTK Query errors', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeResponse({ body: makeConversation() }))
      .mockResolvedValueOnce(
        makeResponse({
          status: 403,
          body: { msg: 'not_participant' }
        })
      );

    const { unmount } = renderWithProviders(<ConversationView />, { store });

    expect(await screen.findByText('Hello')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^reply$/i), 'Broken');
    await user.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to send reply.')).toBe(true);
    });

    unmount();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({
        status: 404,
        body: { msg: 'Conversation not found' }
      })
    );

    renderWithProviders(<ConversationView />, { store });

    expect(
      await screen.findByText('Conversation not found.')
    ).toBeInTheDocument();
  });
});
