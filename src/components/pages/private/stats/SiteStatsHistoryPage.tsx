import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useGetSiteStatsHistoryQuery } from '../../../../store/services/siteApi';
import Spinner from '../../../layout/Spinner';

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
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-red-300">
          Failed to load site stats history.
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Site Stats History
        </h2>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center text-gray-500 text-sm">
          No historical snapshots yet. Snapshots are captured hourly.
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
      <h2 className="text-xl font-semibold text-white">Site Stats History</h2>
      <p className="text-gray-400 text-sm">
        Hourly snapshots of site-wide metrics. Showing {data.length} data point
        {data.length !== 1 ? 's' : ''}.
      </p>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">
          Users &amp; Activity
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Total Users"
              stroke="#6366f1"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Active Today"
              stroke="#10b981"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Active This Week"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Content</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Releases"
              stroke="#8b5cf6"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Communities"
              stroke="#ec4899"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SiteStatsHistoryPage;
