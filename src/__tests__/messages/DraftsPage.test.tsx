import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DraftsPage from '../../components/messages/DraftsPage';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockUseGetDraftsQuery = jest.fn();
const mockDeleteDraft = jest.fn();

jest.mock('../../store/services/messagesApi', () => ({
  useGetDraftsQuery: () => mockUseGetDraftsQuery(),
  useDeleteDraftMutation: () => [mockDeleteDraft]
}));

describe('DraftsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetDraftsQuery.mockReturnValue({
      data: [
        {
          id: 1,
          subject: 'Draft subject',
          body: 'Body',
          updatedAt: '2026-05-17T12:00:00.000Z',
          toUser: { id: 8, username: 'alice' }
        }
      ],
      isLoading: false,
      error: undefined
    });
    mockDeleteDraft.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('renders drafts and shows a success alert when deleting', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<DraftsPage />, { store });

    expect(screen.getByRole('link', { name: 'Draft subject' })).toHaveAttribute(
      'href',
      '/private/messages/new?draft=1'
    );
    expect(screen.getByText('alice')).toBeInTheDocument();

    await user.click(screen.getByTitle('Delete draft'));

    await waitFor(() => {
      expect(mockDeleteDraft).toHaveBeenCalledWith(1);
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Draft deleted.')).toBe(true);
    });
  });

  it('shows empty, error, and delete-failure states', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockDeleteDraft.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Delete failed' } })
    });

    renderWithProviders(<DraftsPage />, { store });

    await user.click(screen.getByTitle('Delete draft'));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Delete failed')).toBe(true);
    });

    mockUseGetDraftsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DraftsPage />, { store });
    expect(screen.getByText('No saved drafts.')).toBeInTheDocument();

    mockUseGetDraftsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<DraftsPage />, { store });
    expect(screen.getByText('Failed to load drafts.')).toBeInTheDocument();
  });
});
