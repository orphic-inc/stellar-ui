import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationView from '../../components/messages/ConversationView';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { setCredentials } from '../../store/slices/authSlice';

const mockUseGetConversationQuery = jest.fn();
const mockReply = jest.fn();
const mockUpdateFlags = jest.fn();
const mockDeleteConv = jest.fn();
const backMock = jest.fn();

jest.mock('../../store/services/messagesApi', () => ({
  useGetConversationQuery: (...args: unknown[]) =>
    mockUseGetConversationQuery(...args),
  useReplyToConversationMutation: () => [mockReply, { isLoading: false }],
  useUpdateConversationFlagsMutation: () => [mockUpdateFlags],
  useDeleteConversationMutation: () => [mockDeleteConv]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' })
}));

describe('ConversationView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'history', {
      configurable: true,
      value: { back: backMock }
    });
    mockUseGetConversationQuery.mockReturnValue({
      data: {
        id: 1,
        subject: 'Hello',
        participants: [
          {
            userId: 7,
            isSticky: true,
            user: { username: 'me' }
          },
          {
            userId: 8,
            isSticky: false,
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
        ]
      },
      isLoading: false,
      error: undefined
    });
    mockReply.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('renders participants, replies, toggles flags, and deletes conversations', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<ConversationView />, { store });

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'alice' }).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByTitle('Toggle sticky'));
    await user.click(screen.getByTitle('Mark unread'));
    await user.type(screen.getByLabelText(/^reply$/i), 'New reply');
    await user.click(screen.getByRole('button', { name: /send reply/i }));
    await user.click(screen.getByTitle('Delete conversation'));

    await waitFor(() => {
      expect(mockUpdateFlags).toHaveBeenNthCalledWith(1, {
        id: 1,
        isSticky: false
      });
      expect(mockUpdateFlags).toHaveBeenNthCalledWith(2, {
        id: 1,
        isRead: false
      });
      expect(mockReply).toHaveBeenCalledWith({ id: 1, body: 'New reply' });
      expect(mockDeleteConv).toHaveBeenCalledWith(1);
      expect(backMock).toHaveBeenCalled();
    });
  });

  it('does not send reply when body is empty (fireEvent bypass)', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<ConversationView />, { store });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    expect(mockReply).not.toHaveBeenCalled();
  });

  it('renders System span when message sender is null', () => {
    mockUseGetConversationQuery.mockReturnValue({
      data: {
        id: 1,
        subject: 'System Notice',
        participants: [
          { userId: 7, isSticky: false, user: { username: 'me' } }
        ],
        messages: [
          {
            id: 20,
            body: 'Auto-generated',
            createdAt: '2026-05-17T12:00:00.000Z',
            sender: null
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<ConversationView />, { store });
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders conversation with null participants and null messages', () => {
    mockUseGetConversationQuery.mockReturnValue({
      data: {
        id: 1,
        subject: 'Empty Conv',
        participants: null,
        messages: null
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<ConversationView />, { store });
    expect(screen.getByText('Empty Conv')).toBeInTheDocument();
  });

  it('renders participant without username as plain text', () => {
    mockUseGetConversationQuery.mockReturnValue({
      data: {
        id: 1,
        subject: 'Anon Conv',
        participants: [
          { userId: 7, isSticky: false, user: { username: 'me' } },
          { userId: 9, isSticky: false, user: { username: null } }
        ],
        messages: []
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<ConversationView />, { store });
    expect(screen.getByText('Anon Conv')).toBeInTheDocument();
  });

  it('shows not found and reply failure states', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'me',
        userRank: { permissions: {} }
      } as never)
    );
    mockReply.mockReturnValue({
      unwrap: () => Promise.reject(new Error('boom'))
    });

    renderWithProviders(<ConversationView />, { store });

    await user.type(screen.getByLabelText(/^reply$/i), 'Broken');
    await user.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to send reply.')).toBe(true);
    });

    mockUseGetConversationQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });

    renderWithProviders(<ConversationView />, { store });
    expect(screen.getByText('Conversation not found.')).toBeInTheDocument();
  });
});
