import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import ReportForm from '../../components/reports/ReportForm';

const mockFileReport = jest.fn();
const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('../../store/services/reportsApi', () => ({
  useFileReportMutation: () => [mockFileReport, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams()
}));

describe('ReportForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
    mockFileReport.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 1 })
    });
  });

  it('validates missing release category before submission', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<ReportForm />, { store });

    await user.selectOptions(screen.getByLabelText(/report type/i), 'Release');
    await user.type(screen.getByLabelText(/target id/i), '42');
    await user.type(screen.getByLabelText(/comments/i), 'Duplicate release');
    fireEvent.submit(
      screen.getByRole('button', { name: /submit report/i }).closest('form')!
    );

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(
        alerts.some((a) => a.msg === 'Please select a release report category.')
      ).toBe(true);
      expect(mockFileReport).not.toHaveBeenCalled();
    });
  });

  it('submits locked release reports from URL params', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams({ targetType: 'Release', targetId: '42' })
    ]);

    renderWithProviders(<ReportForm />, { store });

    await user.selectOptions(screen.getByLabelText(/^reason$/i), 'Dupe');
    await user.type(screen.getByLabelText(/comments/i), 'Superseded release');
    await user.type(
      screen.getByLabelText(/permalink to related release/i),
      'https://example.test/releases/99'
    );
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(mockFileReport).toHaveBeenCalledWith({
        targetType: 'Release',
        targetId: 42,
        releaseCategory: 'Dupe',
        reason: 'Superseded release',
        evidence: 'https://example.test/releases/99'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/reports/mine');
    });
  });

  it('submits non-release reports with the selected category', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<ReportForm />, { store });

    await user.type(screen.getByLabelText(/target id/i), '21');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Spam');
    await user.type(screen.getByLabelText(/comments/i), 'Spam post');
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(mockFileReport).toHaveBeenCalledWith({
        targetType: 'ForumPost',
        targetId: 21,
        category: 'Spam',
        reason: 'Spam post',
        evidence: undefined
      });
    });
  });
});
