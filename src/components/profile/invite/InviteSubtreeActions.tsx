import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { addAlert } from '../../../store/slices/alertSlice';
import {
  useApplyInviteSubtreeActionMutation,
  useLazyPreviewInviteSubtreeQuery,
  type InviteSubtreeAction,
  type InviteSubtreePreview
} from '../../../store/services/inviteSubtreeApi';
import { getApiErrorMessage } from '../../../utils/apiError';
import { hasPermission } from '../../../utils/permissions';
import type { AuthUser } from '../../../types';
import { Button } from '../../ui';

type Permission = Parameters<typeof hasPermission>[1];

type ActionSpec = {
  value: InviteSubtreeAction;
  label: string;
  /** The single-member permission the api requires on top of `invites_manage`. */
  permission: Permission;
  confirm: (members: string) => string;
  /** How the result names members already in the target state. */
  unchanged?: string;
};

const ACTIONS: ActionSpec[] = [
  {
    value: 'note',
    label: 'Note only',
    permission: 'users_edit',
    confirm: (m) => `Note ${m}`
  },
  {
    value: 'disable',
    label: 'Disable',
    permission: 'users_disable',
    confirm: (m) => `Disable ${m}`,
    unchanged: 'already disabled'
  },
  {
    value: 'revoke_invites',
    label: 'Revoke invite privileges',
    permission: 'invites_edit',
    confirm: (m) => `Revoke invites from ${m}`,
    unchanged: 'already without invite privileges'
  }
];

const members = (n: number) => `${n} member${n === 1 ? '' : 's'}`;

/** The actions this viewer may run: each needs `invites_manage` and its own permission. */
export const availableActions = (user: AuthUser | null | undefined) =>
  hasPermission(user, 'invites_manage')
    ? ACTIONS.filter((a) => hasPermission(user, a.permission))
    : [];

const resultMessage = (
  spec: ActionSpec,
  { changed, unchanged }: { changed: number; unchanged: number }
) =>
  `Done: ${members(changed)} changed` +
  (spec.unchanged && unchanged > 0
    ? `; ${members(unchanged)} ${spec.unchanged}.`
    : '.');

const PreviewSummary = ({ preview }: { preview: InviteSubtreePreview }) => (
  <div data-st="panel" className="p-3 space-y-2">
    <p data-st="prose" className="text-sm">
      {members(preview.count)} under this member. {preview.disabled} already
      disabled, {preview.withoutInvites} already without invite privileges.
    </p>
    <div className="flex flex-wrap gap-1.5">
      {preview.members.map((m) => (
        <span key={m.id} data-st="chip" className="text-xs">
          {m.username}
          <span data-st="meta"> · depth {m.depth}</span>
        </span>
      ))}
    </div>
  </div>
);

/** Preview the subtree, then apply one action bound to the previewed count. */
const useSubtreeRun = (rootId: number) => {
  const dispatch = useDispatch();
  const [preview, setPreview] = useState<InviteSubtreePreview | null>(null);
  const [loadPreview, { isFetching }] = useLazyPreviewInviteSubtreeQuery();
  const [apply, { isLoading: isApplying }] =
    useApplyInviteSubtreeActionMutation();

  const fail = (err: unknown, fallback: string) =>
    dispatch(addAlert(getApiErrorMessage(err) ?? fallback, 'danger'));

  const runPreview = async () => {
    try {
      setPreview(await loadPreview(rootId).unwrap());
    } catch (err) {
      fail(err, 'Failed to preview the invite tree.');
    }
  };

  const runApply = async (spec: ActionSpec, reason: string) => {
    if (!preview) return false;
    try {
      const result = await apply({
        id: rootId,
        action: spec.value,
        reason,
        expectedCount: preview.count
      }).unwrap();
      dispatch(addAlert(resultMessage(spec, result), 'success'));
      return true;
    } catch (err) {
      fail(err, 'Failed to apply the action.');
      return false;
    } finally {
      // Applied, or refused: either way the preview is spent. A 409 means the
      // tree moved, so staff preview again.
      setPreview(null);
    }
  };

  return { preview, isFetching, isApplying, runPreview, runApply };
};

const ActionControls = ({
  actions,
  action,
  onAction,
  reason,
  onReason,
  onPreview,
  isFetching
}: {
  actions: ActionSpec[];
  action: InviteSubtreeAction;
  onAction: (next: InviteSubtreeAction) => void;
  reason: string;
  onReason: (next: string) => void;
  onPreview: () => void;
  isFetching: boolean;
}) => (
  <div className="flex flex-wrap gap-3 items-end">
    <div>
      <label htmlFor="subtree-action" data-st="meta" className="block mb-1">
        Action
      </label>
      <select
        id="subtree-action"
        data-st="field"
        value={action}
        onChange={(e) => onAction(e.target.value as InviteSubtreeAction)}
      >
        {actions.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
    <div className="flex-1 min-w-48">
      <label htmlFor="subtree-reason" data-st="meta" className="block mb-1">
        Reason
      </label>
      <input
        id="subtree-reason"
        data-st="field"
        type="text"
        value={reason}
        onChange={(e) => onReason(e.target.value)}
        className="w-full"
      />
    </div>
    <Button variant="link" onClick={onPreview} disabled={isFetching}>
      {isFetching ? 'Previewing…' : 'Preview'}
    </Button>
  </div>
);

/**
 * Staff act on every member a member invited, directly or down the chain, with
 * that member excluded (stellar-api#639, ADR-0056). Staff preview the subtree,
 * then confirm with the previewed count in the button; the api refuses the run
 * if the tree has changed since.
 */
const InviteSubtreeActions = ({ rootId }: { rootId: number }) => {
  const actions = availableActions(useSelector(selectCurrentUser));
  const [action, setAction] = useState<InviteSubtreeAction>('note');
  const [reason, setReason] = useState('');
  const run = useSubtreeRun(rootId);

  if (actions.length === 0) return null;
  const spec = actions.find((a) => a.value === action) ?? actions[0];
  const preview = run.preview;

  const handleApply = async () => {
    if (await run.runApply(spec, reason)) setReason('');
  };

  return (
    <section data-st="panel" className="p-4 mb-6 space-y-3">
      <h3 data-st="prose" data-st-strong>
        Act on this invite tree
      </h3>
      <p data-st="meta" className="text-xs">
        Applies to every member below this one, not to this member. Each gets a
        staff note with the reason. Members are not messaged, and there is no
        bulk undo.
      </p>
      <ActionControls
        actions={actions}
        action={spec.value}
        onAction={setAction}
        reason={reason}
        onReason={setReason}
        onPreview={run.runPreview}
        isFetching={run.isFetching}
      />
      {preview && <PreviewSummary preview={preview} />}
      {preview && preview.count > 0 && (
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={run.isApplying || reason.trim() === ''}
        >
          {spec.confirm(members(preview.count))}
        </Button>
      )}
    </section>
  );
};

export default InviteSubtreeActions;
