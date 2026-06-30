import { useState } from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import { useGetRatioWatchQuery } from '../../store/services/adminApi';
import Time from '../layout/Time';
import { PageShell, DataTable, Pagination, type Column } from '../ui';

type RatioWatchRow = NonNullable<
  ReturnType<typeof useGetRatioWatchQuery>['data']
>['data'][number];

const RatioWatchPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetRatioWatchQuery(page);

  const columns: Column<RatioWatchRow>[] = [
    {
      header: 'User',
      cell: (r) => (
        <Link to={`/private/user/${r.user.id}`} data-st="control">
          {r.user.username}
        </Link>
      )
    },
    {
      header: 'Status',
      cell: (r) => (
        <span
          className={cn(
            'text-xs font-semibold',
            r.status === 'LEECH_DISABLED'
              ? 'text-[var(--st-danger)]'
              : 'text-[var(--st-warning)]'
          )}
        >
          {r.status === 'LEECH_DISABLED' ? 'Leech Disabled' : 'Watch'}
        </span>
      )
    },
    {
      header: 'Watch Started',
      cell: (r) => (r.watchStartedAt ? <Time date={r.watchStartedAt} /> : '—'),
      tdClassName: 'text-xs'
    },
    {
      header: 'Watch Expires',
      cell: (r) => (r.watchExpiresAt ? <Time date={r.watchExpiresAt} /> : '—'),
      tdClassName: 'text-xs'
    },
    {
      header: 'Leech Disabled',
      cell: (r) =>
        r.leechDisabledAt ? <Time date={r.leechDisabledAt} /> : '—',
      tdClassName: 'text-xs'
    },
    {
      header: 'Last Evaluated',
      cell: (r) => <Time date={r.lastEvaluatedAt} />,
      tdClassName: 'text-xs'
    }
  ];

  return (
    <PageShell title="Ratio Watch" width="xl" backTo="/private/staff/tools">
      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(r) => r.userId}
        isLoading={isLoading}
        empty="No users on ratio watch."
      />
      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default RatioWatchPage;
