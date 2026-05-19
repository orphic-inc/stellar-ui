import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ReportContributionModal from '../../components/communities/ReportContributionModal';

const mockReportContribution = jest.fn();
const mockDispatch = jest.fn();
let mockIsLoading = false;

jest.mock('../../store/services/downloadApi', () => ({
  useReportContributionMutation: () => [
    mockReportContribution,
    { isLoading: mockIsLoading }
  ]
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

describe('ReportContributionModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
    mockReportContribution.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('renders reason textarea and Submit Report button', () => {
    renderWithProviders(
      <ReportContributionModal contributionId={5} onClose={mockOnClose} />
    );
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit report/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls reportContribution with id and reason, dispatches success, calls onClose', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ReportContributionModal contributionId={5} onClose={mockOnClose} />
    );
    await user.type(screen.getByLabelText(/reason/i), 'Dead link');
    await user.click(screen.getByRole('button', { name: /submit report/i }));
    expect(mockReportContribution).toHaveBeenCalledWith({
      contributionId: 5,
      reason: 'Dead link'
    });
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'success' })
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('dispatches danger alert on failure without closing', async () => {
    mockReportContribution.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(
      <ReportContributionModal contributionId={5} onClose={mockOnClose} />
    );
    await user.type(screen.getByLabelText(/reason/i), 'Bad link');
    await user.click(screen.getByRole('button', { name: /submit report/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows "Submitting…" button label when isLoading is true', () => {
    mockIsLoading = true;
    renderWithProviders(
      <ReportContributionModal contributionId={5} onClose={mockOnClose} />
    );
    expect(
      screen.getByRole('button', { name: /submitting…/i })
    ).toBeInTheDocument();
  });

  it('calls onClose on Cancel click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ReportContributionModal contributionId={5} onClose={mockOnClose} />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not call reportContribution when reason is empty', () => {
    renderWithProviders(
      <ReportContributionModal contributionId={5} onClose={mockOnClose} />
    );
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    submitButton.removeAttribute('disabled');
    fireEvent.click(submitButton);
    expect(mockReportContribution).not.toHaveBeenCalled();
  });
});
