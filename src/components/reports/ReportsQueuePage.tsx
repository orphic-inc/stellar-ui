import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetReportsQuery,
  useGetReportCountsQuery,
  useGetReportStatsQuery
} from '../../store/services/reportsApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'Claimed', label: 'Claimed' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'all', label: 'All' }
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'User', label: 'User' },
  { value: 'Release', label: 'Release' },
  { value: 'Artist', label: 'Artist' },
  { value: 'Contribution', label: 'Contribution' },
  { value: 'ForumTopic', label: 'Forum Topic' },
  { value: 'ForumPost', label: 'Forum Post' },
  { value: 'Comment', label: 'Comment' },
  { value: 'Collage', label: 'Collage' },
  { value: 'Post', label: 'Post' }
];

const STATUS_TONE: Record<string, BadgeVariant> = {
  Open: 'warning',
  Claimed: 'info',
  Resolved: 'default'
};

const ReportsQueuePage = () => {
  const [tab, setTab] = useState<'queue' | 'stats'>('queue');

  // Queue filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Open');
  const [targetType, setTargetType] = useState('all');
  const [claimedByMe, setClaimedByMe] = useState(false);
  const [reporterInput, setReporterInput] = useState('');
  const [reporterUsername, setReporterUsername] = useState('');

  // Inline notes expansion
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const { data, isLoading, error } = useGetReportsQuery({
    page,
    status,
    targetType,
    claimedByMe,
    reporterUsername: reporterUsername || undefined
  });
  const { data: counts } = useGetReportCountsQuery();
  const { data: stats } = useGetReportStatsQuery();

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  const toggleNotes = (id: number) =>
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const applyReporterFilter = () => {
    setReporterUsername(reporterInput.trim());
    setPage(1);
  };

  const clearReporterFilter = () => {
    setReporterInput('');
    setReporterUsername('');
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Reports
        </h2>
        {counts && (
          <div data-st="meta" className="flex gap-3 text-sm">
            <span>
              Open:{' '}
              <span className="font-medium text-[var(--st-warning)]">
                {counts.open}
              </span>
            </span>
            <span>
              Claimed:{' '}
              <span className="font-medium text-[var(--st-info)]">
                {counts.claimed}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[var(--st-border)]">
        {(['queue', 'stats'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm capitalize ${
              tab === t
                ? 'border-b-2 border-[var(--st-accent)] text-[var(--st-text-strong)]'
                : 'text-[var(--st-text-muted)] hover:text-[var(--st-text)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'stats' ? (
        <div className="space-y-6">
          {!stats ? (
            <Spinner />
          ) : (
            <>
              <div data-st="panel" className="overflow-hidden">
                <div data-st="colhead">Resolutions</div>
                <table data-st="grid" className="w-full text-sm">
                  <tbody>
                    {[
                      { label: 'Last 24 hours', value: stats.last24h },
                      { label: 'Last 7 days', value: stats.lastWeek },
                      { label: 'Last 30 days', value: stats.lastMonth },
                      { label: 'All time', value: stats.allTime }
                    ].map(({ label, value }) => (
                      <tr key={label} data-st="row">
                        <td className="px-4 py-2">
                          <span data-st="meta">{label}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span data-st="prose" data-st-strong>
                            {value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {stats.byStaff.length > 0 && (
                <div data-st="panel" className="overflow-hidden">
                  <div data-st="colhead">By Staff Member (all time)</div>
                  <table data-st="grid" className="w-full text-sm">
                    <thead data-st="colhead">
                      <tr className="text-xs">
                        <th className="px-4 py-2">Username</th>
                        <th className="px-4 py-2">Resolved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byStaff.map((s) => (
                        <tr key={s.userId} data-st="row">
                          <td className="px-4 py-2">
                            <span data-st="meta">{s.username}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span data-st="prose" data-st-strong>
                              {s.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" data-st="meta">
                Status:
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                data-st="field"
                className="px-2 py-1"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" data-st="meta">
                Type:
              </label>
              <select
                id="type-filter"
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setPage(1);
                }}
                data-st="field"
                className="px-2 py-1"
              >
                {TARGET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <label
              data-st="meta"
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={claimedByMe}
                onChange={(e) => {
                  setClaimedByMe(e.target.checked);
                  setPage(1);
                }}
                data-st="field"
              />
              Claimed by me
            </label>

            <div className="flex items-center gap-1">
              <label htmlFor="reporter-filter" data-st="meta">
                Reporter:
              </label>
              <input
                id="reporter-filter"
                type="text"
                value={reporterInput}
                onChange={(e) => setReporterInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyReporterFilter()}
                placeholder="username"
                data-st="field"
                className="px-2 py-1 text-sm w-28"
              />
              <button
                type="button"
                onClick={applyReporterFilter}
                data-st="control"
                className="px-2 py-1 rounded border border-[var(--st-border)] text-xs"
              >
                Filter
              </button>
              {reporterUsername && (
                <button
                  type="button"
                  onClick={clearReporterFilter}
                  data-st="control"
                  className="px-2 py-1 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Queue */}
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <div
              data-st="prose"
              className="p-4 text-sm text-[var(--st-danger)]"
            >
              Failed to load reports queue.
            </div>
          ) : reports.length === 0 ? (
            <p data-st="prose" data-st-muted className="text-sm">
              No reports match this filter.
            </p>
          ) : (
            <table data-st="grid" className="w-full text-sm">
              <thead data-st="colhead">
                <tr>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Source</th>
                  <th className="pb-2 pr-3">Category</th>
                  <th className="pb-2 pr-3">From</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Claimed by</th>
                  <th className="pb-2 pr-3">Filed</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <Fragment key={report.id}>
                    <tr data-st="row">
                      <td className="py-2 pr-3">
                        <span data-st="meta">{report.targetType}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {report.sourceUrl ? (
                          <Link to={report.sourceUrl} data-st="control">
                            #{report.targetId}
                          </Link>
                        ) : (
                          <span data-st="meta">#{report.targetId}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Link
                          to={`/private/staff/reports/${report.id}`}
                          data-st="control"
                        >
                          {report.category}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <span data-st="meta">{report.reporter.username}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant={STATUS_TONE[report.status] ?? 'default'}
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <span data-st="meta">
                          {report.claimedBy?.username ?? '—'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap">
                        <span data-st="meta">
                          <Time date={report.createdAt} />
                        </span>
                      </td>
                      <td className="py-2">
                        {report.notes.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleNotes(report.id)}
                            data-st="control"
                            className="text-xs brackets"
                          >
                            {expandedNotes.has(report.id)
                              ? 'hide'
                              : `${report.notes.length} note${
                                  report.notes.length !== 1 ? 's' : ''
                                }`}
                          </button>
                        ) : (
                          <span data-st="meta" className="text-xs">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedNotes.has(report.id) && (
                      <tr data-st="row">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="space-y-2">
                            {report.notes.map((note) => (
                              <div key={note.id} className="text-xs">
                                <span data-st="meta">
                                  {note.author.username} ·{' '}
                                  <Time date={note.createdAt} />
                                  {' — '}
                                </span>
                                <span data-st="prose">{note.body}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                data-st="control"
                className="px-3 py-1 rounded border border-[var(--st-border)] disabled:opacity-40"
              >
                Previous
              </button>
              <span data-st="meta" className="px-3 py-1">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-st="control"
                className="px-3 py-1 rounded border border-[var(--st-border)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsQueuePage;
