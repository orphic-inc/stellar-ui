import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetReportsQuery,
  useGetReportCountsQuery,
  useGetReportStatsQuery
} from '../../store/services/reportsApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

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

const STATUS_BADGE: Record<string, string> = {
  Open: 'bg-yellow-800 text-yellow-200',
  Claimed: 'bg-blue-800 text-blue-200',
  Resolved: 'bg-gray-700 text-gray-400'
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
        <h2 className="text-xl font-semibold">Reports</h2>
        {counts && (
          <div className="flex gap-3 text-sm text-gray-400">
            <span>
              Open:{' '}
              <span className="text-yellow-400 font-medium">{counts.open}</span>
            </span>
            <span>
              Claimed:{' '}
              <span className="text-blue-400 font-medium">
                {counts.claimed}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-700">
        {(['queue', 'stats'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm capitalize ${
              tab === t
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400 hover:text-gray-200'
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
              <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200">
                  Resolutions
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: 'Last 24 hours', value: stats.last24h },
                      { label: 'Last 7 days', value: stats.lastWeek },
                      { label: 'Last 30 days', value: stats.lastMonth },
                      { label: 'All time', value: stats.allTime }
                    ].map(({ label, value }) => (
                      <tr key={label} className="border-b border-gray-800">
                        <td className="px-4 py-2 text-gray-400">{label}</td>
                        <td className="px-4 py-2 text-gray-200 font-medium">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {stats.byStaff.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200">
                    By Staff Member (all time)
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left text-gray-400 text-xs">
                        <th className="px-4 py-2">Username</th>
                        <th className="px-4 py-2">Resolved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byStaff.map((s) => (
                        <tr key={s.userId} className="border-b border-gray-800">
                          <td className="px-4 py-2 text-gray-300">
                            {s.username}
                          </td>
                          <td className="px-4 py-2 text-gray-200 font-medium">
                            {s.count}
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
              <label htmlFor="status-filter" className="text-gray-400">
                Status:
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" className="text-gray-400">
                Type:
              </label>
              <select
                id="type-filter"
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              >
                {TARGET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={claimedByMe}
                onChange={(e) => {
                  setClaimedByMe(e.target.checked);
                  setPage(1);
                }}
                className="accent-blue-500"
              />
              Claimed by me
            </label>

            <div className="flex items-center gap-1">
              <label htmlFor="reporter-filter" className="text-gray-400">
                Reporter:
              </label>
              <input
                id="reporter-filter"
                type="text"
                value={reporterInput}
                onChange={(e) => setReporterInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyReporterFilter()}
                placeholder="username"
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm w-28 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={applyReporterFilter}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                Filter
              </button>
              {reporterUsername && (
                <button
                  type="button"
                  onClick={clearReporterFilter}
                  className="px-2 py-1 text-gray-500 hover:text-gray-300 text-xs"
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
            <div className="p-4 text-red-400">
              Failed to load reports queue.
            </div>
          ) : reports.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No reports match this filter.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
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
                  <>
                    <tr key={report.id} className="border-b border-gray-800">
                      <td className="py-2 pr-3 text-gray-400">
                        {report.targetType}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 text-xs">
                        {report.sourceUrl ? (
                          <Link
                            to={report.sourceUrl}
                            className="text-blue-400 hover:underline"
                          >
                            #{report.targetId}
                          </Link>
                        ) : (
                          <span>#{report.targetId}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Link
                          to={`/private/staff/reports/${report.id}`}
                          className="hover:underline text-blue-400"
                        >
                          {report.category}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-gray-300">
                        {report.reporter.username}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            STATUS_BADGE[report.status] ??
                            'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-400">
                        {report.claimedBy?.username ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 text-xs whitespace-nowrap">
                        <Time date={report.createdAt} />
                      </td>
                      <td className="py-2">
                        {report.notes.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleNotes(report.id)}
                            className="text-xs text-gray-500 hover:text-gray-300 brackets"
                          >
                            {expandedNotes.has(report.id)
                              ? 'hide'
                              : `${report.notes.length} note${
                                  report.notes.length !== 1 ? 's' : ''
                                }`}
                          </button>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                    {expandedNotes.has(report.id) && (
                      <tr
                        key={`${report.id}-notes`}
                        className="border-b border-gray-800 bg-gray-900/50"
                      >
                        <td colSpan={8} className="px-4 py-3">
                          <div className="space-y-2">
                            {report.notes.map((note) => (
                              <div key={note.id} className="text-xs">
                                <span className="text-gray-500">
                                  {note.author.username} ·{' '}
                                  <Time date={note.createdAt} />
                                  {' — '}
                                </span>
                                <span className="text-gray-300">
                                  {note.body}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
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
