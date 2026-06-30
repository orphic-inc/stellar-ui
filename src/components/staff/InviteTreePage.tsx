import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInviteTreeQuery } from '../../store/services/adminApi';
import { PageShell, DataTable, Pagination, type Column } from '../ui';

type InviteTreeRow = {
  id: number;
  user: { id: number; username: string };
  inviter?: { id: number; username: string } | null;
  treeId: number;
  treeLevel: number;
  treePosition: number;
};

const InviteTreePage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetInviteTreeQuery(page);

  const columns: Column<InviteTreeRow>[] = [
    {
      header: 'User',
      cell: (row) => (
        <Link to={`/private/user/${row.user.id}`} data-st="control">
          {row.user.username}
        </Link>
      )
    },
    {
      header: 'Invited By',
      cell: (row) =>
        row.inviter ? (
          <Link to={`/private/user/${row.inviter.id}`} data-st="control">
            {row.inviter.username}
          </Link>
        ) : (
          <span className="text-[var(--st-text-faint)]">—</span>
        )
    },
    {
      header: 'Tree',
      numeric: true,
      tdClassName: 'font-mono text-xs',
      cell: (row) => row.treeId
    },
    { header: 'Level', numeric: true, cell: (row) => row.treeLevel },
    { header: 'Position', numeric: true, cell: (row) => row.treePosition }
  ];

  return (
    <PageShell title="Invite Tree" width="xl">
      <DataTable
        columns={columns}
        rows={data?.data as InviteTreeRow[] | undefined}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        empty="No invite tree data."
      />
      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default InviteTreePage;
