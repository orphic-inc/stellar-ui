import { useGetReleaseStatsQuery } from '../../store/services/adminApi';
import {
  PageShell,
  Panel,
  SectionHeading,
  DataTable,
  type Column
} from '../ui';

type ReleaseStats = NonNullable<
  ReturnType<typeof useGetReleaseStatsQuery>['data']
>;
type TypeRow = ReleaseStats['byType'][number];
type LinkStatusRow = ReleaseStats['byLinkStatus'][number];

const ReleaseStatsPage = () => {
  const { data, isLoading } = useGetReleaseStatsQuery();

  const stats = [
    { label: 'Releases', value: data?.releases },
    { label: 'Contributions', value: data?.contributions },
    { label: 'Artists', value: data?.artists }
  ];

  const typeColumns: Column<TypeRow>[] = [
    { header: 'Type', cell: (row) => row.type },
    {
      header: 'Count',
      cell: (row) => row._count.toLocaleString(),
      numeric: true
    }
  ];

  const linkStatusColumns: Column<LinkStatusRow>[] = [
    { header: 'Status', cell: (row) => row.linkStatus },
    {
      header: 'Count',
      cell: (row) => row._count.toLocaleString(),
      numeric: true
    }
  ];

  return (
    <PageShell title="Release Stats" width="lg" backTo="/staff/tools">
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <Panel key={label} className="p-5 text-center">
            <div data-st="prose" data-st-strong className="text-3xl font-bold">
              {value?.toLocaleString() ?? '—'}
            </div>
            <div data-st="meta" className="mt-1">
              {label}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="space-y-3">
          <SectionHeading>By Type</SectionHeading>
          <DataTable
            columns={typeColumns}
            rows={data?.byType}
            rowKey={(row) => row.type}
            isLoading={isLoading}
            empty="No data."
          />
        </section>

        <section className="space-y-3">
          <SectionHeading>By Link Status</SectionHeading>
          <DataTable
            columns={linkStatusColumns}
            rows={data?.byLinkStatus}
            rowKey={(row) => row.linkStatus}
            isLoading={isLoading}
            empty="No data."
          />
        </section>
      </div>
    </PageShell>
  );
};

export default ReleaseStatsPage;
