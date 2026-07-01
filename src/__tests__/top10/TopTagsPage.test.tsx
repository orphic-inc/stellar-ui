import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TopTagsPage from '../../components/top10/TopTagsPage';

const mockUseGetTopTagsQuery = jest.fn();

jest.mock('../../store/services/top10Api', () => ({
  useGetTopTagsQuery: (...args: unknown[]) => mockUseGetTopTagsQuery(...args)
}));

const makeTagItem = (id: number, name: string) => ({
  rank: id,
  tagId: id,
  name,
  uses: id * 100,
  positiveVotes: id * 50,
  negativeVotes: id * 10
});

describe('TopTagsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows spinner while loading', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<TopTagsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<TopTagsPage />);
    expect(screen.getByText(/failed to load top tags/i)).toBeInTheDocument();
  });

  it('shows empty state when no tags', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopTagsPage />);
    expect(screen.getByText(/no tags found/i)).toBeInTheDocument();
  });

  it('renders tag rows with name and uses', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: {
        items: [makeTagItem(1, 'jazz'), makeTagItem(2, 'blues')]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopTagsPage />);
    expect(screen.getByRole('link', { name: 'jazz' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'blues' })).toBeInTheDocument();
  });

  it('defaults to used type and does not show vote columns', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: { items: [makeTagItem(1, 'jazz')] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopTagsPage />);
    expect(mockUseGetTopTagsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'used' })
    );
    expect(screen.queryByText(/positive/i)).not.toBeInTheDocument();
  });

  it('shows vote columns when voted type is selected', async () => {
    const user = userEvent.setup();
    mockUseGetTopTagsQuery.mockReturnValue({
      data: { items: [makeTagItem(1, 'jazz')] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopTagsPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /view/i }),
      'voted'
    );
    expect(screen.getByText('Positive')).toBeInTheDocument();
    expect(screen.getByText('Negative')).toBeInTheDocument();
  });

  it('links tags to releases search page', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: { items: [makeTagItem(1, 'jazz')] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopTagsPage />);
    const link = screen.getByRole('link', { name: 'jazz' });
    expect(link.getAttribute('href')).toContain('jazz');
  });

  it('paints the controls + table from the data-st contract (ADR-0006)', () => {
    mockUseGetTopTagsQuery.mockReturnValue({
      data: { items: [makeTagItem(1, 'jazz')] },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<TopTagsPage />);
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      container.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('table[data-st="grid"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('thead[data-st="colhead"]')
    ).toBeInTheDocument();
    expect(container.querySelector('tr[data-st="row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-st="title"]')).toBeInTheDocument();
  });
});
