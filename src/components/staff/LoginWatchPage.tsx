import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSessionsQuery } from '../../store/services/adminApi';
import Time from '../layout/Time';
import { PageShell, DataTable, Pagination, Button, type Column } from '../ui';

type Session = NonNullable<
  ReturnType<typeof useGetSessionsQuery>['data']
>['data'][number];

const LoginWatchPage = () => {
  const [page, setPage] = useState(1);
  const [userIdInput, setUserIdInput] = useState('');
  const [userId, setUserId] = useState<number | undefined>();

  const { data, isLoading } = useGetSessionsQuery(
    userId ? { page, userId } : { page }
  );

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userIdInput, 10);
    setUserId(isNaN(parsed) ? undefined : parsed);
    setPage(1);
  };

  const clearFilter = () => {
    setUserIdInput('');
    setUserId(undefined);
    setPage(1);
  };

  const columns: Column<Session>[] = [
    {
      header: 'User',
      cell: (s) => (
        <Link to={`/private/user/${s.user.id}`} data-st="control">
          {s.user.username}
        </Link>
      )
    },
    {
      header: 'IP Address',
      cell: (s) => s.ipAddress,
      tdClassName: 'font-mono text-xs'
    },
    {
      header: 'User Agent',
      cell: (s) => (s.userAgent ? s.userAgent.slice(0, 60) : '—'),
      tdClassName: 'max-w-xs truncate text-xs'
    },
    {
      header: 'First Seen',
      cell: (s) => <Time date={s.createdAt} />,
      tdClassName: 'text-xs'
    },
    {
      header: 'Last Active',
      cell: (s) => <Time date={s.lastActiveAt} />,
      tdClassName: 'text-xs'
    },
    {
      header: 'Revoked',
      cell: (s) => (s.revokedAt ? <Time date={s.revokedAt} /> : '—'),
      tdClassName: 'text-xs'
    }
  ];

  return (
    <PageShell title="Login Watch" width="2xl" backTo="/private/staff/tools">
      <form onSubmit={handleFilter} className="flex gap-2">
        <input
          type="number"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          placeholder="Filter by user ID"
          data-st="field"
        />
        <Button type="submit" variant="primary">
          Filter
        </Button>
        {userId && (
          <Button variant="link" onClick={clearFilter}>
            Clear
          </Button>
        )}
      </form>

      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        empty={
          userId
            ? 'No sessions found for this user.'
            : 'Enter a user ID above to search sessions.'
        }
      />
      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default LoginWatchPage;
