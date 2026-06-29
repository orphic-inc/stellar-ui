import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import DonationLogPage from '../../components/staff/DonationLogPage';

const mockQuery = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();
const mockDispatch = jest.fn();
let mockIsCreating = false;

jest.mock('../../store/services/adminApi', () => ({
  useGetDonationsQuery: (arg: unknown) => mockQuery(arg),
  useCreateDonationMutation: () => [mockCreate, { isLoading: mockIsCreating }],
  useDeleteDonationMutation: () => [mockDelete, { isLoading: false }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

const donation = {
  id: 1,
  userId: 5,
  user: { id: 5, username: 'donor' },
  email: 'donor@example.com',
  amount: 10,
  currency: 'USD',
  donatedAt: '2026-01-02T00:00:00.000Z'
};

describe('DonationLogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCreating = false;
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('renders donations on the grid table', () => {
    mockQuery.mockReturnValue({
      data: { data: [donation], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<DonationLogPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('donor')).toBeInTheDocument();
    expect(screen.getByText('10.00 USD')).toBeInTheDocument();
  });

  it('submits a manual donation entry', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<DonationLogPage />);

    await user.click(screen.getByRole('button', { name: '+ Manual entry' }));
    await user.type(screen.getByLabelText(/User ID/), '5');
    await user.type(screen.getByLabelText(/Amount/), '10');
    await user.type(screen.getByLabelText(/Donor email/), 'd@example.com');
    await user.type(screen.getByLabelText(/Date/), '2026-01-02T10:00');
    await user.type(screen.getByLabelText(/Reason/), 'thanks');
    await user.click(screen.getByRole('button', { name: 'Record donation' }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 5, amount: 10, reason: 'thanks' })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ alertType: 'success' })
      })
    );
  });

  it('removes a donation', async () => {
    const user = userEvent.setup();
    mockQuery.mockReturnValue({
      data: { data: [donation], meta: { totalPages: 1 } },
      isLoading: false
    });
    renderWithProviders(<DonationLogPage />);
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mockDelete).toHaveBeenCalledWith(1);
  });
});
