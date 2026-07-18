import { Link } from 'react-router-dom';
import cn from 'classnames';
import { useGetEconomyStatsQuery } from '../../store/services/adminApi';
import Time from '../layout/Time';
import { PageShell, SectionHeading, DataTable, type Column } from '../ui';

type EconomyStats = NonNullable<
  ReturnType<typeof useGetEconomyStatsQuery>['data']
>;
type GroupedRow = EconomyStats['grouped'][number];
type RecentRow = EconomyStats['recent'][number];

const EconomicStatsPage = () => {
  const { data, isLoading } = useGetEconomyStatsQuery();

  const groupedColumns: Column<GroupedRow>[] = [
    {
      header: 'Reason',
      cell: (g) => g.reason,
      tdClassName: 'font-mono text-xs'
    },
    { header: 'Transactions', cell: (g) => g._count, numeric: true },
    {
      header: 'Total Amount',
      cell: (g) =>
        g._sum.amount != null ? Number(g._sum.amount).toLocaleString() : '—',
      numeric: true,
      tdClassName: 'font-mono'
    }
  ];

  const recentColumns: Column<RecentRow>[] = [
    {
      header: 'User',
      cell: (t) => (
        <Link to={`/user/${t.user.id}`} data-st="control">
          {t.user.username}
        </Link>
      )
    },
    {
      header: 'Reason',
      cell: (t) => t.reason,
      tdClassName: 'font-mono text-xs'
    },
    {
      header: 'Amount',
      numeric: true,
      cell: (t) => {
        const n = Number(t.amount);
        return (
          <span
            className={cn(
              'font-mono',
              n >= 0 ? 'text-[var(--st-success)]' : 'text-[var(--st-danger)]'
            )}
          >
            {n >= 0 ? '+' : ''}
            {n.toLocaleString()}
          </span>
        );
      }
    },
    {
      header: 'Date',
      cell: (t) => <Time date={t.createdAt} />,
      tdClassName: 'text-xs'
    }
  ];

  return (
    <PageShell title="Economic Stats" width="xl" backTo="/staff/tools">
      <section className="space-y-3">
        <SectionHeading>Totals by Reason</SectionHeading>
        <DataTable
          columns={groupedColumns}
          rows={data?.grouped}
          rowKey={(g) => g.reason}
          isLoading={isLoading}
          empty="No data."
        />
      </section>

      <section className="space-y-3">
        <SectionHeading>Recent Transactions</SectionHeading>
        <DataTable
          columns={recentColumns}
          rows={data?.recent}
          rowKey={(t) => t.id}
          isLoading={isLoading}
          empty="No recent transactions."
        />
      </section>
    </PageShell>
  );
};

export default EconomicStatsPage;
