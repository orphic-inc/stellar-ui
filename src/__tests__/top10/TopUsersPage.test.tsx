import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TopUsersPage from '../../components/top10/TopUsersPage';

const mockUseGetTopUsersQuery = jest.fn();

jest.mock('../../store/services/top10Api', () => ({
  useGetTopUsersQuery: (...args: unknown[]) => mockUseGetTopUsersQuery(...args)
}));

const makeItem = (id: number) => ({
  rank: id,
  userId: id,
  username: `user${id}`,
  rankName: 'Member',
  contributed: 10737418240,
  consumed: 5368709120,
  ratio: 2.0,
  numContributions: 42,
  contributionSpeed: 1048576,
  consumeSpeed: 524288,
  joinedAt: '2024-01-01T00:00:00.000Z'
});

describe('TopUsersPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows spinner while loading', () => {
    mockUseGetTopUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<TopUsersPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetTopUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<TopUsersPage />);
    expect(screen.getByText(/failed to load top users/i)).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    mockUseGetTopUsersQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopUsersPage />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('renders user rows with username and ratio', () => {
    mockUseGetTopUsersQuery.mockReturnValue({
      data: { items: [makeItem(1), makeItem(2)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopUsersPage />);
    expect(screen.getByRole('link', { name: 'user1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'user2' })).toBeInTheDocument();
    expect(screen.getAllByText('2.00').length).toBeGreaterThan(0);
  });

  it('defaults to contributed type', () => {
    mockUseGetTopUsersQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopUsersPage />);
    expect(mockUseGetTopUsersQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'contributed' })
    );
  });

  it('switches metric on select change', async () => {
    const user = userEvent.setup();
    mockUseGetTopUsersQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopUsersPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'consumed'
    );
    expect(mockUseGetTopUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'consumed' })
    );
  });

  it('shows numContributions column when numContributions type selected', async () => {
    const user = userEvent.setup();
    mockUseGetTopUsersQuery.mockReturnValue({
      data: { items: [makeItem(1)] },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<TopUsersPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: /metric/i }),
      'numContributions'
    );
    expect(screen.getByText('Contributions')).toBeInTheDocument();
  });

  it('paints the controls + table from the data-st contract (ADR-0006)', () => {
    mockUseGetTopUsersQuery.mockReturnValue({
      data: { items: [makeItem(1)] },
      isLoading: false,
      error: undefined
    });
    const { container } = renderWithProviders(<TopUsersPage />);
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
