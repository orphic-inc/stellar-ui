import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import DuplicateIpsPage from '../../components/staff/DuplicateIpsPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetDuplicateIpsQuery: () => mockQuery()
}));

const group = {
  ip: '10.0.0.1',
  count: 2,
  users: [
    {
      id: 1,
      username: 'alice',
      dateRegistered: '2026-01-02T00:00:00.000Z',
      disabled: true,
      lastLogin: '2026-02-02T00:00:00.000Z'
    }
  ]
};

describe('DuplicateIpsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty state', () => {
    mockQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<DuplicateIpsPage />);
    expect(screen.getByText('No duplicate IPs found.')).toBeInTheDocument();
  });

  it('expands a group to its users with a Disabled badge', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({ data: [group], isLoading: false });
    renderWithProviders(<DuplicateIpsPage />);

    expect(screen.queryByText('alice')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show' }));

    expect(screen.getByText('alice')).toBeInTheDocument();
    const badge = screen.getByText('Disabled');
    expect(badge).toHaveAttribute('data-st', 'chip');
    expect(badge).toHaveAttribute('data-st-danger');
  });
});
