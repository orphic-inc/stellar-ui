import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import RequestsPage from '../../components/requests/RequestsPage';

const mockUseSearchRequestsQuery = jest.fn();
const mockDeleteRequest = jest.fn();
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchRequestsQuery: (...args: unknown[]) =>
    mockUseSearchRequestsQuery(...args)
}));

jest.mock('../../store/services/requestApi', () => ({
  useDeleteRequestMutation: () => [mockDeleteRequest, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => mockUseSearchParams()
}));

describe('RequestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams(
        'q=jazz&artist=miles&type=Music&year=1959&status=open&page=2'
      ),
      mockSetSearchParams
    ]);
    mockUseSearchRequestsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 12,
            title: 'Kind of Blue vinyl rip',
            type: 'Music',
            status: 'open',
            user: { id: 7, username: 'alice' },
            community: { id: 2, name: 'Jazz' },
            _count: { bounties: 2 }
          }
        ],
        meta: { total: 1, page: 2, limit: 25, totalPages: 3 }
      },
      isLoading: false,
      error: undefined
    });
    mockDeleteRequest.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('queries from search params and lets the owner filter and delete open requests', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<RequestsPage />, { store });

    expect(mockUseSearchRequestsQuery).toHaveBeenCalledWith({
      q: 'jazz',
      artist: 'miles',
      type: 'Music',
      year: 1959,
      status: 'open',
      orderBy: 'createdAt',
      order: 'desc',
      page: 2
    });
    expect(
      screen.getByRole('button', { name: /^delete$/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^filled$/i }));
    let next = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(next.get('status')).toBe('filled');
    expect(next.get('page')).toBe('1');

    await user.click(screen.getByRole('button', { name: /^3$/i }));
    next = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;
    expect(next.get('page')).toBe('3');

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDeleteRequest).toHaveBeenCalledWith(12);
    });
  });

  it('shows an error state and hides delete for non-owners', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 4,
        username: 'reader',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseSearchRequestsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });

    renderWithProviders(<RequestsPage />, { store });

    expect(screen.getByText(/failed to load requests/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^delete$/i })
    ).not.toBeInTheDocument();
  });
});
