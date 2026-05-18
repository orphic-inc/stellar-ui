import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TopVotesPage from '../../components/top10/TopVotesPage';

const mockUseGetTopVotesQuery = jest.fn();

jest.mock('../../store/services/top10Api', () => ({
  useGetTopVotesQuery: (...args: unknown[]) =>
    mockUseGetTopVotesQuery(...args)
}));

const makeVoteItem = (id: number) => ({
  rank: id,
  releaseId: id,
  artistName: `Artist ${id}`,
  title: `Album ${id}`,
  year: 2020,
  ups: id * 8,
  downs: id * 2,
  total: id * 10,
  score: 0.7 + id * 0.01,
  positivePercent: 80.0
});

describe('TopVotesPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows spinner while loading', () => {
    mockUseGetTopVotesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<TopVotesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetTopVotesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<TopVotesPage />);
    expect(
      screen.getByText(/failed to load top votes/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no voted releases', () => {
    mockUseGetTopVotesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopVotesPage />);
    expect(
      screen.getByText(/no voted releases found/i)
    ).toBeInTheDocument();
  });

  it('renders release rows with up/down/total/score', () => {
    mockUseGetTopVotesQuery.mockReturnValue({
      data: { items: [makeVoteItem(1)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopVotesPage />);
    expect(
      screen.getByRole('link', { name: /artist 1 – album 1/i })
    ).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies filters on Apply button click', async () => {
    const user = userEvent.setup();
    mockUseGetTopVotesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopVotesPage />);
    await user.type(screen.getByPlaceholderText(/e\.g\. jazz/i), 'jazz');
    await user.type(screen.getByPlaceholderText('2020'), '2019');
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(mockUseGetTopVotesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ tags: 'jazz', year: 2019 })
    );
  });

  it('shows BPCI explanation text', () => {
    mockUseGetTopVotesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopVotesPage />);
    expect(
      screen.getByText(/binomial proportion confidence interval/i)
    ).toBeInTheDocument();
  });

  it('changes limit on select change', async () => {
    const user = userEvent.setup();
    mockUseGetTopVotesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopVotesPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /limit/i }),
      '100'
    );
    expect(mockUseGetTopVotesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });
});
