import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommunitiesPage from '../../components/communities/CommunitiesPage';

const mockUseGetCommunitiesQuery = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetCommunitiesQuery: (...args: unknown[]) =>
    mockUseGetCommunitiesQuery(...args)
}));

const makeCommunity = (id: number, name: string) => ({
  id,
  name,
  description: `Desc ${id}`,
  image: null,
  registrationStatus: 'Open',
  _count: { consumers: 5 }
});

describe('CommunitiesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows spinner while loading', () => {
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<CommunitiesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<CommunitiesPage />);
    expect(screen.getByText(/failed to load communities/i)).toBeInTheDocument();
  });

  it('renders community list from response', () => {
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: {
        data: [makeCommunity(1, 'Jazz Lovers'), makeCommunity(2, 'Rock Vault')],
        meta: { total: 2, limit: 25 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunitiesPage />);
    expect(screen.getByText('Jazz Lovers')).toBeInTheDocument();
    expect(screen.getByText('Rock Vault')).toBeInTheDocument();
  });

  it('hides pagination when only one page', () => {
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: {
        data: [makeCommunity(1, 'Only Community')],
        meta: { total: 10, limit: 25 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunitiesPage />);
    expect(
      screen.queryByRole('button', { name: /previous/i })
    ).not.toBeInTheDocument();
  });

  it('shows pagination and advances pages when total exceeds page size', async () => {
    const user = userEvent.setup();
    mockUseGetCommunitiesQuery.mockReturnValue({
      data: {
        data: [makeCommunity(1, 'Community A')],
        meta: { total: 50, limit: 25 }
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CommunitiesPage />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    expect(prevBtn).toBeDisabled();
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();

    await user.click(nextBtn);
    expect(mockUseGetCommunitiesQuery).toHaveBeenLastCalledWith(2);
  });
});
