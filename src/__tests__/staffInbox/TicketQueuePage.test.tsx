import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TicketQueuePage from '../../components/staffInbox/TicketQueuePage';

const mockUseGetTicketQueueQuery = jest.fn();
const mockBulkResolve = jest.fn();

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetTicketQueueQuery: (...args: unknown[]) =>
    mockUseGetTicketQueueQuery(...args),
  useBulkResolveTicketsMutation: () => [mockBulkResolve]
}));

describe('TicketQueuePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    mockUseGetTicketQueueQuery.mockImplementation((params) => ({
      data: {
        total: 2,
        page: params.page ?? 1,
        pageSize: 25,
        conversations: [
          {
            id: 1,
            subject: 'First ticket',
            status: 'Unanswered',
            user: { username: 'alice' },
            assignedUser: null,
            updatedAt: '2026-05-17T12:00:00.000Z'
          },
          {
            id: 2,
            subject: 'Second ticket',
            status: 'Open',
            user: { username: 'bob' },
            assignedUser: { username: 'mod-one' },
            updatedAt: '2026-05-17T12:00:00.000Z'
          }
        ]
      },
      isLoading: false,
      error: undefined
    }));
    mockBulkResolve.mockReturnValue({
      unwrap: () => Promise.resolve({ ok: true, resolved: 2 })
    });
  });

  it('applies queue filters and bulk resolves selected tickets', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketQueuePage />);

    await user.selectOptions(screen.getByLabelText('Status:'), 'Open');
    await user.click(screen.getByLabelText('Assigned to me'));

    expect(mockUseGetTicketQueueQuery).toHaveBeenLastCalledWith({
      page: 1,
      status: 'Open',
      assignedToMe: true,
      unassigned: false
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await user.click(screen.getByRole('button', { name: /resolve all/i }));

    await waitFor(() => {
      expect(mockBulkResolve).toHaveBeenCalledWith({ ids: [1, 2] });
      expect(window.alert).toHaveBeenCalledWith('Resolved 2 ticket(s).');
    });
  });
});
