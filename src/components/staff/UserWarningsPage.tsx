import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllWarningsQuery } from '../../store/services/userApi';
import Time from '../layout/Time';
import { PageShell, DataTable, Button, Pagination } from '../ui';
import type { Column } from '../ui';

const UserWarningsPage = () => {
  const [page, setPage] = useState(1);
  const [userIdInput, setUserIdInput] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<number | undefined>();

  const { data, isLoading } = useGetAllWarningsQuery({
    page,
    userId: userIdFilter
  });

  const warnings = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userIdInput, 10);
    setUserIdFilter(isNaN(parsed) ? undefined : parsed);
    setPage(1);
  };

  const handleClearFilter = () => {
    setUserIdInput('');
    setUserIdFilter(undefined);
    setPage(1);
  };

  const columns: Column<(typeof warnings)[number]>[] = [
    {
      header: 'User',
      cell: (w) => (
        <Link to={`/user/${w.userId}`} data-st="control">
          {w.user?.username ?? `#${w.userId}`}
        </Link>
      )
    },
    {
      header: 'Reason',
      cell: (w) => w.reason,
      tdClassName: 'max-w-xs truncate'
    },
    {
      header: 'Warned by',
      cell: (w) =>
        w.warnedBy ? (
          <Link to={`/user/${w.warnedBy.id}`} data-st="control">
            {w.warnedBy.username}
          </Link>
        ) : (
          '—'
        )
    },
    { header: 'Issued', cell: (w) => <Time date={w.createdAt} /> },
    {
      header: 'Expires',
      cell: (w) => (w.expiresAt ? <Time date={w.expiresAt} /> : '—')
    }
  ];

  return (
    <PageShell title="User Warnings" width="xl">
      <form onSubmit={handleFilter} className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          placeholder="Filter by user ID"
          data-st="field"
          className="w-44 px-3 py-1.5 text-sm"
        />
        <Button type="submit" variant="primary">
          Filter
        </Button>
        {userIdFilter && (
          <Button type="button" variant="link" onClick={handleClearFilter}>
            Clear
          </Button>
        )}
      </form>

      <DataTable
        columns={columns}
        rows={warnings}
        rowKey={(w) => w.id}
        isLoading={isLoading}
        empty="No warnings found."
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </PageShell>
  );
};

export default UserWarningsPage;
