import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import LoginWatchPage from '../../components/staff/LoginWatchPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetSessionsQuery: (arg: unknown) => mockQuery(arg)
}));

const makeSession = (id: number) => ({
  id,
  user: { id: id + 100, username: `user${id}` },
  ipAddress: '10.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: '2026-01-02T00:00:00.000Z',
  lastActiveAt: '2026-01-03T00:00:00.000Z',
  revokedAt: null
});

describe('LoginWatchPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prompts for a user ID when none is filtered', () => {
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<LoginWatchPage />);
    expect(
      screen.getByText('Enter a user ID above to search sessions.')
    ).toBeInTheDocument();
  });

  it('renders sessions on the grid table', () => {
    mockQuery.mockReturnValue({
      data: { data: [makeSession(1)], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<LoginWatchPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('filters by user ID on submit', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<LoginWatchPage />);
    await user.type(screen.getByPlaceholderText('Filter by user ID'), '42');
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    expect(mockQuery).toHaveBeenLastCalledWith({ page: 1, userId: 42 });
  });
});
