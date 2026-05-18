import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import DonorRanksPage from '../../components/staff/DonorRanksPage';

const mockGetDonorRanksQuery = jest.fn();
const mockCreateDonorRank = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/userApi', () => ({
  useGetDonorRanksQuery: () => mockGetDonorRanksQuery(),
  useCreateDonorRankMutation: () => [mockCreateDonorRank, { isLoading: false }]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

const makeRank = (id: number) => ({
  id,
  name: `Bronze ${id}`,
  minDonation: id * 10,
  badge: '🥉',
  expiresAfterDays: 365
});

describe('DonorRanksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateDonorRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows spinner while loading', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<DonorRanksPage />);
    expect(screen.getByText(/failed to load donor ranks/i)).toBeInTheDocument();
  });

  it('shows empty state when no ranks', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(screen.getByText(/no donor ranks defined/i)).toBeInTheDocument();
  });

  it('renders existing ranks in table', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: [makeRank(1), makeRank(2)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(screen.getByText('Bronze 1')).toBeInTheDocument();
    expect(screen.getByText('Bronze 2')).toBeInTheDocument();
    expect(screen.getAllByText('365 days').length).toBe(2);
  });

  it('shows Never when expiresAfterDays is null', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: [{ ...makeRank(1), expiresAfterDays: null }],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('toggles create form on "+ Create Rank" click', async () => {
    const user = userEvent.setup();
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /\+ create rank/i }));
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
  });

  it('submits new rank and dispatches success alert', async () => {
    const user = userEvent.setup();
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    await user.click(screen.getByRole('button', { name: /\+ create rank/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'Silver');
    await user.type(screen.getByLabelText(/min donation/i), '25');
    await user.click(screen.getByRole('button', { name: /^create rank$/i }));
    expect(mockCreateDonorRank).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Silver', minDonation: 25 })
    );
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'success' })
        })
      );
    });
  });

  it('dispatches danger alert on create failure', async () => {
    mockCreateDonorRank.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Duplicate rank name.' } })
    });
    const user = userEvent.setup();
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    await user.click(screen.getByRole('button', { name: /\+ create rank/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'Silver');
    await user.type(screen.getByLabelText(/min donation/i), '25');
    await user.click(screen.getByRole('button', { name: /^create rank$/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });
});
