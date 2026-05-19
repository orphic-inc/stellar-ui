import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import RatioPolicyPanel from '../../components/admin/RatioPolicyPanel';

const mockGetRatioPolicyQuery = jest.fn();
const mockOverrideRatioPolicy = jest.fn();
const mockDispatch = jest.fn();

let mockIsOverriding = false;

jest.mock('../../store/services/ratioPolicyApi', () => ({
  useGetRatioPolicyQuery: (...args: unknown[]) =>
    mockGetRatioPolicyQuery(...args),
  useOverrideRatioPolicyMutation: () => [
    mockOverrideRatioPolicy,
    { isLoading: mockIsOverriding }
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
    mockIsOverriding = false;
    mockGetRatioPolicyQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined
    });
    mockOverrideRatioPolicy.mockReturnValue({
      unwrap: () => Promise.resolve({})
    });
  });

  it('does not trigger lookup when ID is 0 or negative', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '0');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    expect(screen.queryByText(/override status/i)).not.toBeInTheDocument();
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

  it('shows loading state in PolicyView when query is loading', async () => {
    mockGetRatioPolicyQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    expect(screen.getByText(/loading…/i)).toBeInTheDocument();
  });

  it('shows user not found when state is undefined with no error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '5');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    expect(
      screen.getByText(/user not found or access denied/i)
    ).toBeInTheDocument();
  });

  it('formats non-null dates and shows fallback badge for unknown status', async () => {
    mockGetRatioPolicyQuery.mockReturnValue({
      data: {
        status: 'CUSTOM_STATUS',
        watchStartedAt: '2026-05-01T00:00:00.000Z',
        watchExpiresAt: null,
        leechDisabledAt: null,
        lastEvaluatedAt: null
      },
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    expect(screen.getByText('CUSTOM_STATUS')).toBeInTheDocument();
  });

  it('shows "Applying…" when overriding is true', async () => {
    mockIsOverriding = true;
    mockGetRatioPolicyQuery.mockReturnValue({
      data: policyData,
      isLoading: false
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '7');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    expect(
      screen.getByRole('button', { name: /applying…/i })
    ).toBeInTheDocument();
  });

  it('shows error message when query returns an error', async () => {
    mockGetRatioPolicyQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    const user = userEvent.setup();
    renderWithProviders(<RatioPolicyPanel />);
    await user.type(screen.getByLabelText(/user id/i), '99');
    await user.click(screen.getByRole('button', { name: /^load$/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/user not found or access denied/i)
      ).toBeInTheDocument();
    });
  });
});
