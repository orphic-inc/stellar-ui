import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import EconomicStatsPage from '../../components/staff/EconomicStatsPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetEconomyStatsQuery: () => mockQuery()
}));

const data = {
  grouped: [{ reason: 'upload', _count: 5, _sum: { amount: 1000 } }],
  recent: [
    {
      id: 1,
      user: { id: 7, username: 'alice' },
      reason: 'upload',
      amount: 50,
      createdAt: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 2,
      user: { id: 8, username: 'bob' },
      reason: 'penalty',
      amount: -25,
      createdAt: '2026-01-03T00:00:00.000Z'
    }
  ]
};

describe('EconomicStatsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders both sections as grid tables', () => {
    mockQuery.mockReturnValue({ data, isLoading: false });
    renderWithProviders(<EconomicStatsPage />);
    expect(screen.getByText('Totals by Reason')).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(document.querySelectorAll('table[data-st="grid"]')).toHaveLength(2);
  });

  it('signs transaction amounts', () => {
    mockQuery.mockReturnValue({ data, isLoading: false });
    renderWithProviders(<EconomicStatsPage />);
    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('-25')).toBeInTheDocument();
  });
});
