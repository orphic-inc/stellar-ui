import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyReportsQuery } from '../../store/services/reportsApi';
import Spinner from '../layout/Spinner';
import { Badge } from '../ui';
import type { BadgeVariant } from '../ui';

const STATUS_TONE: Record<string, BadgeVariant> = {
  Open: 'warning',
  Claimed: 'info',
  Resolved: 'default'
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
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load your reports.
      </div>
    );

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 data-st="prose" data-st-strong className="text-xl">
          My Reports
        </h2>
        <Link to="/private/reports/new" data-st="control" data-st-primary>
          File a Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          You haven&apos;t filed any reports yet.
        </p>
      ) : (
        <table data-st="grid" className="w-full text-sm">
          <thead data-st="colhead">
            <tr>
              <th className="pb-2 pr-3">Type</th>
              <th className="pb-2 pr-3">Category</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Filed</th>
              <th className="pb-2">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} data-st="row">
                <td className="py-2 pr-3">
                  <span data-st="meta">{report.targetType}</span>
                </td>
                <td className="py-2 pr-3">
                  <Link to={`/private/reports/${report.id}`} data-st="control">
                    {report.category}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  <Badge variant={STATUS_TONE[report.status] ?? 'default'}>
                    {report.status}
                  </Badge>
                </td>
                <td className="py-2 pr-3 text-xs whitespace-nowrap">
                  <span data-st="meta">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-2 text-xs whitespace-nowrap">
                  <span data-st="meta">
                    {report.resolvedAt
                      ? new Date(report.resolvedAt).toLocaleDateString()
                      : '—'}
                  </span>
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
    </div>
  );
};

export default MyReportsPage;
