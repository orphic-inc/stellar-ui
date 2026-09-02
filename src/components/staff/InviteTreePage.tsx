import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetInviteTreeQuery,
  type InviteTreeItem
} from '../../store/services/adminApi';
import { PageShell, DataTable, Pagination, type Column } from '../ui';

const InviteTreePage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetInviteTreeQuery(page);

  const columns: Column<InviteTreeItem>[] = [
    {
      header: 'User',
      cell: (row) => (
        <Link to={`/user/${row.user.id}`} data-st="control">
          {row.user.username}
        </Link>
      )
    },
    {
      header: 'Invited By',
      cell: (row) =>
        row.inviter ? (
          <Link to={`/user/${row.inviter.id}`} data-st="control">
            {row.inviter.username}
          </Link>
        ) : (
          <span className="text-[var(--st-text-faint)]">—</span>
        )
    },
    {
      header: 'Invited',
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  return (
    <PageShell title="Invite Tree" width="xl">
      <DataTable
        columns={columns}
        rows={data?.data}
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
