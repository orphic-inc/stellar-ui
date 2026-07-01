import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
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

  it('shows spinner while loading', () => {
    mockUseGetTicketQueueQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<TicketQueuePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state on failure', () => {
    mockUseGetTicketQueueQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<TicketQueuePage />);
    expect(
      screen.getByText(/failed to load ticket queue/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no tickets match filter', () => {
    mockUseGetTicketQueueQuery.mockReturnValue({
      data: { total: 0, pageSize: 25, conversations: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TicketQueuePage />);
    expect(
      screen.getByText(/no tickets match this filter/i)
    ).toBeInTheDocument();
  });

  it('renders ticket rows with subject links, status badges, and assigned user', () => {
    renderWithProviders(<TicketQueuePage />);
    expect(
      screen.getByRole('link', { name: /first ticket/i })
    ).toBeInTheDocument();
    // "Unanswered" appears in both the status filter dropdown and the badge
    expect(screen.getAllByText('Unanswered').length).toBeGreaterThan(0);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();

    // Theming contract: table variant, field controls, status chip.
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(
      document.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    expect(document.querySelector('[data-st="chip"]')).toBeInTheDocument();
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

  it('deselects a ticket when its checkbox is clicked twice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketQueuePage />);

    // Find the checkbox in the row that contains "First ticket"
    const row = screen
      .getByRole('link', { name: /first ticket/i })
      .closest('tr')!;
    const ticketCheckbox = within(row).getByRole('checkbox');

    await user.click(ticketCheckbox); // select
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user.click(ticketCheckbox); // deselect
    expect(screen.queryByText(/selected/)).toBeNull();
  });

  it('toggles select-all and deselect-all via the header checkbox', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketQueuePage />);

    const thead = document.querySelector('thead')!;
    const headerCheckbox = within(thead).getByRole('checkbox');

    await user.click(headerCheckbox); // select all
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await user.click(headerCheckbox); // deselect all
    expect(screen.queryByText(/selected/)).toBeNull();
  });

  it('shows pagination and navigates to next page', async () => {
    const user = userEvent.setup();
    mockUseGetTicketQueueQuery.mockReturnValue({
      data: { total: 50, pageSize: 25, conversations: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TicketQueuePage />);

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(mockUseGetTicketQueueQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it('unchecks assignedToMe without affecting unassigned (false branch of if(e.target.checked))', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketQueuePage />);
    await user.click(screen.getByLabelText('Assigned to me'));
    await user.click(screen.getByLabelText('Assigned to me'));
    expect(mockUseGetTicketQueueQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ assignedToMe: false })
    );
  });

  it('unchecks Unassigned only without affecting assignedToMe', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketQueuePage />);
    await user.click(screen.getByLabelText('Unassigned only'));
    await user.click(screen.getByLabelText('Unassigned only'));
    expect(mockUseGetTicketQueueQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ unassigned: false })
    );
  });

  it('renders "—" for null user and fallback badge for unknown status', () => {
    mockUseGetTicketQueueQuery.mockReturnValue({
      data: {
        total: 1,
        page: 1,
        pageSize: 25,
        conversations: [
          {
            id: 9,
            subject: 'Odd ticket',
            status: 'Unknown',
            user: null,
            assignedUser: null,
            updatedAt: '2026-05-17T12:00:00.000Z'
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TicketQueuePage />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('navigates to previous page when Previous button is clicked', async () => {
    const user = userEvent.setup();
    mockUseGetTicketQueueQuery.mockReturnValue({
      data: { total: 50, pageSize: 25, conversations: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TicketQueuePage />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(mockUseGetTicketQueueQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('toggles Unassigned filter and clears Assigned to me', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketQueuePage />);

    await user.click(screen.getByLabelText('Assigned to me'));
    await user.click(screen.getByLabelText('Unassigned only'));

    expect(mockUseGetTicketQueueQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ assignedToMe: false, unassigned: true })
    );
  });
});
