import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TopReleasesPage from '../../components/top10/TopReleasesPage';

const mockUseGetTopReleasesQuery = jest.fn();

jest.mock('../../store/services/top10Api', () => ({
  useGetTopReleasesQuery: (...args: unknown[]) =>
    mockUseGetTopReleasesQuery(...args)
}));

const makeItem = (id: number) => ({
  rank: id,
  releaseId: id,
  artistName: `Artist ${id}`,
  title: `Release ${id}`,
  year: 2020,
  tags: [{ id: 1, name: 'jazz' }],
  consumerCount: id * 10,
  totalBytesConsumed: 1073741824,
  contributionCount: id * 2
});

describe('TopReleasesPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows spinner while loading', () => {
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<TopReleasesPage />);
    expect(
      screen.getByText(/failed to load top releases/i)
    ).toBeInTheDocument();
  });

  it('shows empty state row when no items', () => {
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    expect(screen.getByText(/no data for this period/i)).toBeInTheDocument();
  });

  it('renders release rows with rank, title, and stats', () => {
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [makeItem(1), makeItem(2)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    expect(
      screen.getByRole('link', { name: /artist 1 – release 1/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /artist 2 – release 2/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText('jazz').length).toBeGreaterThan(0);
  });

  it('queries with default type=overall and limit=10', () => {
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    expect(mockUseGetTopReleasesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'overall', limit: 10 })
    );
  });

  it('changes type filter on select change', async () => {
    const user = userEvent.setup();
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /period \/ type/i }),
      'week'
    );
    expect(mockUseGetTopReleasesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'week' })
    );
  });

  it('applies exclude tags filter on button click', async () => {
    const user = userEvent.setup();
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    await user.type(
      screen.getByPlaceholderText(/e\.g\. pop, rock/i),
      'classical'
    );
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(mockUseGetTopReleasesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ excludeTags: 'classical' })
    );
  });

  it('applies exclude tags on Enter key', async () => {
    const user = userEvent.setup();
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopReleasesPage />);
    await user.type(
      screen.getByPlaceholderText(/e\.g\. pop, rock/i),
      'metal{Enter}'
    );
    expect(mockUseGetTopReleasesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ excludeTags: 'metal' })
    );
  });

  it('paints the controls + table from the data-st contract (ADR-0006)', () => {
    mockUseGetTopReleasesQuery.mockReturnValue({
      data: { items: [makeItem(1)] },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<TopReleasesPage />);
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      container.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('button[data-st="control"][data-st-primary]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('table[data-st="grid"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('thead[data-st="colhead"]')
    ).toBeInTheDocument();
    expect(container.querySelector('tr[data-st="row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="title"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="chip"]')).toBeInTheDocument();
  });
});
