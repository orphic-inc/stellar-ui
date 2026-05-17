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

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetTicketQuery: (...args: unknown[]) => mockUseGetTicketQuery(...args),
  useGetCannedResponsesQuery: (...args: unknown[]) =>
    mockUseGetCannedResponsesQuery(...args),
  useReplyToTicketMutation: () => [mockReplyToTicket, { isLoading: false }],
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
