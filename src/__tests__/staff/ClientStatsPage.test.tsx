import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ClientStatsPage from '../../components/staff/ClientStatsPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetClientStatsQuery: () => mockQuery()
}));

describe('ClientStatsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<ClientStatsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders client rows on the grid table', () => {
    mockQuery.mockReturnValue({
      data: [{ userAgent: 'Firefox', count: 12 }],
      isLoading: false
    });
    renderWithProviders(<ClientStatsPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('Firefox')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows "unknown" for a null user agent', () => {
    mockQuery.mockReturnValue({
      data: [{ userAgent: null, count: 3 }],
      isLoading: false
    });
    renderWithProviders(<ClientStatsPage />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
