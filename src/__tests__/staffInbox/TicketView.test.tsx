import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import { selectAlerts } from '../../store/slices/alertSlice';
import TicketView from '../../components/staffInbox/TicketView';

const mockUseGetTicketQuery = jest.fn();
const mockUseGetCannedResponsesQuery = jest.fn();
const mockReplyToTicket = jest.fn();
const mockResolveTicket = jest.fn();
const mockUnresolveTicket = jest.fn();
const mockAssignTicket = jest.fn();
const mockUseParams = jest.fn();

let mockIsReplying = false;

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetTicketQuery: (...args: unknown[]) => mockUseGetTicketQuery(...args),
  useGetCannedResponsesQuery: (...args: unknown[]) =>
    mockUseGetCannedResponsesQuery(...args),
  useReplyToTicketMutation: () => [
    mockReplyToTicket,
    { isLoading: mockIsReplying }
  ],
  useResolveTicketMutation: () => [mockResolveTicket, { isLoading: false }],
  useUnresolveTicketMutation: () => [mockUnresolveTicket, { isLoading: false }],
  useAssignTicketMutation: () => [mockAssignTicket, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams()
}));

describe('TicketView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReplying = false;
    mockUseParams.mockReturnValue({ id: '15' });
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Need moderator help',
        status: 'Unanswered',
        user: { id: 7, username: 'regular' },
        assignedUser: { id: 9, username: 'mod-one' },
        messages: [
          {
            id: 1,
            body: 'Original issue',
            createdAt: '2026-05-17T12:00:00.000Z',
            sender: { id: 7, username: 'regular' }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    mockUseGetCannedResponsesQuery.mockReturnValue({
      data: [{ id: 2, name: 'Template', body: 'Use this canned reply.' }]
    });
    mockReplyToTicket.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 2 })
    });
    mockResolveTicket.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockUnresolveTicket.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockAssignTicket.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('lets staff apply canned responses, reply, resolve, and assign tickets', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.selectOptions(
      screen.getByLabelText(/use canned response/i),
      '2'
    );
    expect(screen.getByLabelText('Reply')).toHaveValue(
      'Use this canned reply.'
    );

    await user.type(screen.getByLabelText('Reply'), ' Extra context.');
    await user.click(screen.getByRole('button', { name: /send reply/i }));
    await user.click(screen.getByRole('button', { name: /^resolve$/i }));
    await user.type(screen.getByLabelText(/assign to:/i), 'staff-two');
    await user.click(screen.getByRole('button', { name: /^assign$/i }));

    await waitFor(() => {
      expect(mockReplyToTicket).toHaveBeenCalledWith({
        id: 15,
        body: 'Use this canned reply. Extra context.'
      });
      expect(mockResolveTicket).toHaveBeenCalledWith(15);
      expect(mockAssignTicket).toHaveBeenCalledWith({
        id: 15,
        assignedUsername: 'staff-two'
      });
    });
  });

  it('shows spinner while loading', () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when ticket is not found', () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(screen.getByText(/ticket not found/i)).toBeInTheDocument();
  });

  it('does not submit reply when body is empty', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    // Leave reply body empty and click Send Reply
    await user.click(screen.getByRole('button', { name: /send reply/i }));
    expect(mockReplyToTicket).not.toHaveBeenCalled();
  });

  it('dispatches danger alert when resolve fails', async () => {
    mockResolveTicket.mockReturnValue({
      unwrap: () => Promise.reject(new Error('server error'))
    });
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.click(screen.getByRole('button', { name: /^resolve$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to resolve ticket.')).toBe(
        true
      );
    });
  });

  it('calls unresolveTicket when Unresolve is clicked on a resolved ticket', async () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Need moderator help',
        status: 'Resolved',
        user: { id: 7, username: 'regular' },
        assignedUser: null,
        messages: []
      },
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.click(screen.getByRole('button', { name: /unresolve/i }));

    await waitFor(() => {
      expect(mockUnresolveTicket).toHaveBeenCalledWith(15);
    });
  });

  it('assigns with null userId when username field is empty', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    // Submit assign form with empty username (should unassign)
    await user.click(screen.getByRole('button', { name: /^assign$/i }));

    await waitFor(() => {
      expect(mockAssignTicket).toHaveBeenCalledWith({
        id: 15,
        assignedUserId: null
      });
    });
  });

  it('dispatches danger alert when reply fails', async () => {
    mockReplyToTicket.mockReturnValue({
      unwrap: () => Promise.reject(new Error('server error'))
    });
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.type(screen.getByLabelText('Reply'), 'My reply.');
    await user.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to send reply.')).toBe(true);
    });
  });

  it('clears reply body when empty canned response option is selected', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.selectOptions(
      screen.getByLabelText(/use canned response/i),
      '2'
    );
    expect(screen.getByLabelText('Reply')).toHaveValue(
      'Use this canned reply.'
    );

    await user.selectOptions(screen.getByLabelText(/use canned response/i), '');
    expect(screen.getByLabelText('Reply')).toHaveValue(
      'Use this canned reply.'
    );
  });

  it('dispatches danger alert when unresolve fails', async () => {
    mockUnresolveTicket.mockReturnValue({
      unwrap: () => Promise.reject(new Error('server error'))
    });
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Need moderator help',
        status: 'Resolved',
        user: { id: 7, username: 'regular' },
        assignedUser: null,
        messages: []
      },
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.click(screen.getByRole('button', { name: /unresolve/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to unresolve ticket.')).toBe(
        true
      );
    });
  });

  it('shows My Tickets link and Resolve button for non-staff ticket owner', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'regular',
        userRank: { permissions: {} }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(
      screen.getByRole('link', { name: /← my tickets/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^resolve$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^assign$/i })
    ).not.toBeInTheDocument();
  });

  it('shows fallback badge for unknown ticket status', () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Test',
        status: 'CustomStatus',
        user: { id: 7, username: 'regular' },
        assignedUser: null,
        messages: []
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(screen.getByText('CustomStatus')).toBeInTheDocument();
  });

  it('renders ticket with null messages without crashing', () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Test',
        status: 'Unanswered',
        user: { id: 7, username: 'regular' },
        assignedUser: null,
        messages: undefined
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows System as sender when message sender is null', () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Test',
        status: 'Unanswered',
        user: { id: 7, username: 'regular' },
        assignedUser: null,
        messages: [
          {
            id: 5,
            body: 'Auto-reply',
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
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('shows Staff badge on messages where sender is not the ticket owner', () => {
    mockUseGetTicketQuery.mockReturnValue({
      data: {
        id: 15,
        subject: 'Test',
        status: 'Unanswered',
        user: { id: 7, username: 'regular' },
        assignedUser: null,
        messages: [
          {
            id: 2,
            body: 'Staff reply',
            createdAt: '2026-05-17T12:00:00.000Z',
            sender: { id: 9, username: 'mod-one' }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('shows "Sending…" when replying is in progress', () => {
    mockIsReplying = true;
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });
    expect(
      screen.getByRole('button', { name: /sending…/i })
    ).toBeInTheDocument();
  });

  it('shows an alert when assignment fails', async () => {
    const user = userEvent.setup();
    mockAssignTicket.mockReturnValue({
      unwrap: () => Promise.reject(new Error('nope'))
    });

    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod-one',
        userRank: { permissions: { staff: true } }
      } as never)
    );
    renderWithProviders(<TicketView />, { store });

    await user.type(screen.getByLabelText(/assign to:/i), 'staff-two');
    await user.click(screen.getByRole('button', { name: /^assign$/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to assign ticket.')).toBe(
        true
      );
    });
  });
});
