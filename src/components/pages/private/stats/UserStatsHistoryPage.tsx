import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { useGetUserStatsHistoryQuery } from '../../../../store/services/siteApi';
import Spinner from '../../../layout/Spinner';
import type { UserStatSnapshot } from '../../../../store/services/siteApi';

type Period = 'Daily' | 'Monthly' | 'Yearly';

const PERIODS: { label: string; value: Period; description: string }[] = [
  { label: 'Daily', value: 'Daily', description: 'Last 24 hours' },
  { label: 'Monthly', value: 'Monthly', description: 'Last 30 days' },
  { label: 'Yearly', value: 'Yearly', description: 'Last year' }
];

const bytesToGB = (bytes: string): string =>
  (parseInt(bytes, 10) / 1_073_741_824).toFixed(2);

const formatDate = (iso: string, period: Period): string => {
  const d = new Date(iso);
  if (period === 'Daily')
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  if (period === 'Monthly')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const buildChartData = (snapshots: UserStatSnapshot[], period: Period) =>
  snapshots.map((s) => ({
    time: formatDate(s.capturedAt, period),
    ...(s.contributed !== null
      ? { 'Contributed (GB)': parseFloat(bytesToGB(s.contributed)) }
      : {}),
    ...(s.consumed !== null
      ? { 'Consumed (GB)': parseFloat(bytesToGB(s.consumed)) }
      : {}),
    ...(s.contributed !== null && s.consumed !== null
      ? {
          'Buffer (GB)': parseFloat(
            parseInt(s.contributed, 10) - parseInt(s.consumed, 10) > 0
              ? bytesToGB(
                  String(parseInt(s.contributed, 10) - parseInt(s.consumed, 10))
                )
              : '0'
          )
        }
      : {})
  }));

const UserStatsHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? '0', 10);
  const [period, setPeriod] = useState<Period>('Daily');

  const { data, isLoading, error } = useGetUserStatsHistoryQuery(
    { userId, period },
    { skip: !userId }
  );

  const is403 = error && 'status' in error && error.status === 403;

  return (
    <div className="space-y-6">
      <h2 data-st="prose" data-st-strong className="text-xl">
        Stats History
      </h2>

      {/* Period tabs — active/idle painted from tokens, not a Role. */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
              period === p.value
                ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
                : 'border-[var(--st-border)] text-[var(--st-text-muted)] hover:text-[var(--st-text)]'
            }`}
          >
            {p.label}
            <span className="ml-1 text-xs opacity-60">({p.description})</span>
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}

      {is403 && (
        <div data-st="panel" className="rounded-lg p-8 text-center">
          <p data-st="prose" data-st-muted className="text-sm">
            This user&apos;s stats are private.
          </p>
        </div>
      )}

      {error && !is403 && (
        <div
          data-st="panel"
          className="rounded-lg p-6 border-[var(--st-danger)] text-[var(--st-danger)]"
        >
          Failed to load stats history.
        </div>
      )}

      {data && data.length === 0 && !isLoading && (
        <div data-st="panel" className="rounded-lg p-8 text-center">
          <p data-st="prose" data-st-muted className="text-sm">
            No snapshots for this period yet.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <>
          <div data-st="panel" className="rounded-lg p-4">
            <h3 data-st="prose" data-st-strong className="text-sm mb-4">
              Contributed &amp; Consumed (GB)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={buildChartData(data, period)}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit=" GB" />
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
                  dataKey="Contributed (GB)"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Consumed (GB)"
                  stroke="#f59e0b"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Buffer (GB)"
                  stroke="#6366f1"
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {data[data.length - 1]?.contributed === null && (
            <p data-st="prose" data-st-muted className="text-xs">
              * Contributed data is not public for this user.
            </p>
          )}
          {data[data.length - 1]?.consumed === null && (
            <p data-st="prose" data-st-muted className="text-xs">
              * Consumed data is not public for this user.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default UserStatsHistoryPage;
