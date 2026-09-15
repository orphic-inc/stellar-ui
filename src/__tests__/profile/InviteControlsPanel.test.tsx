import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createTestStore, renderWithProviders } from '../testUtils';
import InviteControlsPanel from '../../components/profile/InviteControlsPanel';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockSetCanInvite = jest.fn();
const mockSetInviteCount = jest.fn();
const mockProfileQuery = jest.fn();
const mockRefetch = jest.fn();
let mockSaving = false;
/** The balance in the profile cache, as the dialog's own subscription reads it. */
let mockBalance = 3;

jest.mock('../../store/services/userApi', () => ({
  useSetUserCanInviteMutation: () => [
    mockSetCanInvite,
    { isLoading: mockSaving }
  ],
  useSetUserInviteCountMutation: () => [
    mockSetInviteCount,
    { isLoading: mockSaving }
  ]
}));

jest.mock('../../store/services/profileApi', () => ({
  useGetProfileByUserIdQuery: (arg: unknown) => mockProfileQuery(arg)
}));

const resolves = () => ({ unwrap: () => Promise.resolve({ msg: 'ok' }) });
const rejects = (status: number, msg: string) => ({
  unwrap: () => Promise.reject({ status, data: { msg } })
});

/** Long enough that React renders a premature notice before the reload lands. */
const RELOAD_MS = 20;

/**
 * The refetch a 409 awaits. Like the real store, it has already updated the
 * cache when it resolves, so the next render of the dialog reads the new value.
 */
const reloadsTo = (inviteCount: number | 'error') =>
  mockRefetch.mockImplementation(async () => {
    // Later, as a network reload lands: a notice shown before this resolves
    // would name the old balance.
    await new Promise((resolve) => setTimeout(resolve, RELOAD_MS));
    if (inviteCount === 'error') return { isError: true };
    mockBalance = inviteCount;
    return { isError: false, data: { inviteCount } };
  });

const hasAlert = (store: ReturnType<typeof createTestStore>, msg: string) =>
  selectAlerts(store.getState()).some((a) => a.msg === msg);

type PanelProps = { inviteCount?: number; canInvite?: boolean };

const panel = (props: PanelProps = {}) => (
  <InviteControlsPanel
    profileId={42}
    inviteCount={props.inviteCount ?? 3}
    canInvite={props.canInvite ?? true}
    bodyClass="p-4"
  />
);

/** Rerender inside the same providers, so the open dialog keeps its state. */
const wrapped = (
  store: ReturnType<typeof createTestStore>,
  props: PanelProps
) => (
  <Provider store={store}>
    <MemoryRouter>{panel(props)}</MemoryRouter>
  </Provider>
);

const open = async (button: RegExp, props: PanelProps = {}) => {
  const user = userEvent.setup();
  const view = renderWithProviders(panel(props));
  await user.click(screen.getByRole('button', { name: button }));
  const dialog = screen.getByRole('dialog');
  const reason = (text: string) =>
    user.type(within(dialog).getByLabelText(/^reason/i), text);
  const message = (text: string) =>
    user.type(within(dialog).getByLabelText(/message to member/i), text);
  return { user, dialog, reason, message, ...view };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSaving = false;
  mockBalance = 3;
  mockProfileQuery.mockImplementation(() => ({
    data: { inviteCount: mockBalance },
    refetch: mockRefetch
  }));
  mockSetCanInvite.mockReturnValue(resolves());
  mockSetInviteCount.mockReturnValue(resolves());
});

describe('InviteControlsPanel summary (#329)', () => {
  it('shows the balance and an allowed member with Revoke', () => {
    renderWithProviders(panel());
    expect(screen.getByText('Invites')).toBeInTheDocument();
    expect(screen.getByText(/balance:/i).parentElement).toHaveTextContent(
      'Balance: 3'
    );
    expect(screen.getByText('Allowed')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Revoke invites' })
    ).toHaveAttribute('data-st-danger');
  });

  it('shows a revoked member with Restore', () => {
    renderWithProviders(panel({ canInvite: false }));
    expect(screen.getByText('Revoked')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Restore invites' })
    ).toBeInTheDocument();
  });
});

describe('InviteControlsPanel revoke and restore (#329)', () => {
  it('revokes with the trimmed reason and message, then closes', async () => {
    const { dialog, reason, message, user, store } = await open(/^revoke/i);
    expect(dialog).toHaveTextContent(
      'Their pending invites stop working now and are refunded within the hour. Their balance is kept.'
    );
    await reason(' Selling invites ');
    await message(' See the rules. ');
    await user.click(
      within(dialog).getByRole('button', { name: 'Revoke invites' })
    );
    expect(mockSetCanInvite).toHaveBeenCalledWith({
      id: 42,
      canInvite: false,
      reason: 'Selling invites',
      message: 'See the rules.'
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(hasAlert(store, 'Invite privileges revoked.')).toBe(true);
  });

  it('restores and omits a blank message', async () => {
    const { dialog, reason, user } = await open(/^restore/i, {
      canInvite: false
    });
    expect(dialog).toHaveTextContent(
      "Pending invites already refunded by the sweep don't come back."
    );
    await reason('Appeal accepted');
    await user.click(
      within(dialog).getByRole('button', { name: 'Restore invites' })
    );
    expect(mockSetCanInvite).toHaveBeenCalledWith({
      id: 42,
      canInvite: true,
      reason: 'Appeal accepted'
    });
  });

  it('refuses a whitespace-only reason without calling the api', async () => {
    const { dialog, reason, user, store } = await open(/^revoke/i);
    await reason('   ');
    await user.click(
      within(dialog).getByRole('button', { name: 'Revoke invites' })
    );
    expect(mockSetCanInvite).not.toHaveBeenCalled();
    expect(hasAlert(store, 'A reason is required.')).toBe(true);
  });

  it('shows the api msg on failure and stays open', async () => {
    mockSetCanInvite.mockReturnValue(rejects(404, 'User not found'));
    const { dialog, reason, user, store } = await open(/^revoke/i);
    await reason('Selling invites');
    await user.click(
      within(dialog).getByRole('button', { name: 'Revoke invites' })
    );
    await waitFor(() => expect(hasAlert(store, 'User not found')).toBe(true));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps the direction it opened with when the flag changes underneath', async () => {
    const { dialog, reason, user, rerender, store } = await open(/^revoke/i);
    rerender(wrapped(store, { canInvite: false }));
    await reason('Selling invites');
    await user.click(
      within(dialog).getByRole('button', { name: 'Revoke invites' })
    );
    expect(mockSetCanInvite).toHaveBeenCalledWith(
      expect.objectContaining({ canInvite: false })
    );
  });
});

describe('InviteControlsPanel balance edit (#329)', () => {
  const setBalance = async (value: string) => {
    const view = await open(/edit balance/i);
    const field = within(view.dialog).getByLabelText(/new balance/i);
    await view.user.clear(field);
    if (value) await view.user.type(field, value);
    const save = within(view.dialog).getByRole('button', {
      name: 'Set balance'
    });
    return { ...view, save };
  };

  it('sends the displayed balance as expectedInviteCount, then closes', async () => {
    const { dialog, reason, save, user, store } = await setBalance('10');
    expect(dialog).toHaveTextContent('Current balance: 3');
    expect(mockProfileQuery).toHaveBeenCalledWith('42');
    expect(dialog).toHaveTextContent('Not limited by the rank');
    await reason(' Contest prize ');
    await user.click(save);
    expect(mockSetInviteCount).toHaveBeenCalledWith({
      id: 42,
      inviteCount: 10,
      expectedInviteCount: 3,
      reason: 'Contest prize'
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(hasAlert(store, 'Invite balance set to 10.')).toBe(true);
  });

  it.each([['3'], ['1001'], ['-1'], ['1.5'], ['']])(
    'cannot save a balance of "%s"',
    async (value) => {
      const { save } = await setBalance(value);
      expect(save).toBeDisabled();
    }
  );

  it.each([['0'], ['1000']])('can save the bound %s', async (value) => {
    const { save } = await setBalance(value);
    expect(save).toBeEnabled();
  });

  it('shows the api msg on a non-conflict failure and stays open', async () => {
    mockSetInviteCount.mockReturnValue(rejects(403, 'Missing invites_edit'));
    const { reason, save, user, store } = await setBalance('10');
    await reason('Contest prize');
    await user.click(save);
    await waitFor(() =>
      expect(hasAlert(store, 'Missing invites_edit')).toBe(true)
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('follows a background refresh of the cached balance', async () => {
    const { dialog, reason, save, user, rerender, store } =
      await setBalance('10');
    mockBalance = 6;
    rerender(wrapped(store, {}));
    expect(dialog).toHaveTextContent('Current balance: 6');
    await reason('Contest prize');
    await user.click(save);
    expect(mockSetInviteCount).toHaveBeenCalledWith(
      expect.objectContaining({ expectedInviteCount: 6 })
    );
  });
});

describe('InviteControlsPanel balance conflict (#329)', () => {
  const conflictAt = async (reloaded: number | 'error') => {
    mockSetInviteCount.mockReturnValueOnce(
      rejects(409, 'The invite balance has changed')
    );
    reloadsTo(reloaded);
    const view = await open(/edit balance/i);
    const field = within(view.dialog).getByLabelText(/new balance/i);
    await view.user.clear(field);
    await view.user.type(field, '10');
    await view.reason('Contest prize');
    await view.message('Enjoy.');
    const save = () =>
      view.user.click(
        within(view.dialog).getByRole('button', { name: 'Set balance' })
      );
    await save();
    return { ...view, field, save };
  };

  it('stays open, keeps the input, and names the reloaded balance', async () => {
    const { dialog, field, store } = await conflictAt(5);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'The balance changed while you were editing. It is now 5. Check the new balance and save again.'
    );
    // The same render: the notice never names a balance the line above lacks.
    expect(dialog).toHaveTextContent('Current balance: 5');
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(field).toHaveValue(10);
    expect(within(dialog).getByLabelText(/^reason/i)).toHaveValue(
      'Contest prize'
    );
    expect(within(dialog).getByLabelText(/message to member/i)).toHaveValue(
      'Enjoy.'
    );
    expect(hasAlert(store, 'The invite balance has changed')).toBe(false);
  });

  it('sends the reloaded balance on the next save, without retrying itself', async () => {
    const { dialog, save } = await conflictAt(5);
    await within(dialog).findByRole('alert');
    expect(mockSetInviteCount).toHaveBeenCalledTimes(1);
    await save();
    expect(mockSetInviteCount).toHaveBeenLastCalledWith(
      expect.objectContaining({ inviteCount: 10, expectedInviteCount: 5 })
    );
  });

  it('asks for a page reload when the profile cannot be reloaded', async () => {
    const { dialog } = await conflictAt('error');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Reload the page to see the current balance.'
    );
  });
});

describe('InviteControlsPanel in flight (#329)', () => {
  it.each([
    [/edit balance/i, 'Cancel'],
    [/^revoke/i, 'Keep as is']
  ])('locks %s and ignores Esc while saving', async (button, dismiss) => {
    mockSaving = true;
    const { dialog, user } = await open(button);
    expect(
      within(dialog).getByRole('button', { name: 'Saving…' })
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: dismiss })
    ).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
