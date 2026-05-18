import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportForm from '../../components/reports/ReportForm';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import { createTestStore, renderWithProviders } from '../testUtils';

const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams()
}));

describe('ReportForm RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  it('submits a locked release report with the real mutation payload', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams({ targetType: 'Release', targetId: '42' })
    ]);
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({ status: 201, body: { id: 1 } })
    );

    renderWithProviders(<ReportForm />, { store });

    await user.selectOptions(screen.getByLabelText(/^reason$/i), 'Dupe');
    await user.type(screen.getByLabelText(/comments/i), 'Superseded release');
    await user.type(
      screen.getByLabelText(/permalink to related release/i),
      'https://example.test/releases/99'
    );
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(async () => {
      const req = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
      expect(req.url).toContain('/api/reports');
      expect(req.method).toBe('POST');
      expect(await req.text()).toBe(
        JSON.stringify({
          targetType: 'Release',
          targetId: 42,
          releaseCategory: 'Dupe',
          reason: 'Superseded release',
          evidence: 'https://example.test/releases/99'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/private/reports/mine');
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Report submitted.')).toBe(true);
    });
  });

  it('surfaces server failures from the real mutation', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({ status: 500, body: { msg: 'boom' } })
    );

    renderWithProviders(<ReportForm />, { store });

    await user.type(screen.getByLabelText(/target id/i), '21');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Spam');
    await user.type(screen.getByLabelText(/comments/i), 'Spam post');
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to submit report.')).toBe(
        true
      );
    });
  });
});
