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
  downloadDisabledAt: null,
  disabledCause: null,
  lastEvaluatedAt: null
};

const openPolicy = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/user id/i), '7');
  await user.click(screen.getByRole('button', { name: /^load$/i }));
  await waitFor(() =>
    expect(
      screen.getByRole('combobox', { name: /override status/i })
    ).toBeInTheDocument()
  );
};

const alertTypes = () =>
  mockDispatch.mock.calls.map(
    ([action]) => (action as { payload?: { alertType?: string } }).payload
  );

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
      // "OK" is also the first option's label; the badge is the chip.
      expect(
        screen.getByText('OK', { selector: '[data-st="chip"]' })
      ).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/reason/i), 'Sustained leeching');
    await user.click(screen.getByRole('button', { name: /apply override/i }));
    expect(mockOverrideRatioPolicy).toHaveBeenCalledWith({
      userId: 7,
      status: 'WATCH',
      reason: 'Sustained leeching'
    });
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
    await user.type(screen.getByLabelText(/reason/i), 'Appeal upheld');
    await user.click(screen.getByRole('button', { name: /apply override/i }));
    await waitFor(() => {
      expect(alertTypes()).toContainEqual(
        expect.objectContaining({ alertType: 'danger', msg: 'Forbidden.' })
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
        downloadDisabledAt: null,
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
  describe('the override carries a reason and an optional message (#332)', () => {
    beforeEach(() => {
      mockGetRatioPolicyQuery.mockReturnValue({
        data: policyData,
        isLoading: false
      });
    });

    it('refuses a whitespace-only reason without calling the api', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      await user.type(screen.getByLabelText(/reason/i), '   ');
      await user.click(screen.getByRole('button', { name: /apply override/i }));
      expect(mockOverrideRatioPolicy).not.toHaveBeenCalled();
      expect(alertTypes()).toContainEqual(
        expect.objectContaining({
          alertType: 'danger',
          msg: 'A reason is required.'
        })
      );
    });

    it('sends the trimmed message when one is written', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      await user.selectOptions(
        screen.getByRole('combobox', { name: /override status/i }),
        'DOWNLOAD_DISABLED'
      );
      await user.type(screen.getByLabelText(/reason/i), '  Ban evasion  ');
      await user.type(
        screen.getByLabelText(/message to member/i),
        '  Contact staff.  '
      );
      await user.click(screen.getByRole('button', { name: /apply override/i }));
      expect(mockOverrideRatioPolicy).toHaveBeenCalledWith({
        userId: 7,
        status: 'DOWNLOAD_DISABLED',
        reason: 'Ban evasion',
        message: 'Contact staff.'
      });
    });

    it('clears the reason and message after a successful override', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      await user.type(screen.getByLabelText(/reason/i), 'Recovered');
      await user.type(
        screen.getByLabelText(/message to member/i),
        'Welcome back'
      );
      await user.click(screen.getByRole('button', { name: /apply override/i }));
      await waitFor(() =>
        expect(screen.getByLabelText(/reason/i)).toHaveValue('')
      );
      expect(screen.getByLabelText(/message to member/i)).toHaveValue('');
    });

    it('tells staff that a blank message notifies nobody', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      expect(
        screen.getByText(/leave blank and the member is not notified/i)
      ).toBeInTheDocument();
    });

    it('explains what the selected status will do', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      const select = screen.getByRole('combobox', { name: /override status/i });
      expect(
        screen.getByText(/automatic ratio rules resume/i)
      ).toBeInTheDocument();
      await user.selectOptions(select, 'WATCH');
      expect(screen.getByText(/starts a 14-day watch/i)).toBeInTheDocument();
      await user.selectOptions(select, 'DOWNLOAD_DISABLED');
      expect(
        screen.getByText(/until staff lift it\. the ratio sweep will not/i)
      ).toBeInTheDocument();
    });

    it('labels the options in words rather than enum values', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      const labels = screen.getAllByRole('option').map((o) => o.textContent);
      expect(labels).toEqual(['OK', 'Ratio watch', 'Downloads disabled']);
    });
  });

  describe('a disabled member shows why', () => {
    const disabled = (cause: 'RATIO' | 'STAFF') => ({
      ...policyData,
      status: 'DOWNLOAD_DISABLED',
      downloadDisabledAt: '2026-09-01T00:00:00.000Z',
      disabledCause: cause
    });

    it('names a ratio cause as lifting on its own', async () => {
      mockGetRatioPolicyQuery.mockReturnValue({
        data: disabled('RATIO'),
        isLoading: false
      });
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      expect(
        screen.getByText(/cause: ratio — lifts automatically/i)
      ).toBeInTheDocument();
    });

    it('names a staff cause as needing staff', async () => {
      mockGetRatioPolicyQuery.mockReturnValue({
        data: disabled('STAFF'),
        isLoading: false
      });
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      expect(
        screen.getByText(/cause: staff — only staff can lift it/i)
      ).toBeInTheDocument();
    });

    it('shows no cause for a member who is not disabled', async () => {
      mockGetRatioPolicyQuery.mockReturnValue({
        data: policyData,
        isLoading: false
      });
      const user = userEvent.setup();
      renderWithProviders(<RatioPolicyPanel />);
      await openPolicy(user);
      expect(screen.queryByText(/cause:/i)).not.toBeInTheDocument();
    });
  });

  it('paints from the kit: panel, field and control hooks', async () => {
    mockGetRatioPolicyQuery.mockReturnValue({
      data: policyData,
      isLoading: false
    });
    const user = userEvent.setup();
    const { container } = renderWithProviders(<RatioPolicyPanel />);
    await openPolicy(user);
    expect(container.querySelector('[data-st="panel"]')).toBeInTheDocument();
    expect(
      container.querySelector('select[data-st="field"]')
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('textarea[data-st="field"]')
    ).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /apply override/i })
    ).toHaveAttribute('data-st', 'control');
    expect(container.querySelector('[data-st="chip"]')).toBeInTheDocument();
  });
});
