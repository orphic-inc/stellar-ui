import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import UserFlowPage from '../../components/staff/UserFlowPage';

const mockUseGetUserFlowQuery = jest.fn();

jest.mock('../../store/services/adminApi', () => ({
  useGetUserFlowQuery: () => mockUseGetUserFlowQuery()
}));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

describe('UserFlowPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while loading', () => {
    mockUseGetUserFlowQuery.mockReturnValue({
      data: undefined,
      isLoading: true
    });
    renderWithProviders(<UserFlowPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the funnel tiles and the growth grid table', () => {
    mockUseGetUserFlowQuery.mockReturnValue({
      data: {
        inviteFunnel: [{ status: 'PENDING', _count: 9 }],
        snapshots: [
          {
            bucketAt: '2026-06-01T00:00:00Z',
            totalUsers: 4200,
            activeThisMonth: 311
          }
        ]
      },
      isLoading: false
    });
    renderWithProviders(<UserFlowPage />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('4,200')).toBeInTheDocument();
  });

  it('shows the snapshots empty state', () => {
    mockUseGetUserFlowQuery.mockReturnValue({
      data: { inviteFunnel: [], snapshots: [] },
      isLoading: false
    });
    renderWithProviders(<UserFlowPage />);
    expect(screen.getByText(/no snapshots available/i)).toBeInTheDocument();
  });
});
