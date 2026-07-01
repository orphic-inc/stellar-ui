import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxPage from '../../components/messages/InboxPage';
import { renderWithProviders } from '../testUtils';

const mockUseGetInboxQuery = jest.fn();
const mockDeleteConversation = jest.fn();
const mockBulkUpdate = jest.fn();

jest.mock('../../store/services/messagesApi', () => ({
  useGetInboxQuery: (...args: unknown[]) => mockUseGetInboxQuery(...args),
  useDeleteConversationMutation: () => [mockDeleteConversation],
  useBulkUpdateConversationsMutation: () => [mockBulkUpdate]
}));

describe('InboxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetInboxQuery.mockReturnValue({
      data: {
        total: 30,
        page: 1,
        pageSize: 25,
        conversations: [
          {
            id: 1,
            subject: 'Unread thread',
            participants: [
              {
                userId: 7,
                isRead: false,
                isSticky: true,
                receivedAt: '2026-05-17T12:00:00.000Z'
              }
            ],
            messages: [{ sender: { username: 'alice' } }]
          },
          {
            id: 2,
            subject: 'Read thread',
            participants: [
              {
                userId: 7,
                isRead: true,
                isSticky: false,
                receivedAt: '2026-05-16T12:00:00.000Z'
              }
            ],
            messages: [{ sender: { username: 'bob' } }]
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
  });

  it('renders inbox rows, supports bulk actions, direct delete, and pagination', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InboxPage />);

    expect(mockUseGetInboxQuery).toHaveBeenCalledWith({ page: 1 });
    expect(screen.getByRole('link', { name: 'Compose' })).toHaveAttribute(
      'href',
      '/private/messages/new'
    );
    expect(screen.getByText('Unread thread')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('★')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole('button', { name: /mark read/i }));

    await waitFor(() => {
      expect(mockBulkUpdate).toHaveBeenCalledWith({
        ids: [1],
        action: 'markRead'
      });
    });

    await user.click(screen.getAllByTitle('Delete')[0]);
    expect(mockDeleteConversation).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockUseGetInboxQuery).toHaveBeenLastCalledWith({ page: 2 });
  });

  it('deselects an item and supports select-all / deselect-all', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InboxPage />);

    const [headerCheckbox, row1Checkbox] = screen.getAllByRole('checkbox');

    await user.click(row1Checkbox);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user.click(row1Checkbox); // deselect (filter branch)
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();

    await user.click(headerCheckbox); // select all
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await user.click(headerCheckbox); // deselect all ([] branch)
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it('covers markUnread and bulk delete toolbar actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InboxPage />);

    const [, row1Checkbox] = screen.getAllByRole('checkbox');

    await user.click(row1Checkbox);
    await user.click(screen.getByRole('button', { name: /mark unread/i }));
    await waitFor(() =>
      expect(mockBulkUpdate).toHaveBeenCalledWith({
        ids: [1],
        action: 'markUnread'
      })
    );

    await user.click(row1Checkbox);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() =>
      expect(mockBulkUpdate).toHaveBeenCalledWith({
        ids: [1],
        action: 'delete'
      })
    );
  });

  it('navigates to page 2 then back via Previous', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InboxPage />);

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockUseGetInboxQuery).toHaveBeenLastCalledWith({ page: 2 });
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(mockUseGetInboxQuery).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('carries the data-st table hooks (theming contract)', () => {
    renderWithProviders(<InboxPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(
      document.querySelector('thead[data-st="colhead"]')
    ).toBeInTheDocument();
    expect(document.querySelector('tr[data-st="row"]')).toBeInTheDocument();
  });

  it('shows empty and error states', () => {
    mockUseGetInboxQuery.mockReturnValue({
      data: { total: 0, page: 1, pageSize: 25, conversations: [] },
      isLoading: false,
      error: undefined
    });

    const { rerender } = renderWithProviders(<InboxPage />);
    expect(screen.getByText('Your inbox is empty.')).toBeInTheDocument();

    mockUseGetInboxQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });

    rerender(<InboxPage />);
    expect(screen.getByText('Failed to load inbox.')).toBeInTheDocument();
  });
});
