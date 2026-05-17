import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import MyTicketsPage from '../../components/staffInbox/MyTicketsPage';

const mockUseGetMyTicketsQuery = jest.fn();

jest.mock('../../store/services/staffInboxApi', () => ({
  useGetMyTicketsQuery: (...args: unknown[]) =>
    mockUseGetMyTicketsQuery(...args)
}));

describe('MyTicketsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the empty state when the user has no tickets', () => {
    mockUseGetMyTicketsQuery.mockReturnValue({
      data: { total: 0, page: 1, pageSize: 25, conversations: [] },
      isLoading: false,
      error: undefined
    });

    renderWithProviders(<MyTicketsPage />);

    expect(
      screen.getByText('You have no support tickets.')
    ).toBeInTheDocument();
  });

  it('renders unread indicators for open tickets and assigned staff names', () => {
    mockUseGetMyTicketsQuery.mockReturnValue({
      data: {
        total: 1,
        page: 1,
        pageSize: 25,
        conversations: [
          {
            id: 4,
            subject: 'Need help',
            status: 'Open',
            isReadByUser: false,
            assignedUser: { username: 'mod-one' },
            updatedAt: '2026-05-17T12:00:00.000Z'
          }
        ]
      },
      isLoading: false,
      error: undefined
    });

    const { store } = renderWithProviders(<MyTicketsPage />);
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'regular',
        userRank: { permissions: {} }
      } as never)
    );

    expect(
      screen.getByRole('link', { name: /Need help/i })
    ).toBeInTheDocument();
    expect(screen.getByText('mod-one')).toBeInTheDocument();
    expect(screen.getByText('●')).toBeInTheDocument();
  });
});
