import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ReportsQueuePage from '../../components/reports/ReportsQueuePage';

const mockUseGetReportsQuery = jest.fn();
const mockUseGetReportCountsQuery = jest.fn();
const mockUseGetReportStatsQuery = jest.fn();

jest.mock('../../store/services/reportsApi', () => ({
  useGetReportsQuery: (...args: unknown[]) => mockUseGetReportsQuery(...args),
  useGetReportCountsQuery: (...args: unknown[]) =>
    mockUseGetReportCountsQuery(...args),
  useGetReportStatsQuery: (...args: unknown[]) =>
    mockUseGetReportStatsQuery(...args)
}));

describe('ReportsQueuePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetReportsQuery.mockImplementation((params) => ({
      data: {
        total: 1,
        page: params.page ?? 1,
        pageSize: 25,
        reports: [
          {
            id: 1,
            targetType: 'ForumPost',
            targetId: 42,
            category: 'spam',
            status: 'Open',
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
        ]
      },
      isLoading: false,
      error: undefined
    }));
    mockUseGetReportCountsQuery.mockReturnValue({
      data: { open: 3, claimed: 1 }
    });
    mockUseGetReportStatsQuery.mockReturnValue({
      data: {
        last24h: 2,
        lastWeek: 5,
        lastMonth: 9,
        allTime: 30,
        byStaff: [{ userId: 7, username: 'mod-one', count: 11 }]
      }
    });
  });

  it('applies queue filters and expands inline notes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);

    await user.selectOptions(screen.getByLabelText('Status:'), 'Claimed');
    await user.selectOptions(screen.getByLabelText('Type:'), 'ForumPost');
    await user.click(screen.getByLabelText(/claimed by me/i));
    await user.type(screen.getByLabelText('Reporter:'), 'alice');
    await user.click(screen.getByRole('button', { name: /^filter$/i }));

    expect(mockUseGetReportsQuery).toHaveBeenLastCalledWith({
      page: 1,
      status: 'Claimed',
      targetType: 'ForumPost',
      claimedByMe: true,
      reporterUsername: 'alice'
    });

    await user.click(screen.getByRole('button', { name: /1 note/i }));

    await waitFor(() => {
      expect(screen.getByText('Investigated')).toBeInTheDocument();
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  it('collapses notes after expanding them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);

    // Expand if not already open (button text may be '1 note' or 'hide')
    const expandBtn = screen
      .getAllByRole('button')
      .find((b) => /\d+ note/i.test(b.textContent ?? ''));
    if (expandBtn) {
      await user.click(expandBtn);
      await waitFor(() =>
        expect(screen.getByText('Investigated')).toBeInTheDocument()
      );
    }

    await user.click(screen.getByRole('button', { name: /^hide$/i }));
    await waitFor(() =>
      expect(screen.queryByText('Investigated')).not.toBeInTheDocument()
    );
  });

  it('clears reporter filter via × button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);

    await user.type(screen.getByLabelText('Reporter:'), 'alice');
    await user.click(screen.getByRole('button', { name: /^filter$/i }));
    expect(mockUseGetReportsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ reporterUsername: 'alice' })
    );

    await user.click(screen.getByRole('button', { name: '×' }));
    expect(mockUseGetReportsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ reporterUsername: undefined })
    );
  });

  it('shows pagination and supports Previous and Next', async () => {
    const user = userEvent.setup();
    mockUseGetReportsQuery.mockImplementation((params) => ({
      data: {
        total: 50,
        page: params.page ?? 1,
        pageSize: 25,
        reports: []
      },
      isLoading: false,
      error: undefined
    }));
    renderWithProviders(<ReportsQueuePage />);

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockUseGetReportsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 })
    );

    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(mockUseGetReportsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('renders staff stats when the stats tab is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);

    await user.click(screen.getByRole('button', { name: /^stats$/i }));

    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('shows spinner while reports are loading', () => {
    mockUseGetReportsQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: true,
      error: undefined
    }));
    renderWithProviders(<ReportsQueuePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when reports fail to load', () => {
    mockUseGetReportsQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    }));
    renderWithProviders(<ReportsQueuePage />);
    expect(
      screen.getByText(/failed to load reports queue/i)
    ).toBeInTheDocument();
  });

  it('shows spinner in stats tab when stats are loading', async () => {
    mockUseGetReportStatsQuery.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);
    await user.click(screen.getByRole('button', { name: /^stats$/i }));
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('applies reporter filter when Enter is pressed in the reporter input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);
    await user.type(screen.getByLabelText('Reporter:'), 'bob{Enter}');
    expect(mockUseGetReportsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ reporterUsername: 'bob' })
    );
  });

  it('renders a link when report has sourceUrl and shows claimedBy username', () => {
    mockUseGetReportsQuery.mockImplementation(() => ({
      data: {
        total: 1,
        page: 1,
        pageSize: 25,
        reports: [
          {
            id: 2,
            targetType: 'ForumPost',
            targetId: 42,
            category: 'spam',
            status: 'Open',
            claimedBy: { username: 'mod-one' },
            createdAt: '2026-05-17T12:00:00.000Z',
            reporter: { username: 'bob' },
            sourceUrl: '/private/forum/post/42',
            notes: []
          }
        ]
      },
      isLoading: false,
      error: undefined
    }));
    renderWithProviders(<ReportsQueuePage />);
    expect(screen.getByRole('link', { name: '#42' })).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();
  });

  it('renders fallback badge for unknown report status and dash for empty notes', () => {
    mockUseGetReportsQuery.mockImplementation(() => ({
      data: {
        total: 1,
        page: 1,
        pageSize: 25,
        reports: [
          {
            id: 3,
            targetType: 'User',
            targetId: 5,
            category: 'harassment',
            status: 'CustomStatus',
            claimedBy: null,
            createdAt: '2026-05-17T12:00:00.000Z',
            reporter: { username: 'charlie' },
            notes: []
          }
        ]
      },
      isLoading: false,
      error: undefined
    }));
    renderWithProviders(<ReportsQueuePage />);
    expect(screen.getByText('CustomStatus')).toBeInTheDocument();
  });

  it('shows plural "notes" label when a report has multiple notes', () => {
    mockUseGetReportsQuery.mockImplementation(() => ({
      data: {
        total: 1,
        page: 1,
        pageSize: 25,
        reports: [
          {
            id: 4,
            targetType: 'ForumPost',
            targetId: 10,
            category: 'spam',
            status: 'Open',
            claimedBy: null,
            createdAt: '2026-05-17T12:00:00.000Z',
            reporter: { username: 'dave' },
            notes: [
              {
                id: 1,
                body: 'Note A',
                createdAt: '2026-05-17T12:00:00.000Z',
                author: { username: 'mod' }
              },
              {
                id: 2,
                body: 'Note B',
                createdAt: '2026-05-17T12:00:00.000Z',
                author: { username: 'mod' }
              }
            ]
          }
        ]
      },
      isLoading: false,
      error: undefined
    }));
    renderWithProviders(<ReportsQueuePage />);
    expect(
      screen.getByRole('button', { name: /2 notes/i })
    ).toBeInTheDocument();
  });
});
