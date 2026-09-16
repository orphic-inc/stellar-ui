import { useState } from 'react';
import {
  useGetMyInvitesQuery,
  useWithdrawInviteMutation,
  type OwnInviteItem
} from '../../../store/services/profileApi';
import { useAppDispatch } from '../../../store/hooks';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import { untilTime } from '../../../utils';
import Time from '../../layout/Time';
import { DataTable, Pagination, Button, Modal, type Column } from '../../ui';

/**
 * Confirming a withdraw. The api takes no body and answers whether the invite
 * came back to the balance (an `invites_unlimited` send spent nothing), so the
 * success text is its `msg` rather than a guess made here.
 */
const WithdrawModal = ({
  invite,
  onClose
}: {
  invite: OwnInviteItem;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [withdrawInvite, { isLoading }] = useWithdrawInviteMutation();

  const handleWithdraw = async () => {
    try {
      const { msg } = await withdrawInvite(invite.id).unwrap();
      dispatch(addAlert(msg, 'success'));
    } catch (err) {
      // 404/409: the sweep, staff or the invitee got there first. The list is
      // refetched either way, so the row goes when the api says it has.
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to withdraw the invite.',
          'danger'
        )
      );
    }
    onClose();
  };

  return (
    <Modal
      title={`Withdraw invite to ${invite.email}`}
      size="sm"
      onClose={onClose}
      dismissable={!isLoading}
    >
      <div className="space-y-3">
        <p data-st="prose" className="text-sm">
          The invite link stops working straight away.
        </p>
        <p data-st="prose" className="text-sm">
          This address cannot be invited again until the original invite
          expires, {untilTime(invite.expires)}.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="link" onClick={onClose} disabled={isLoading}>
            Keep invite
          </Button>
          <Button
            variant="danger"
            onClick={handleWithdraw}
            disabled={isLoading}
          >
            {isLoading ? 'Withdrawing…' : 'Withdraw invite'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const buildColumns = (
  onWithdraw: (invite: OwnInviteItem) => void
): Column<OwnInviteItem>[] => [
  { header: 'Email', cell: (inv) => inv.email },
  { header: 'Note', cell: (inv) => inv.reason || '—' },
  {
    header: 'Sent',
    cell: (inv) => <Time date={inv.createdAt} />
  },
  {
    header: 'Expires',
    cell: (inv) => <Time date={inv.expires} />
  },
  {
    header: '',
    cell: (inv) => (
      <Button variant="link-danger" onClick={() => onWithdraw(inv)}>
        Withdraw
      </Button>
    )
  }
];

/**
 * The member's own pending invites (stellar-api#640): only those registration
 * would still accept, soonest to lapse first. A revoked member's invites have
 * lapsed, so the api answers an empty list.
 */
const PendingInvites = () => {
  const [page, setPage] = useState(1);
  const [withdrawing, setWithdrawing] = useState<OwnInviteItem | null>(null);
  const { data, isLoading } = useGetMyInvitesQuery(page);
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="box" data-st="panel">
      <div data-st="colhead">Pending invites</div>
      <DataTable
        columns={buildColumns(setWithdrawing)}
        rows={data?.data}
        rowKey={(inv) => inv.id}
        isLoading={isLoading}
        empty="No invites are waiting to be accepted."
      />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      {withdrawing && (
        <WithdrawModal
          invite={withdrawing}
          onClose={() => setWithdrawing(null)}
        />
      )}
    </div>
  );
};

export default PendingInvites;
