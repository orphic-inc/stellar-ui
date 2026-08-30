import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetUserStatsHistoryQuery } from '../../../../store/services/siteApi';
import Spinner from '../../../layout/Spinner';
import type { UserStatSnapshot } from '../../../../store/services/siteApi';
import StatsChartPanel from './StatsChartPanel';

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
          <StatsChartPanel
            title="Contributed &amp; Consumed (GB)"
            data={buildChartData(data, period)}
            yAxisUnit=" GB"
            series={[
              { dataKey: 'Contributed (GB)', stroke: '#10b981' },
              { dataKey: 'Consumed (GB)', stroke: '#f59e0b' },
              { dataKey: 'Buffer (GB)', stroke: '#6366f1', dashed: true }
            ]}
          />

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
