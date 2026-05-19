import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import DownloadButton from '../../components/communities/DownloadButton';

const mockGrantAccess = jest.fn();
const mockDispatch = jest.fn();
let mockIsLoading = false;

jest.mock('../../store/services/downloadApi', () => ({
  useGrantAccessMutation: () => [mockGrantAccess, { isLoading: mockIsLoading }]
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

describe('DownloadButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoading = false;
    mockGrantAccess.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ downloadUrl: 'https://example.com/file.zip' })
    });
    window.open = jest.fn();
  });

  it('shows disabled text when canDownload is false', () => {
    renderWithProviders(
      <DownloadButton contributionId={1} canDownload={false} />
    );
    expect(screen.getByText('[disabled]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows Download button when canDownload is true', () => {
    renderWithProviders(
      <DownloadButton contributionId={1} canDownload={true} />
    );
    expect(
      screen.getByRole('button', { name: /download/i })
    ).toBeInTheDocument();
  });

  it('calls grantAccess and opens download URL on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DownloadButton contributionId={42} canDownload={true} />
    );
    await user.click(screen.getByRole('button', { name: /download/i }));
    expect(mockGrantAccess).toHaveBeenCalledWith({ contributionId: 42 });
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://example.com/file.zip',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  it('dispatches danger alert when grantAccess fails', async () => {
    mockGrantAccess.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Ratio too low.' } })
    });
    const user = userEvent.setup();
    renderWithProviders(
      <DownloadButton contributionId={1} canDownload={true} />
    );
    await user.click(screen.getByRole('button', { name: /download/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('dispatches fallback danger alert when rejection has no API message', async () => {
    mockGrantAccess.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    const user = userEvent.setup();
    renderWithProviders(
      <DownloadButton contributionId={1} canDownload={true} />
    );
    await user.click(screen.getByRole('button', { name: /download/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Failed to access download.',
            alertType: 'danger'
          })
        })
      );
    });
  });

  it('shows "Loading…" button label when isLoading is true', () => {
    mockIsLoading = true;
    renderWithProviders(
      <DownloadButton contributionId={1} canDownload={true} />
    );
    expect(
      screen.getByRole('button', { name: /loading…/i })
    ).toBeInTheDocument();
  });
});
