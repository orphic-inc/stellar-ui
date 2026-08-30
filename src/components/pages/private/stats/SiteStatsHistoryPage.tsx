import { useGetSiteStatsHistoryQuery } from '../../../../store/services/siteApi';
import Spinner from '../../../layout/Spinner';
import StatsChartPanel from './StatsChartPanel';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const SiteStatsHistoryPage = () => {
  const { data, isLoading, error } = useGetSiteStatsHistoryQuery();

  if (isLoading) return <Spinner />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div
          data-st="panel"
          className="rounded-lg p-6 border-[var(--st-danger)] text-[var(--st-danger)]"
        >
          Failed to load site stats history.
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 data-st="prose" data-st-strong className="text-xl mb-4">
          Site Stats History
        </h2>
        <div data-st="panel" className="rounded-lg p-8 text-center">
          <p data-st="prose" data-st-muted className="text-sm">
            No historical snapshots yet. Snapshots are captured hourly.
          </p>
        </div>
      </div>
    );
  }

  const chartData = data.map((s) => ({
    time: formatDate(s.capturedAt),
    'Total Users': s.totalUsers,
    'Active Today': s.activeToday,
    'Active This Week': s.activeThisWeek,
    Releases: s.releases,
    Communities: s.communities
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h2 data-st="prose" data-st-strong className="text-xl">
        Site Stats History
      </h2>
      <p data-st="prose" data-st-muted className="text-sm">
        Hourly snapshots of site-wide metrics. Showing {data.length} data point
        {data.length !== 1 ? 's' : ''}.
      </p>

      <StatsChartPanel
        title="Users &amp; Activity"
        data={chartData}
        series={[
          { dataKey: 'Total Users', stroke: '#6366f1' },
          { dataKey: 'Active Today', stroke: '#10b981' },
          { dataKey: 'Active This Week', stroke: '#f59e0b' }
        ]}
      />

      <StatsChartPanel
        title="Content"
        data={chartData}
        height={250}
        series={[
          { dataKey: 'Releases', stroke: '#8b5cf6' },
          { dataKey: 'Communities', stroke: '#ec4899' }
        ]}
      />
    </div>
  );
};

export default SiteStatsHistoryPage;
