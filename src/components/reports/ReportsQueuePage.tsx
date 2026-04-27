import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetReportsQuery,
  useGetReportCountsQuery
} from '../../store/services/reportsApi';
import Spinner from '../layout/Spinner';

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
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Open');
  const [targetType, setTargetType] = useState('all');
  const [claimedByMe, setClaimedByMe] = useState(false);

  const { data, isLoading, error } = useGetReportsQuery({
    page,
    status,
    targetType,
    claimedByMe
  });
  const { data: counts } = useGetReportCountsQuery();

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div className="p-4 text-red-400">Failed to load reports queue.</div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Reports Queue</h2>
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
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-500 text-sm">No reports match this filter.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3">Type</th>
              <th className="pb-2 pr-3">Category</th>
              <th className="pb-2 pr-3">From</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Claimed by</th>
              <th className="pb-2">Filed</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-gray-800">
                <td className="py-2 pr-3 text-gray-400">{report.targetType}</td>
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
                      STATUS_BADGE[report.status] ?? 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="py-2 pr-3 text-gray-400">
                  {report.claimedBy?.username ?? '—'}
                </td>
                <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
              </tr>
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
    </div>
  );
};

export default ReportsQueuePage;
