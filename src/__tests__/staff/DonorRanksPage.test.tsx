import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import DonorRanksPage from '../../components/staff/DonorRanksPage';

const mockGetDonorRanksQuery = jest.fn();
const mockCreateDonorRank = jest.fn();
const mockUpdateDonorRank = jest.fn();
const mockDeleteDonorRank = jest.fn();
const mockDispatch = jest.fn();

let mockIsCreating = false;

jest.mock('../../store/services/userApi', () => ({
  useGetDonorRanksQuery: () => mockGetDonorRanksQuery(),
  useCreateDonorRankMutation: () => [
    mockCreateDonorRank,
    { isLoading: mockIsCreating }
  ],
  useUpdateDonorRankMutation: () => [mockUpdateDonorRank, { isLoading: false }],
  useDeleteDonorRankMutation: () => [mockDeleteDonorRank, { isLoading: false }]
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
    mockIsCreating = false;
    mockCreateDonorRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockUpdateDonorRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockDeleteDonorRank.mockReturnValue({ unwrap: () => Promise.resolve({}) });
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

  it('paints rank cards with the panel Role (kit hooks present)', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: [makeRank(1)],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(document.querySelector('[data-st="panel"]')).toBeInTheDocument();
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

  it('fills badge and expiresAfterDays fields in create form', async () => {
    const user = userEvent.setup();
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    await user.click(screen.getByRole('button', { name: /\+ create rank/i }));

    const badgeInput = screen.getByLabelText(/badge/i) as HTMLInputElement;
    await user.type(badgeInput, 'G');
    expect(badgeInput.value).toBe('G');

    const expiresInput = screen.getByLabelText(
      /expires after/i
    ) as HTMLInputElement;
    await user.type(expiresInput, '180');
    expect(expiresInput.value).toBe('180');
  });

  it('shows "Creating…" button label when isCreating is true', async () => {
    const user = userEvent.setup();
    mockIsCreating = true;
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    await user.click(screen.getByRole('button', { name: /\+ create rank/i }));
    expect(
      screen.getByRole('button', { name: /creating…/i })
    ).toBeInTheDocument();
  });

  it('shows dash when badge is null', () => {
    mockGetDonorRanksQuery.mockReturnValue({
      data: [{ ...makeRank(1), badge: null }],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('submits rank with badge and expiresAfterDays when filled', async () => {
    const user = userEvent.setup();
    mockGetDonorRanksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<DonorRanksPage />);
    await user.click(screen.getByRole('button', { name: /\+ create rank/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'Gold');
    await user.type(screen.getByLabelText(/min donation/i), '100');
    await user.type(screen.getByLabelText(/badge/i), 'G');
    await user.type(screen.getByLabelText(/expires after/i), '365');
    await user.click(screen.getByRole('button', { name: /^create rank$/i }));
    await waitFor(() => {
      expect(mockCreateDonorRank).toHaveBeenCalledWith(
        expect.objectContaining({ badge: 'G', expiresAfterDays: 365 })
      );
    });
  });

  it('dispatches fallback danger alert when create fails with no API message', async () => {
    mockCreateDonorRank.mockReturnValue({
      unwrap: () => Promise.reject({})
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
          payload: expect.objectContaining({
            msg: 'Failed to create donor rank.'
          })
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
