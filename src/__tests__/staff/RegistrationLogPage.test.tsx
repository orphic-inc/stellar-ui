import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RegistrationLogPage from '../../components/staff/RegistrationLogPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetRegistrationLogQuery: () => mockQuery()
}));

const makeUser = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  disabled: false,
  userRank: { name: 'Member' },
  dateRegistered: '2026-01-02T00:00:00.000Z',
  lastIp: '10.0.0.1',
  ...over
});

describe('RegistrationLogPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while loading', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<RegistrationLogPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<RegistrationLogPage />);
    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('renders users on the grid table with a Disabled badge', () => {
    mockQuery.mockReturnValue({
      data: {
        data: [makeUser(1), makeUser(2, { disabled: true })],
        meta: { totalPages: 1 }
      },
      isLoading: false
    });
    renderWithProviders(<RegistrationLogPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    const badge = screen.getByText('Disabled');
    expect(badge).toHaveAttribute('data-st', 'chip');
    expect(badge).toHaveAttribute('data-st-danger');
  });
});
