import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import RecoveryQueuePage from '../../components/staff/RecoveryQueuePage';

const mockQuery = jest.fn();
const mockRevoke = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetRecoveryRequestsQuery: (arg: unknown) => mockQuery(arg),
  useRevokeRecoveryRequestMutation: () => [mockRevoke, { isLoading: false }]
}));
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

const pendingRow = {
  id: 1,
  userId: 9,
  username: 'alice',
  email: 'alice@example.com',
  status: 'pending',
  createdAt: '2026-01-02T00:00:00.000Z',
  expiresAt: '2026-01-09T00:00:00.000Z'
};

describe('RecoveryQueuePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
    mockRevoke.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders requests with a status badge on the grid table', () => {
    mockQuery.mockReturnValue({
      data: { data: [pendingRow], meta: { totalPages: 1 } },
      isLoading: false,
      isFetching: false
    });
    renderWithProviders(<RecoveryQueuePage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    const badge = screen.getByText('pending');
    expect(badge).toHaveAttribute('data-st', 'chip');
    expect(badge).toHaveAttribute('data-st-warning');
  });

  it('switches the status tab', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false,
      isFetching: false
    });
    renderWithProviders(<RecoveryQueuePage />);
    await user.click(screen.getByRole('button', { name: 'Used' }));
    expect(mockQuery).toHaveBeenLastCalledWith({ page: 1, status: 'used' });
  });

  it('revokes a pending token after confirm', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [pendingRow], meta: { totalPages: 1 } },
      isLoading: false,
      isFetching: false
    });
    renderWithProviders(<RecoveryQueuePage />);
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockRevoke).toHaveBeenCalledWith(1);
  });
});
