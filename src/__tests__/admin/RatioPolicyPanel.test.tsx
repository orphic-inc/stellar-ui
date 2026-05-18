import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import RatioPolicyPanel from '../../components/admin/RatioPolicyPanel';

const mockGetRatioPolicyQuery = jest.fn();
const mockOverrideRatioPolicy = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/ratioPolicyApi', () => ({
  useGetRatioPolicyQuery: (...args: unknown[]) =>
    mockGetRatioPolicyQuery(...args),
  useOverrideRatioPolicyMutation: () => [
    mockOverrideRatioPolicy,
    { isLoading: false }
  ]
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const policyData = {
  status: 'OK',
  watchStartedAt: null,
  watchExpiresAt: null,
  leechDisabledAt: null,
  lastEvaluatedAt: null
};

describe('RatioPolicyPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRatioPolicyQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    mockOverrideRatioPolicy.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('renders user ID input and Lookup button initially', () => {
    renderWithProviders(<RatioPolicyPanel />);
    expect(screen.getByLabelText(/user id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^load$/i })).toBeInTheDocument();
  });

  it('does not show policy view before lookup', () => {
    renderWithProviders(<RatioPolicyPanel />);
    expect(screen.queryByText(/override status/i)).not.toBeInTheDocument();
  });

  it('shows policy view after looking up a user', async () => {
    mockGetRatioPolicyQuery.mockImplementation((userId: unknown) => {
      if (userId === 7) return { data: policyData, isLoading: false };
      return { data: undefined, isLoading: false };
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    await waitFor(() => {
      expect(screen.getByText(/override status/i)).toBeInTheDocument();
    });
  });

  it('shows current status badge in policy view', async () => {
    mockGetRatioPolicyQuery.mockReturnValue({
      data: policyData,
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  it('calls override mutation and dispatches success alert', async () => {
    mockGetRatioPolicyQuery.mockReturnValue({
      data: policyData,
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    await waitFor(() =>
      expect(screen.getByText(/override status/i)).toBeInTheDocument()
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /override status/i }),
      'WATCH'
    );
    await user.click(screen.getByRole('button', { name: /apply override/i }));
    expect(mockOverrideRatioPolicy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'WATCH' })
    );
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'success' })
        })
      );
    });
  });

  it('dispatches danger alert on override failure', async () => {
    mockOverrideRatioPolicy.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Forbidden.' } })
    });
    mockGetRatioPolicyQuery.mockReturnValue({
      data: policyData,
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    await waitFor(() =>
      expect(screen.getByText(/override status/i)).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /apply override/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });
});
