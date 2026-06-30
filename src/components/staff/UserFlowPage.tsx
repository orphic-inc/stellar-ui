import { useGetUserFlowQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import {
  PageShell,
  Panel,
  DataTable,
  SectionHeading,
  type Column
} from '../ui';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
  USED: 'Used',
  CANCELLED: 'Cancelled'
};

type Snapshot = {
  bucketAt: string;
  totalUsers: number;
  activeThisMonth: number;
};

const snapshotColumns: Column<Snapshot>[] = [
  {
    header: 'Date',
    cell: (s) => (
      <span className="text-xs">
        <Time date={s.bucketAt} />
      </span>
    )
  },
  {
    header: 'Total Users',
    numeric: true,
    cell: (s) => s.totalUsers.toLocaleString()
  },
  {
    header: 'Active This Month',
    numeric: true,
    cell: (s) => s.activeThisMonth.toLocaleString()
  }
];

const UserFlowPage = () => {
  const { data, isLoading } = useGetUserFlowQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <PageShell title="User Flow" width="xl">
      <section className="space-y-3">
        <SectionHeading>Invite Funnel</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data?.inviteFunnel.map((item) => (
            <Panel key={item.status} className="p-4 text-center">
              <div
                data-st="prose"
                data-st-strong
                className="text-2xl font-bold"
              >
                {item._count}
              </div>
              <div data-st="meta" className="text-xs mt-1">
                {STATUS_LABELS[item.status] ?? item.status}
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading>Site Growth (Last 12 Snapshots)</SectionHeading>
        <DataTable
          columns={snapshotColumns}
          rows={data?.snapshots as Snapshot[] | undefined}
          rowKey={(s) => s.bucketAt}
          empty="No snapshots available."
        />
      </section>
    </PageShell>
  );
};

export default UserFlowPage;
