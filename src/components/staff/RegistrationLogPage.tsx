import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRegistrationLogQuery } from '../../store/services/adminApi';
import { PageShell, DataTable, Pagination, Badge, type Column } from '../ui';

type LogUser = NonNullable<
  ReturnType<typeof useGetRegistrationLogQuery>['data']
>['data'][number];

const RegistrationLogPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetRegistrationLogQuery(page);

  const columns: Column<LogUser>[] = [
    {
      header: 'Username',
      cell: (user) => (
        <span className="flex items-center gap-2">
          <Link
            to={`/private/user/${user.id}`}
            data-st="control"
            className="font-medium"
          >
            {user.username}
          </Link>
          {user.disabled && <Badge variant="danger">Disabled</Badge>}
        </span>
      )
    },
    {
      header: 'Email',
      cell: (user) => user.email ?? '—',
      tdClassName: 'truncate'
    },
    { header: 'Rank', cell: (user) => user.userRank?.name ?? '—' },
    {
      header: 'Registered',
      cell: (user) => new Date(user.dateRegistered).toLocaleDateString(),
      tdClassName: 'whitespace-nowrap'
    },
    {
      header: 'Last IP',
      cell: (user) => user.lastIp ?? '—',
      tdClassName: 'font-mono'
    }
  ];

  return (
    <PageShell title="Registration Log" width="lg">
      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        empty="No users found."
      />
      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default RegistrationLogPage;
