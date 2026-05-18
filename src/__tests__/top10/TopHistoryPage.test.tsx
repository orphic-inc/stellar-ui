import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TopHistoryPage from '../../components/top10/TopHistoryPage';

const mockUseGetTop10HistoryQuery = jest.fn();

jest.mock('../../store/services/top10Api', () => ({
  useGetTop10HistoryQuery: (...args: unknown[]) =>
    mockUseGetTop10HistoryQuery(...args)
}));

const makeSnapshot = (type: 'Daily' | 'Weekly') => ({
  type,
  date: '2026-05-17T00:00:00.000Z',
  entries: [
    {
      rank: 1,
      releaseId: 10,
      releaseTitle: 'Kind of Blue',
      tagString: 'jazz, modal',
      deleted: false
    },
    {
      rank: 2,
      releaseId: null,
      releaseTitle: 'Deleted Album',
      tagString: 'pop',
      deleted: true
    }
  ]
});

describe('TopHistoryPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows spinner while loading', () => {
    mockUseGetTop10HistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: undefined
    });
    renderWithProviders(<TopHistoryPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows not-found message on error', () => {
    mockUseGetTop10HistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: { status: 404 }
    });
    renderWithProviders(<TopHistoryPage />);
    expect(screen.getByText(/no snapshot found/i)).toBeInTheDocument();
  });

  it('renders snapshot entries with links for live releases', () => {
    mockUseGetTop10HistoryQuery.mockReturnValue({
      data: makeSnapshot('Daily'),
      isLoading: false,
      isFetching: false,
      error: undefined
    });
    renderWithProviders(<TopHistoryPage />);
    expect(
      screen.getByRole('link', { name: 'Kind of Blue' })
    ).toBeInTheDocument();
    expect(screen.getByText('jazz, modal')).toBeInTheDocument();
  });

  it('renders deleted entry as plain text with deleted label', () => {
    mockUseGetTop10HistoryQuery.mockReturnValue({
      data: makeSnapshot('Daily'),
      isLoading: false,
      isFetching: false,
      error: undefined
    });
    renderWithProviders(<TopHistoryPage />);
    expect(screen.getByText('Deleted Album')).toBeInTheDocument();
    expect(screen.getByText('(deleted)')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Deleted Album' })
    ).not.toBeInTheDocument();
  });

  it('queries with default Daily type', () => {
    mockUseGetTop10HistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: undefined
    });
    renderWithProviders(<TopHistoryPage />);
    expect(mockUseGetTop10HistoryQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Daily' })
    );
  });

  it('switches to Weekly type on select', async () => {
    const user = userEvent.setup();
    mockUseGetTop10HistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: undefined
    });
    renderWithProviders(<TopHistoryPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /snapshot type/i }),
      'Weekly'
    );
    expect(mockUseGetTop10HistoryQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'Weekly' })
    );
  });
});
