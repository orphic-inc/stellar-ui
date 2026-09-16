import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import PendingInvites from '../../components/profile/invite/PendingInvites';
import { selectAlerts } from '../../store/slices/alertSlice';

const mockInvites = jest.fn();
const mockWithdraw = jest.fn();
let mockWithdrawing = false;

jest.mock('../../store/services/profileApi', () => ({
  useGetMyInvitesQuery: (page: unknown) => mockInvites(page),
  useWithdrawInviteMutation: () => [
    mockWithdraw,
    { isLoading: mockWithdrawing }
  ]
}));

const DAY = 86400000;
// A minute of slack: a date exactly 2 days out is 47h59m by the time it renders.
const MINUTE = 60000;
const invite = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  email: 'guest@example.com',
  reason: 'old friend',
  createdAt: new Date(Date.now() - DAY - MINUTE).toISOString(),
  expires: new Date(Date.now() + 2 * DAY + MINUTE).toISOString(),
  ...overrides
});

const withRows = (rows: unknown[], totalPages = 1) =>
  mockInvites.mockReturnValue({
    data: { data: rows, meta: { totalPages } },
    isLoading: false
  });

const hasAlert = (store: ReturnType<typeof createTestStore>, msg: string) =>
  selectAlerts(store.getState()).some((a) => a.msg === msg);

const openWithdraw = async (rows: unknown[] = [invite()]) => {
  const user = userEvent.setup();
  withRows(rows);
  const view = renderWithProviders(<PendingInvites />);
  await user.click(screen.getByRole('button', { name: 'Withdraw' }));
  const dialog = screen.getByRole('dialog');
  const confirm = () =>
    user.click(within(dialog).getByRole('button', { name: 'Withdraw invite' }));
  return { ...view, user, dialog, confirm };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockWithdrawing = false;
  mockWithdraw.mockReturnValue({
    unwrap: () =>
      Promise.resolve({ msg: 'Invite withdrawn and returned to you' })
  });
});

describe('PendingInvites list (#329)', () => {
  it('lists an invite with its note, sent time and time left', () => {
    withRows([invite()]);
    renderWithProviders(<PendingInvites />);
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    expect(screen.getByText('old friend')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
    expect(screen.getByText('in 2d')).toBeInTheDocument();
  });

  it('says so when nothing is pending', () => {
    withRows([]);
    renderWithProviders(<PendingInvites />);
    expect(
      screen.getByText('No invites are waiting to be accepted.')
    ).toBeInTheDocument();
  });

  it('shows a dash for an invite sent without a note', () => {
    withRows([invite({ reason: '' })]);
    renderWithProviders(<PendingInvites />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('asks for page 1 first and pages only when there is more than one', async () => {
    const user = userEvent.setup();
    withRows([invite()]);
    const { rerender } = renderWithProviders(<PendingInvites />);
    expect(mockInvites).toHaveBeenLastCalledWith(1);
    expect(
      screen.queryByRole('button', { name: 'Next' })
    ).not.toBeInTheDocument();

    withRows([invite()], 3);
    rerender(<PendingInvites />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(mockInvites).toHaveBeenLastCalledWith(2);
  });
});

describe('PendingInvites withdraw (#329)', () => {
  it('confirms first, naming the address and when it frees up', async () => {
    const { dialog } = await openWithdraw();
    expect(dialog).toHaveTextContent('Withdraw invite to guest@example.com');
    expect(dialog).toHaveTextContent(
      'The invite link stops working straight away.'
    );
    expect(dialog).toHaveTextContent(
      'This address cannot be invited again until the original invite expires, in 2 days.'
    );
    expect(mockWithdraw).not.toHaveBeenCalled();
  });

  it('keeps the invite when the dialog is dismissed', async () => {
    const { dialog, user } = await openWithdraw();
    await user.click(
      within(dialog).getByRole('button', { name: 'Keep invite' })
    );
    expect(mockWithdraw).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
  });

  it('withdraws by id and reports the api msg, which says if it came back', async () => {
    const { confirm, store } = await openWithdraw();
    await confirm();
    expect(mockWithdraw).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(hasAlert(store, 'Invite withdrawn and returned to you')).toBe(true)
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not claim a refund the api did not report', async () => {
    mockWithdraw.mockReturnValue({
      unwrap: () => Promise.resolve({ msg: 'Invite withdrawn' })
    });
    const { confirm, store } = await openWithdraw();
    await confirm();
    await waitFor(() => expect(hasAlert(store, 'Invite withdrawn')).toBe(true));
    expect(hasAlert(store, 'Invite withdrawn and returned to you')).toBe(false);
  });

  it.each([
    [409, 'Invite is no longer pending'],
    [404, 'Invite not found']
  ])(
    'shows the api msg on a %s and leaves the row to the refetch',
    async (status, msg) => {
      mockWithdraw.mockReturnValue({
        unwrap: () => Promise.reject({ status, data: { msg } })
      });
      const { confirm, store } = await openWithdraw();
      await confirm();
      await waitFor(() => expect(hasAlert(store, msg)).toBe(true));
      // Not removed here: the list says what is pending, once refetched.
      expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    }
  );

  it('locks its buttons and ignores Esc while withdrawing', async () => {
    mockWithdrawing = true;
    const { dialog, user } = await openWithdraw();
    expect(
      within(dialog).getByRole('button', { name: 'Withdrawing…' })
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Keep invite' })
    ).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
