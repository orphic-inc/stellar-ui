import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCancelInviteMutation,
  useGetInvitesQuery,
  type InviteItem,
  type InviteStatus
} from '../../store/services/adminApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { hasPermission } from '../../utils/permissions';
import { getApiErrorMessage } from '../../utils/apiError';
import Time from '../layout/Time';
import {
  PageShell,
  DataTable,
  Pagination,
  Button,
  Badge,
  Modal,
  type BadgeVariant,
  type Column
} from '../ui';

// The api's lowercase statuses (stellar-api#627, #636). Only `pending` still
// wants attention; an expired or cancelled invite ended normally, so both are
// neutral rather than danger.
const STATUS: Record<InviteStatus, { label: string; badge: BadgeVariant }> = {
  pending: { label: 'Pending', badge: 'warning' },
  accepted: { label: 'Accepted', badge: 'success' },
  expired: { label: 'Expired', badge: 'default' },
  cancelled: { label: 'Cancelled', badge: 'default' }
};

/** The api refuses `email` below 3 characters, so shorter input sends nothing. */
const EMAIL_MIN = 3;
const SEARCH_DEBOUNCE_MS = 300;

const CancelInviteModal = ({
  invite,
  onClose
}: {
  invite: InviteItem;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [cancelInvite, { isLoading }] = useCancelInviteMutation();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      dispatch(addAlert('A reason is required.', 'danger'));
      return;
    }
    const trimmedMessage = message.trim();
    try {
      await cancelInvite({
        inviteId: invite.id,
        reason: trimmedReason,
        ...(trimmedMessage ? { message: trimmedMessage } : {})
      }).unwrap();
      dispatch(addAlert(`Invite to ${invite.email} cancelled.`, 'success'));
    } catch (err) {
      // A 409 or 404 means someone else (staff, the member, the sweep) got
      // there first; the list is refetched below either way.
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to cancel invite.',
          'danger'
        )
      );
    }
    onClose();
  };

  return (
    <Modal
      title={`Cancel invite to ${invite.email}`}
      size="sm"
      onClose={onClose}
      dismissable={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="cancel-invite-reason"
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
            id="cancel-invite-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={2}
            data-st="field"
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="cancel-invite-message"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Message to inviter
            <span className="text-[var(--st-text-faint)]">
              {' '}
              Sent to {invite.inviter.username} as a System PM. Leave blank and
              they are not notified.
            </span>
          </label>
          <textarea
            id="cancel-invite-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            data-st="field"
            className="w-full"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="link" onClick={onClose} disabled={isLoading}>
            Keep invite
          </Button>
          <Button type="submit" variant="danger" disabled={isLoading}>
            {isLoading ? 'Cancelling…' : 'Cancel invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const buildColumns = (
  canEdit: boolean,
  onCancel: (invite: InviteItem) => void
): Column<InviteItem>[] => [
  {
    header: 'Inviter',
    cell: (inv) => (
      <Link to={`/user/${inv.inviter.id}`} data-st="control">
        {inv.inviter.username}
      </Link>
    )
  },
  {
    header: 'Email',
    cell: (inv) => inv.email,
    tdClassName: 'font-mono text-xs'
  },
  {
    header: 'Status',
    cell: (inv) => (
      <Badge variant={STATUS[inv.status].badge}>
        {STATUS[inv.status].label}
      </Badge>
    )
  },
  {
    header: 'Sent',
    cell: (inv) => <Time date={inv.createdAt} />,
    tdClassName: 'text-xs'
  },
  {
    header: 'Expires',
    cell: (inv) => <Time date={inv.expires} />,
    tdClassName: 'text-xs'
  },
  {
    header: 'Reason',
    cell: (inv) => inv.reason || '—',
    tdClassName: 'max-w-xs truncate text-xs'
  },
  ...(canEdit
    ? [
        {
          header: '',
          cell: (inv: InviteItem) =>
            inv.status === 'pending' ? (
              <Button variant="link-danger" onClick={() => onCancel(inv)}>
                Cancel
              </Button>
            ) : null
        }
      ]
    : [])
];

const PoolFilters = ({
  status,
  onStatus,
  emailInput,
  onEmailInput,
  onClear
}: {
  status: InviteStatus | '';
  onStatus: (status: InviteStatus | '') => void;
  emailInput: string;
  onEmailInput: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="flex flex-wrap items-end gap-2">
    <div>
      <label
        htmlFor="invite-status"
        data-st="meta"
        className="block text-xs mb-1"
      >
        Status
      </label>
      <select
        id="invite-status"
        value={status}
        onChange={(e) => onStatus(e.target.value as InviteStatus | '')}
        data-st="field"
      >
        <option value="">All statuses</option>
        {(Object.keys(STATUS) as InviteStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS[s].label}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label
        htmlFor="invite-email"
        data-st="meta"
        className="block text-xs mb-1"
      >
        Search by email
      </label>
      <input
        id="invite-email"
        type="search"
        value={emailInput}
        onChange={(e) => onEmailInput(e.target.value)}
        data-st="field"
      />
    </div>
    {(status || emailInput) && (
      <Button variant="link" onClick={onClear}>
        Clear
      </Button>
    )}
  </div>
);

const InvitePoolPage = () => {
  const user = useAppSelector(selectCurrentUser);
  const canEdit = hasPermission(user, 'invites_edit');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InviteStatus | ''>('');
  const [emailInput, setEmailInput] = useState('');
  const [email, setEmail] = useState('');
  const [cancelling, setCancelling] = useState<InviteItem | null>(null);

  // Debounced: one request per pause, and nothing below the api's minimum.
  // The page resets only when the effective search actually changes.
  useEffect(() => {
    const trimmed = emailInput.trim();
    const next = trimmed.length >= EMAIL_MIN ? trimmed : '';
    if (next === email) return;
    const timer = setTimeout(() => {
      setEmail(next);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [emailInput, email]);

  const { data, isLoading } = useGetInvitesQuery({
    page,
    ...(status ? { status } : {}),
    ...(email ? { email } : {})
  });

  const tooShort =
    emailInput.trim().length > 0 && emailInput.trim().length < EMAIL_MIN;

  return (
    <PageShell title="Invite Pool" width="xl" backTo="/staff/tools">
      <PoolFilters
        status={status}
        onStatus={(next) => {
          setStatus(next);
          setPage(1);
        }}
        emailInput={emailInput}
        onEmailInput={setEmailInput}
        onClear={() => {
          setStatus('');
          setEmailInput('');
          setEmail('');
          setPage(1);
        }}
      />
      {tooShort && (
        <p data-st="meta" className="text-xs">
          Type at least {EMAIL_MIN} characters to search.
        </p>
      )}

      <DataTable
        columns={buildColumns(canEdit, setCancelling)}
        rows={data?.data}
        rowKey={(inv) => inv.id}
        isLoading={isLoading}
        empty="No invites found."
      />
      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onChange={setPage}
      />

      {cancelling && (
        <CancelInviteModal
          invite={cancelling}
          onClose={() => setCancelling(null)}
        />
      )}
    </PageShell>
  );
};

export default InvitePoolPage;
