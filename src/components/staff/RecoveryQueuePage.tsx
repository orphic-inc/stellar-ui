import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import cn from 'classnames';
import {
  useGetRecoveryRequestsQuery,
  useRevokeRecoveryRequestMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Time from '../layout/Time';
import {
  PageShell,
  DataTable,
  Pagination,
  Badge,
  Button,
  type BadgeVariant,
  type Column
} from '../ui';

type StatusFilter = 'pending' | 'used' | 'expired';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'used', label: 'Used' },
  { value: 'expired', label: 'Expired' }
];

const STATUS_VARIANT: Record<StatusFilter, BadgeVariant> = {
  pending: 'warning',
  used: 'success',
  expired: 'default'
};

type RecoveryRow = NonNullable<
  ReturnType<typeof useGetRecoveryRequestsQuery>['data']
>['data'][number];

const RecoveryQueuePage = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetRecoveryRequestsQuery({
    page,
    status
  });

  const [revoke, { isLoading: isRevoking }] =
    useRevokeRecoveryRequestMutation();

  const handleTabChange = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const handleRevoke = async (id: number, username: string) => {
    if (!confirm(`Revoke recovery token for ${username}?`)) return;
    try {
      await revoke(id).unwrap();
      dispatch(addAlert('Recovery token revoked.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to revoke token.', 'danger')
      );
    }
  };

  const columns: Column<RecoveryRow>[] = [
    {
      header: 'User',
      cell: (row) => (
        <Link to={`/private/user/${row.userId}`} data-st="control">
          {row.username}
        </Link>
      )
    },
    { header: 'Email', cell: (row) => row.email, tdClassName: 'text-xs' },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={STATUS_VARIANT[row.status as StatusFilter] ?? 'default'}
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Created',
      cell: (row) => <Time date={row.createdAt} />,
      tdClassName: 'text-xs'
    },
    {
      header: 'Expires',
      cell: (row) => <Time date={row.expiresAt} />,
      tdClassName: 'text-xs'
    },
    {
      header: 'Actions',
      cell: (row) =>
        row.status === 'pending' ? (
          <Button
            variant="link-danger"
            disabled={isRevoking || isFetching}
            onClick={() => handleRevoke(row.id, row.username)}
          >
            Revoke
          </Button>
        ) : null
    }
  ];

  return (
    <PageShell title="Recovery Queue" width="xl">
      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded transition-colors',
              status === t.value
                ? 'bg-[var(--st-accent)] text-[var(--st-text-strong)]'
                : 'bg-[var(--st-raised)] text-[var(--st-text-muted)] hover:text-[var(--st-text)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        empty={`No ${status} recovery requests.`}
      />
      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default RecoveryQueuePage;
