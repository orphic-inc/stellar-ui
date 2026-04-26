import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyReportsQuery } from '../../store/services/reportsApi';
import Spinner from '../layout/Spinner';

const STATUS_BADGE: Record<string, string> = {
  Open: 'bg-yellow-800 text-yellow-200',
  Claimed: 'bg-blue-800 text-blue-200',
  Resolved: 'bg-gray-700 text-gray-400'
};

const MyReportsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetMyReportsQuery({ page });

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load your reports.</div>;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Reports</h2>
        <Link
          to="/private/reports/new"
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded"
        >
          File a Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You haven&apos;t filed any reports yet.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-3">Type</th>
              <th className="pb-2 pr-3">Category</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Filed</th>
              <th className="pb-2">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-gray-800">
                <td className="py-2 pr-3 text-gray-400">{report.targetType}</td>
                <td className="py-2 pr-3">
                  <Link
                    to={`/private/reports/${report.id}`}
                    className="hover:underline text-blue-400"
                  >
                    {report.category}
                  </Link>
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
                <td className="py-2 pr-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                  {report.resolvedAt
                    ? new Date(report.resolvedAt).toLocaleDateString()
                    : '—'}
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

export default MyReportsPage;
