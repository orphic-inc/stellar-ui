import { useGetClientStatsQuery } from '../../store/services/adminApi';
import { PageShell, DataTable, type Column } from '../ui';

type ClientRow = NonNullable<
  ReturnType<typeof useGetClientStatsQuery>['data']
>[number];

const ClientStatsPage = () => {
  const { data, isLoading } = useGetClientStatsQuery();

  const columns: Column<ClientRow>[] = [
    {
      header: 'User Agent',
      cell: (row) =>
        row.userAgent ?? (
          <span className="italic text-[var(--st-text-faint)]">unknown</span>
        ),
      tdClassName: 'font-mono text-xs'
    },
    {
      header: 'Sessions',
      cell: (row) => row.count.toLocaleString(),
      numeric: true
    }
  ];

  return (
    <PageShell
      title="OS & Browser Usage"
      width="xl"
      backTo="/private/staff/tools"
    >
      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.userAgent ?? 'unknown'}
        isLoading={isLoading}
        empty="No data."
      />
    </PageShell>
  );
};

export default ClientStatsPage;
