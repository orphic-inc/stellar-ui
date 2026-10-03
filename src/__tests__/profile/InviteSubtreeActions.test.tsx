import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import InviteSubtreeActions from '../../components/profile/invite/InviteSubtreeActions';
import type { AuthUser } from '../../types';

// Triggers return `{ unwrap }`, as RTK's do: a bare promise would make the
// component's `.unwrap()` throw into its own catch and pass a success test for
// the wrong reason.
const mockPreview = jest.fn();
const mockApply = jest.fn();

jest.mock('../../store/services/inviteSubtreeApi', () => ({
  useLazyPreviewInviteSubtreeQuery: () => [mockPreview, { isFetching: false }],
  useApplyInviteSubtreeActionMutation: () => [mockApply, { isLoading: false }]
}));

const resolved = <T,>(data: T) => ({ unwrap: () => Promise.resolve(data) });
const rejected = (status: number, msg: string) => ({
  unwrap: () => Promise.reject({ status, data: { msg } })
});

const preview = (count = 3) => ({
  rootUserId: 7,
  count,
  disabled: 1,
  withoutInvites: 1,
  members: Array.from({ length: count }, (_, i) => ({
    id: 10 + i,
    username: `member${i}`,
    depth: 1,
    disabled: false,
    canInvite: true
  }))
});

const renderAs = (permissions: Record<string, boolean>) => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 1,
      username: 'staff',
      userRank: { permissions }
    } as unknown as AuthUser)
  );
  return renderWithProviders(<InviteSubtreeActions rootId={7} />, { store });
};

const previewAndReason = async (reason = 'invite ring') => {
  await userEvent.type(screen.getByLabelText(/reason/i), reason);
  await userEvent.click(screen.getByRole('button', { name: /^preview$/i }));
};

beforeEach(() => jest.clearAllMocks());

describe('which actions a viewer sees', () => {
  it('shows nothing without invites_manage', () => {
    const { container } = renderAs({ users_disable: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when no action permission comes with invites_manage', () => {
    const { container } = renderAs({ invites_manage: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('offers only the actions the viewer holds the permission for', () => {
    renderAs({ invites_manage: true, users_disable: true });
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Disable']);
  });
});

describe('preview, then apply', () => {
  const staff = { invites_manage: true, users_disable: true, users_edit: true };

  it('names the previewed count on the confirm and sends it', async () => {
    mockPreview.mockReturnValue(resolved(preview(3)));
    mockApply.mockReturnValue(
      resolved({ action: 'disable', count: 3, changed: 2, unchanged: 1 })
    );
    const { store } = renderAs(staff);

    await userEvent.selectOptions(screen.getByLabelText(/action/i), 'disable');
    await previewAndReason();
    expect(mockPreview).toHaveBeenCalledWith(7);
    expect(
      screen.getByText(/3 members under this member/i)
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Disable 3 members' })
    );

    expect(mockApply).toHaveBeenCalledWith({
      id: 7,
      action: 'disable',
      reason: 'invite ring',
      expectedCount: 3
    });
    await waitFor(() =>
      expect(store.getState().alert[0]).toMatchObject({
        alertType: 'success',
        msg: 'Done: 2 members changed; 1 member already disabled.'
      })
    );
  });

  it('keeps the confirm disabled until there is a reason', async () => {
    mockPreview.mockReturnValue(resolved(preview(2)));
    renderAs(staff);

    await userEvent.click(screen.getByRole('button', { name: /^preview$/i }));
    expect(
      screen.getByRole('button', { name: 'Note 2 members' })
    ).toBeDisabled();
  });

  it('offers no confirm when the tree is empty', async () => {
    mockPreview.mockReturnValue(resolved(preview(0)));
    renderAs(staff);

    await previewAndReason();
    expect(
      screen.getByText(/0 members under this member/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^note/i })).toBeNull();
  });

  it("alerts with the api's message on a 409 and drops the stale preview", async () => {
    mockPreview.mockReturnValue(resolved(preview(3)));
    mockApply.mockReturnValue(
      rejected(
        409,
        'This invite tree now has 4 members, not 3. Preview it again.'
      )
    );
    const { store } = renderAs(staff);

    await previewAndReason();
    await userEvent.click(
      screen.getByRole('button', { name: 'Note 3 members' })
    );

    await waitFor(() =>
      expect(store.getState().alert[0]).toMatchObject({
        alertType: 'danger',
        msg: 'This invite tree now has 4 members, not 3. Preview it again.'
      })
    );
    expect(
      screen.queryByRole('button', { name: /note 3 members/i })
    ).toBeNull();
  });

  it('alerts when the preview fails', async () => {
    mockPreview.mockReturnValue(rejected(404, 'User not found'));
    const { store } = renderAs(staff);

    await previewAndReason();
    await waitFor(() =>
      expect(store.getState().alert[0]).toMatchObject({
        alertType: 'danger',
        msg: 'User not found'
      })
    );
  });
});
