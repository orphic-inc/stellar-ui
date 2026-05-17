import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import MyReportsPage from '../../components/reports/MyReportsPage';

const mockUseGetMyReportsQuery = jest.fn();

jest.mock('../../store/services/reportsApi', () => ({
  useGetMyReportsQuery: (...args: unknown[]) =>
    mockUseGetMyReportsQuery(...args)
}));

describe('MyReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the empty state when the user has not filed reports', () => {
    mockUseGetMyReportsQuery.mockReturnValue({
      data: { total: 0, page: 1, pageSize: 25, reports: [] },
      isLoading: false,
      error: undefined
    });

    renderWithProviders(<MyReportsPage />);

    expect(
      screen.getByText("You haven't filed any reports yet.")
    ).toBeInTheDocument();
  });

  it('renders resolved reports and links to the detail page', () => {
    mockUseGetMyReportsQuery.mockReturnValue({
      data: {
        total: 1,
        page: 1,
        pageSize: 25,
        reports: [
          {
            id: 5,
            targetType: 'ForumPost',
            category: 'spam',
            status: 'Resolved',
            createdAt: '2026-05-17T12:00:00.000Z',
            resolvedAt: '2026-05-18T12:00:00.000Z'
          }
        ]
      },
      isLoading: false,
      error: undefined
    });

    renderWithProviders(<MyReportsPage />);

    expect(screen.getByRole('link', { name: 'spam' })).toHaveAttribute(
      'href',
      '/private/reports/5'
    );
    expect(screen.getAllByText('Resolved')).toHaveLength(2);
  });
});
