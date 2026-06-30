import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInvitesQuery } from '../../store/services/adminApi';
import Time from '../layout/Time';
import { PageShell, DataTable, Pagination, Button, type Column } from '../ui';

const STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'USED', 'CANCELLED'];

function inviteStatusColor(status: string): string {
  if (status === 'USED' || status === 'ACCEPTED')
    return 'text-[var(--st-success)]';
  if (status === 'EXPIRED' || status === 'CANCELLED')
    return 'text-[var(--st-danger)]';
  return 'text-[var(--st-warning)]';
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

type Invite = NonNullable<
  ReturnType<typeof useGetInvitesQuery>['data']
>['data'][number];

const InvitePoolPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useGetInvitesQuery(
    status ? { page, status } : { page }
  );

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const columns: Column<Invite>[] = [
    {
      header: 'Inviter',
      cell: (inv) => (
        <Link to={`/private/user/${inv.inviter.id}`} data-st="control">
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
        <span className={`text-xs ${inviteStatusColor(inv.status)}`}>
          {titleCase(inv.status)}
        </span>
      )
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
    }
  ];

  return (
    <PageShell title="Invite Pool" width="xl" backTo="/private/staff/tools">
      <div className="flex gap-2">
        <select value={status} onChange={handleStatusChange} data-st="field">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
        {status && (
          <Button
            variant="link"
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
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
    </PageShell>
  );
};

export default InvitePoolPage;
