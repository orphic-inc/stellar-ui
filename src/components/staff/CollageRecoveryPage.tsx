import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetDeletedCollagesQuery } from '../../store/services/adminApi';
import { useRecoverCollageMutation } from '../../store/services/collageApi';
import Time from '../layout/Time';
import { PageShell, DataTable, Pagination, type Column } from '../ui';

type DeletedCollage = NonNullable<
  ReturnType<typeof useGetDeletedCollagesQuery>['data']
>['data'][number];

const CollageRecoveryPage = () => {
  const [page, setPage] = useState(1);
  const [recovering, setRecovering] = useState<number | null>(null);

  const { data, isLoading } = useGetDeletedCollagesQuery(page);
  const [recoverCollage] = useRecoverCollageMutation();

  const handleRecover = async (id: number) => {
    setRecovering(id);
    try {
      await recoverCollage(id).unwrap();
    } finally {
      setRecovering(null);
    }
  };

  const columns: Column<DeletedCollage>[] = [
    {
      header: 'Name',
      cell: (c) => (
        <span className="text-[var(--st-text-strong)]">{c.name}</span>
      )
    },
    {
      header: 'Created By',
      cell: (c) => (
        <Link to={`/private/user/${c.user.id}`} data-st="control">
          {c.user.username}
        </Link>
      )
    },
    {
      header: 'Created',
      cell: (c) => <Time date={c.createdAt} />,
      tdClassName: 'text-xs'
    },
    {
      header: 'Deleted',
      cell: (c) => (c.deletedAt ? <Time date={c.deletedAt} /> : '—'),
      tdClassName: 'text-xs'
    },
    {
      header: '',
      tdClassName: 'text-right',
      // Affirmative action in the success hue — `control` has no success text
      // variant, so paint a plain button from the status token (WS10 recipe).
      cell: (c) => (
        <button
          onClick={() => handleRecover(c.id)}
          disabled={recovering === c.id}
          className="text-xs text-[var(--st-success)] hover:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {recovering === c.id ? 'Recovering…' : 'Recover'}
        </button>
      )
    }
  ];

  return (
    <PageShell
      title="Collage Recovery"
      width="xl"
      backTo="/private/staff/tools"
    >
      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        empty="No deleted collages."
      />
      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default CollageRecoveryPage;
