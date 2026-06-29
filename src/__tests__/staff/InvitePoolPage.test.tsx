import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import InvitePoolPage from '../../components/staff/InvitePoolPage';

const mockQuery = jest.fn();
jest.mock('../../store/services/adminApi', () => ({
  useGetInvitesQuery: (arg: unknown) => mockQuery(arg)
}));

const invite = {
  id: 1,
  inviter: { id: 8, username: 'host' },
  email: 'guest@example.com',
  status: 'PENDING',
  expires: '2026-03-02T00:00:00.000Z',
  reason: 'friend'
};

describe('InvitePoolPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders invites on the grid table with a title-cased status', () => {
    mockQuery.mockReturnValue({
      data: { data: [invite], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<InvitePoolPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('host')).toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    // "Pending" appears both as a filter <option> and the row status cell.
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(2);
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<InvitePoolPage />);
    await user.selectOptions(screen.getByRole('combobox'), 'USED');
    expect(mockQuery).toHaveBeenLastCalledWith({ page: 1, status: 'USED' });
  });
});
