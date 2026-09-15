import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import InvitePoolPage from '../../components/staff/InvitePoolPage';
import { setCredentials } from '../../store/slices/authSlice';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockQuery = jest.fn();
const mockCancel = jest.fn();
let mockCancelling = false;

jest.mock('../../store/services/adminApi', () => ({
  useGetInvitesQuery: (arg: unknown) => mockQuery(arg),
  useCancelInviteMutation: () => [mockCancel, { isLoading: mockCancelling }]
}));

const invite = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  inviter: { id: 8, username: 'host' },
  email: 'guest@example.com',
  status: 'pending',
  createdAt: '2026-09-12T00:00:00.000Z',
  expires: '2026-09-15T00:00:00.000Z',
  reason: 'friend',
  ...overrides
});

const withRows = (rows: unknown[]) =>
  mockQuery.mockReturnValue({
    data: { data: rows, meta: { totalPages: 1 } },
    isLoading: false
  });

/** A store signed in with exactly these permissions. */
const storeWith = (permissions: Record<string, boolean>) => {
  const store = createTestStore();
  store.dispatch(setCredentials({ id: 1, userRank: { permissions } } as never));
  return store;
};

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hasAlert = (store: ReturnType<typeof createTestStore>, msg: string) =>
  selectAlerts(store.getState()).some((a) => a.msg === msg);

describe('InvitePoolPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCancelling = false;
    mockCancel.mockReturnValue({
      unwrap: () => Promise.resolve({ msg: 'ok' })
    });
  });

  it('renders invites on the grid table', () => {
    withRows([invite()]);
    renderWithProviders(<InvitePoolPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    expect(screen.getByText('host')).toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
  });

  describe('statuses are the api lowercase values (#330, #329)', () => {
    it('offers the four real statuses and nothing else', () => {
      withRows([]);
      renderWithProviders(<InvitePoolPage />);
      const values = within(screen.getByLabelText(/^status$/i))
        .getAllByRole('option')
        .map((o) => (o as HTMLOptionElement).value);
      expect(values).toEqual([
        '',
        'pending',
        'accepted',
        'expired',
        'cancelled'
      ]);
    });

    it('filters with the lowercase value and resets to page 1', async () => {
      const user = userEvent.setup();
      withRows([]);
      renderWithProviders(<InvitePoolPage />);
      await user.selectOptions(screen.getByLabelText(/^status$/i), 'cancelled');
      expect(mockQuery).toHaveBeenLastCalledWith({
        page: 1,
        status: 'cancelled'
      });
    });

    it.each([
      ['pending', 'Pending', 'data-st-warning'],
      ['accepted', 'Accepted', 'data-st-success'],
      ['expired', 'Expired', null],
      ['cancelled', 'Cancelled', null]
    ])('shows %s as a %s chip', (status, label, hook) => {
      withRows([invite({ status })]);
      renderWithProviders(<InvitePoolPage />);
      const chip = screen.getByText(label, { selector: '[data-st="chip"]' });
      for (const h of [
        'data-st-warning',
        'data-st-success',
        'data-st-danger'
      ]) {
        if (h === hook) expect(chip).toHaveAttribute(h);
        else expect(chip).not.toHaveAttribute(h);
      }
    });
  });

  it('has a Sent column', () => {
    withRows([invite()]);
    renderWithProviders(<InvitePoolPage />);
    expect(
      screen.getByRole('columnheader', { name: 'Sent' })
    ).toBeInTheDocument();
  });

  describe('email search', () => {
    it('sends the search after a pause, once it reaches 3 characters', async () => {
      const user = userEvent.setup();
      withRows([]);
      renderWithProviders(<InvitePoolPage />);
      await user.type(screen.getByLabelText(/search by email/i), 'gue');
      await waitFor(() =>
        expect(mockQuery).toHaveBeenLastCalledWith({ page: 1, email: 'gue' })
      );
    });

    it('sends nothing below 3 characters, and says so', async () => {
      const user = userEvent.setup();
      withRows([]);
      renderWithProviders(<InvitePoolPage />);
      await user.type(screen.getByLabelText(/search by email/i), 'gu');
      expect(
        screen.getByText(/type at least 3 characters/i)
      ).toBeInTheDocument();
      await pause(400);
      for (const [arg] of mockQuery.mock.calls) {
        expect(arg).not.toHaveProperty('email');
      }
    });

    it('does not send one request per keystroke', async () => {
      const user = userEvent.setup();
      withRows([]);
      renderWithProviders(<InvitePoolPage />);
      await user.type(screen.getByLabelText(/search by email/i), 'guest@ex');
      await waitFor(() =>
        expect(mockQuery).toHaveBeenLastCalledWith({
          page: 1,
          email: 'guest@ex'
        })
      );
      const searched = mockQuery.mock.calls
        .map(([arg]) => (arg as { email?: string }).email)
        .filter(Boolean);
      expect(new Set(searched)).toEqual(new Set(['guest@ex']));
    });

    it('Clear drops both the status and the search at once', async () => {
      const user = userEvent.setup();
      withRows([]);
      renderWithProviders(<InvitePoolPage />);
      await user.selectOptions(screen.getByLabelText(/^status$/i), 'pending');
      await user.type(screen.getByLabelText(/search by email/i), 'guest');
      await waitFor(() =>
        expect(mockQuery).toHaveBeenLastCalledWith({
          page: 1,
          status: 'pending',
          email: 'guest'
        })
      );
      await user.click(screen.getByRole('button', { name: /clear/i }));
      expect(mockQuery).toHaveBeenLastCalledWith({ page: 1 });
      expect(screen.getByLabelText(/search by email/i)).toHaveValue('');
    });
  });

  describe('staff cancel (#329)', () => {
    it('is hidden without invites_edit', () => {
      withRows([invite()]);
      renderWithProviders(<InvitePoolPage />, {
        store: storeWith({ invites_manage: true })
      });
      expect(
        screen.queryByRole('button', { name: /^cancel$/i })
      ).not.toBeInTheDocument();
    });

    it.each([['invites_edit'], ['admin']])(
      'shows on a pending row with %s',
      (perm) => {
        withRows([invite()]);
        renderWithProviders(<InvitePoolPage />, {
          store: storeWith({ [perm]: true })
        });
        expect(
          screen.getByRole('button', { name: /^cancel$/i })
        ).toBeInTheDocument();
      }
    );

    it.each([['accepted'], ['expired'], ['cancelled']])(
      'does not show on a %s row',
      (status) => {
        withRows([invite({ status })]);
        renderWithProviders(<InvitePoolPage />, {
          store: storeWith({ invites_edit: true })
        });
        expect(
          screen.queryByRole('button', { name: /^cancel$/i })
        ).not.toBeInTheDocument();
      }
    );

    const openModal = async () => {
      const user = userEvent.setup();
      withRows([invite()]);
      const store = storeWith({ invites_edit: true });
      renderWithProviders(<InvitePoolPage />, { store });
      await user.click(screen.getByRole('button', { name: /^cancel$/i }));
      const dialog = screen.getByRole('dialog', {
        name: /cancel invite to guest@example\.com/i
      });
      const submit = () =>
        user.click(
          within(dialog).getByRole('button', { name: /cancel invite/i })
        );
      return { user, store, dialog, submit };
    };

    it('sends the trimmed reason and message, then closes', async () => {
      const { user, store, dialog, submit } = await openModal();
      await user.type(within(dialog).getByLabelText(/reason/i), ' Typo ');
      await user.type(
        within(dialog).getByLabelText(/message to inviter/i),
        ' Resend it. '
      );
      await submit();
      expect(mockCancel).toHaveBeenCalledWith({
        inviteId: 1,
        reason: 'Typo',
        message: 'Resend it.'
      });
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
      expect(hasAlert(store, 'Invite to guest@example.com cancelled.')).toBe(
        true
      );
    });

    it('omits a blank message', async () => {
      const { user, dialog, submit } = await openModal();
      await user.type(within(dialog).getByLabelText(/reason/i), 'Typo');
      await submit();
      expect(mockCancel).toHaveBeenCalledWith({ inviteId: 1, reason: 'Typo' });
    });

    it('refuses a whitespace-only reason without calling the api', async () => {
      const { user, store, dialog, submit } = await openModal();
      await user.type(within(dialog).getByLabelText(/reason/i), '   ');
      await submit();
      expect(mockCancel).not.toHaveBeenCalled();
      expect(hasAlert(store, 'A reason is required.')).toBe(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows the api msg on a 409 and closes', async () => {
      mockCancel.mockReturnValue({
        unwrap: () =>
          Promise.reject({
            status: 409,
            data: { msg: 'Invite is no longer pending' }
          })
      });
      const { user, store, dialog, submit } = await openModal();
      await user.type(within(dialog).getByLabelText(/reason/i), 'Typo');
      await submit();
      await waitFor(() =>
        expect(hasAlert(store, 'Invite is no longer pending')).toBe(true)
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('locks its own buttons and ignores Esc while the cancel is in flight', async () => {
      mockCancelling = true;
      const { user, dialog } = await openModal();
      expect(
        within(dialog).getByRole('button', { name: /cancelling…/i })
      ).toBeDisabled();
      expect(
        within(dialog).getByRole('button', { name: /keep invite/i })
      ).toBeDisabled();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('paints the modal fields from the kit', async () => {
      const { dialog } = await openModal();
      expect(dialog.querySelectorAll('textarea[data-st="field"]')).toHaveLength(
        2
      );
      expect(
        within(dialog).getByRole('button', { name: /cancel invite/i })
      ).toHaveAttribute('data-st-danger');
    });
  });
});
