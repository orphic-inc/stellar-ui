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

  it('renders staff stats when the stats tab is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsQueuePage />);

    await user.click(screen.getByRole('button', { name: /^stats$/i }));

    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });
});
