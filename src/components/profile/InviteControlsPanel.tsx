import { useState } from 'react';
import {
  useSetUserCanInviteMutation,
  useSetUserInviteCountMutation
} from '../../store/services/userApi';
import { profileApi } from '../../store/services/profileApi';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { Button, Modal } from '../ui';

/** The api's bound on a staff-set balance (stellar-api#636). */
const MAX_INVITE_COUNT = 1000;

const MESSAGE_HINT =
  'Sent to the member as a System PM, with a pointer to Staff PM. Leave blank to notify nobody.';

type Notes = { reason: string; message?: string };

/** Trimmed reason and message, or null when the required reason is blank. */
const toNotes = (reason: string, message: string): Notes | null => {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return null;
  const trimmedMessage = message.trim();
  return {
    reason: trimmedReason,
    ...(trimmedMessage ? { message: trimmedMessage } : {})
  };
};

const isConflict = (err: unknown) =>
  (err as { status?: unknown } | undefined)?.status === 409;

const NoteFields = ({
  idPrefix,
  reason,
  onReason,
  message,
  onMessage
}: {
  idPrefix: string;
  reason: string;
  onReason: (value: string) => void;
  message: string;
  onMessage: (value: string) => void;
}) => (
  <>
    <div>
      <label
        htmlFor={`${idPrefix}-reason`}
        data-st="meta"
        className="block text-xs mb-1"
      >
        Reason
        <span className="text-[var(--st-danger)]"> *</span>
        <span className="text-[var(--st-text-faint)]">
          {' '}
          Staff only, recorded in the audit log.
        </span>
      </label>
      <textarea
        id={`${idPrefix}-reason`}
        value={reason}
        onChange={(e) => onReason(e.target.value)}
        required
        rows={2}
        data-st="field"
        className="w-full"
      />
    </div>
    <div>
      <label
        htmlFor={`${idPrefix}-message`}
        data-st="meta"
        className="block text-xs mb-1"
      >
        Message to member
        <span className="text-[var(--st-text-faint)]"> {MESSAGE_HINT}</span>
      </label>
      <textarea
        id={`${idPrefix}-message`}
        value={message}
        onChange={(e) => onMessage(e.target.value)}
        rows={3}
        data-st="field"
        className="w-full"
      />
    </div>
  </>
);

/**
 * Revoke or restore. The direction is fixed when the dialog opens, so a
 * concurrent change by someone else cannot flip what the confirm button does;
 * the api is idempotent, so confirming a state already reached still succeeds.
 */
const CanInviteModal = ({
  profileId,
  canInvite,
  onClose
}: {
  profileId: number;
  canInvite: boolean;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [setCanInvite, { isLoading }] = useSetUserCanInviteMutation();
  const [target] = useState(!canInvite);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const action = target ? 'Restore invites' : 'Revoke invites';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const notes = toNotes(reason, message);
    if (!notes) {
      dispatch(addAlert('A reason is required.', 'danger'));
      return;
    }
    try {
      await setCanInvite({
        id: profileId,
        canInvite: target,
        ...notes
      }).unwrap();
      dispatch(
        addAlert(
          target ? 'Invite privileges restored.' : 'Invite privileges revoked.',
          'success'
        )
      );
      onClose();
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to update invite privileges.',
          'danger'
        )
      );
    }
  };

  return (
    <Modal title={action} size="sm" onClose={onClose} dismissable={!isLoading}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p data-st="prose" className="text-sm">
          {target
            ? "They can send invites and receive them from the handout again. Pending invites already refunded by the sweep don't come back."
            : "They can't send invites or receive any from the handout. Their pending invites stop working now and are refunded within the hour. Their balance is kept."}
        </p>
        <NoteFields
          idPrefix="can-invite"
          reason={reason}
          onReason={setReason}
          message={message}
          onMessage={setMessage}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="link" onClick={onClose} disabled={isLoading}>
            Keep as is
          </Button>
          <Button
            type="submit"
            variant={target ? 'primary' : 'danger'}
            disabled={isLoading}
          >
            {isLoading ? 'Saving…' : action}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const BalanceField = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <label
      htmlFor="invite-count-next"
      data-st="meta"
      className="block text-xs mb-1"
    >
      New balance
      <span className="text-[var(--st-text-faint)]">
        {' '}
        0–{MAX_INVITE_COUNT}. Not limited by the rank&apos;s invite cap. This
        doesn&apos;t refund or cancel pending invites.
      </span>
    </label>
    <input
      id="invite-count-next"
      type="number"
      min={0}
      max={MAX_INVITE_COUNT}
      step={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      data-st="field"
      className="w-28"
    />
  </div>
);

type Conflict = { current: number | null };

// No `prose` role: its text colour would beat the warning one.
const ConflictNotice = ({ conflict }: { conflict: Conflict }) => (
  <p
    role="alert"
    className="text-sm rounded border border-[var(--st-warning)] px-3 py-2 text-[var(--st-warning)]"
  >
    The balance changed while you were editing.
    {conflict.current === null
      ? ' Reload the page to see the current balance.'
      : ` It is now ${conflict.current}. Check the new balance and save again.`}
  </p>
);

/**
 * A 409 means the balance moved after the dialog opened. Wait for the reloaded
 * profile (the mutation's invalidation has usually started it already; this
 * joins that request rather than racing it) so the notice names the balance the
 * next save will be checked against, not the one that just lost.
 */
const useReloadedInviteCount = (profileId: number) => {
  const dispatch = useAppDispatch();
  return async (): Promise<number | null> => {
    const result = await dispatch(
      profileApi.endpoints.getProfileByUserId.initiate(String(profileId), {
        forceRefetch: true,
        subscribe: false
      })
    );
    return result.data?.inviteCount ?? null;
  };
};

const InviteBalanceModal = ({
  profileId,
  inviteCount,
  onClose
}: {
  profileId: number;
  inviteCount: number;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [setInviteCount, { isLoading }] = useSetUserInviteCountMutation();
  const reloadInviteCount = useReloadedInviteCount(profileId);
  const [next, setNext] = useState(String(inviteCount));
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const nextCount = Number(next);
  const validCount =
    next.trim() !== '' &&
    Number.isInteger(nextCount) &&
    nextCount >= 0 &&
    nextCount <= MAX_INVITE_COUNT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const notes = toNotes(reason, message);
    if (!notes) {
      dispatch(addAlert('A reason is required.', 'danger'));
      return;
    }
    try {
      // The balance on screen is the one the api compares against.
      await setInviteCount({
        id: profileId,
        inviteCount: nextCount,
        expectedInviteCount: inviteCount,
        ...notes
      }).unwrap();
      dispatch(addAlert(`Invite balance set to ${nextCount}.`, 'success'));
      onClose();
    } catch (err) {
      if (isConflict(err)) {
        setConflict({ current: await reloadInviteCount() });
        return;
      }
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to set the invite balance.',
          'danger'
        )
      );
    }
  };

  return (
    <Modal
      title="Edit invite balance"
      size="sm"
      onClose={onClose}
      dismissable={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <p data-st="prose" className="text-sm">
          Current balance: <strong>{inviteCount}</strong>
        </p>
        {conflict && <ConflictNotice conflict={conflict} />}
        <BalanceField value={next} onChange={setNext} />
        <NoteFields
          idPrefix="invite-count"
          reason={reason}
          onReason={setReason}
          message={message}
          onMessage={setMessage}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="link" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !validCount || nextCount === inviteCount}
          >
            {isLoading ? 'Saving…' : 'Set balance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * Staff controls for a member's invites (stellar-ui#329, stellar-api#636).
 * Mounted by the profile's staff actions only for `invites_edit`, and only when
 * the api disclosed both fields to this viewer.
 */
const InviteControlsPanel = ({
  profileId,
  inviteCount,
  canInvite,
  bodyClass
}: {
  profileId: number;
  inviteCount: number;
  canInvite: boolean;
  bodyClass: string;
}) => {
  const [open, setOpen] = useState<'balance' | 'privileges' | null>(null);
  const close = () => setOpen(null);

  return (
    <div data-st="panel">
      <div data-st="colhead">Invites</div>
      <div className={`${bodyClass} space-y-2 text-sm`}>
        <div className="flex items-center justify-between gap-2">
          <span data-st="prose">
            <span data-st="meta">Balance:</span> {inviteCount}
          </span>
          <Button variant="link" onClick={() => setOpen('balance')}>
            Edit balance
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span data-st="prose">
            <span data-st="meta">Privileges:</span>{' '}
            {canInvite ? 'Allowed' : <strong>Revoked</strong>}
          </span>
          <Button
            variant={canInvite ? 'link-danger' : 'link'}
            onClick={() => setOpen('privileges')}
          >
            {canInvite ? 'Revoke invites' : 'Restore invites'}
          </Button>
        </div>
      </div>
      {open === 'balance' && (
        <InviteBalanceModal
          profileId={profileId}
          inviteCount={inviteCount}
          onClose={close}
        />
      )}
      {open === 'privileges' && (
        <CanInviteModal
          profileId={profileId}
          canInvite={canInvite}
          onClose={close}
        />
      )}
    </div>
  );
};

export default InviteControlsPanel;
