import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useListRequestsQuery,
  useDeleteRequestMutation
} from '../../store/services/requestApi';
import type { RequestStatus } from '../../types';
import Spinner from '../layout/Spinner';

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Open',
  filled: 'Filled'
};

const RequestsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>(
    undefined
  );

  const { data, isLoading, error } = useListRequestsQuery({
    page,
    status: statusFilter
  });
  const [deleteRequest] = useDeleteRequestMutation();

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'Delete this request? Bounties on open requests will be refunded.'
      )
    )
      return;
    try {
      await deleteRequest(id).unwrap();
    } catch {
      alert('Failed to delete request.');
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load requests.</div>;

  const requests = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Requests</h2>
        <Link
          to="/private/requests/new"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          New Request
        </Link>
      </div>

      <div className="flex gap-2 mb-4 text-sm">
        {([undefined, 'open', 'filled'] as (RequestStatus | undefined)[]).map(
          (s) => (
            <button
              key={s ?? 'all'}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1 rounded border ${
                statusFilter === s
                  ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {s == null ? 'All' : STATUS_LABELS[s]}
            </button>
          )
        )}
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-500 text-sm">No requests found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2">Title</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Community</th>
              <th className="pb-2 text-right">Bounty</th>
              <th className="pb-2 text-center">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={r.id}
                className="border-b border-gray-800/60 hover:bg-gray-900/30"
              >
                <td className="py-2 pr-4">
                  <Link
                    to={`/private/requests/${r.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-400">{r.type}</td>
                <td className="py-2 pr-4 text-gray-400">
                  {r.community?.name ?? '—'}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-yellow-400">
                  {formatBytes(r.totalBounty)}
                </td>
                <td className="py-2 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'filled'
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {user?.id === r.userId && r.status === 'open' && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex gap-2 mt-4 text-sm items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-gray-700 rounded disabled:opacity-40 hover:border-gray-500"
          >
            Prev
          </button>
          <span className="text-gray-400">
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-gray-700 rounded disabled:opacity-40 hover:border-gray-500"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr);
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${bytes} B`;
}

export default RequestsPage;
