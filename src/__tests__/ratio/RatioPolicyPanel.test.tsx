import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { selectAlerts } from '../../store/slices/alertSlice';
import RatioPolicyPanel from '../../components/admin/RatioPolicyPanel';

const mockUseGetRatioPolicyQuery = jest.fn();
const mockOverrideRatioPolicy = jest.fn();

jest.mock('../../store/services/ratioPolicyApi', () => ({
  useGetRatioPolicyQuery: (...args: unknown[]) =>
    mockUseGetRatioPolicyQuery(...args),
  useOverrideRatioPolicyMutation: () => [
    mockOverrideRatioPolicy,
    { isLoading: false }
  ]
}));

describe('RatioPolicyPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetRatioPolicyQuery.mockImplementation((userId) => {
      if (!userId) {
        return { data: undefined, isLoading: false, error: undefined };
      }

      return {
        data: {
          status: 'WATCH',
          watchStartedAt: '2026-05-17T12:00:00.000Z',
          watchExpiresAt: '2026-05-31T12:00:00.000Z',
          leechDisabledAt: null,
          lastEvaluatedAt: '2026-05-17T18:00:00.000Z'
        },
        isLoading: false,
        error: undefined
      };
    });
    mockOverrideRatioPolicy.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('loads a user policy and applies an override', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderWithProviders(<RatioPolicyPanel />, { store });

    await user.type(screen.getByLabelText(/user id/i), '42');
    await user.click(screen.getByRole('button', { name: /^load$/i }));

    expect(screen.getByText('WATCH')).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText(/override status/i),
      'LEECH_DISABLED'
    );
    await user.click(screen.getByRole('button', { name: /apply override/i }));

    await waitFor(() => {
      expect(mockOverrideRatioPolicy).toHaveBeenCalledWith({
        userId: 42,
        status: 'LEECH_DISABLED'
      });
      const alerts = selectAlerts(store.getState());
      expect(
        alerts.some((a) => a.msg === 'Status set to LEECH_DISABLED.')
      ).toBe(true);
    });
  });

  it('shows an error alert when override fails', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    mockOverrideRatioPolicy.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail'))
    });

    renderWithProviders(<RatioPolicyPanel />, { store });

    await user.type(screen.getByLabelText(/user id/i), '42');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    await user.click(screen.getByRole('button', { name: /apply override/i }));

    await waitFor(() => {
      const alerts = selectAlerts(store.getState());
      expect(alerts.some((a) => a.msg === 'Failed to apply override.')).toBe(
        true
      );
    });
  });
});
