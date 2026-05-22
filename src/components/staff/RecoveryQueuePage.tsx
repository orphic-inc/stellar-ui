import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetRecoveryRequestsQuery,
  useRevokeRecoveryRequestMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

type StatusFilter = 'pending' | 'used' | 'expired';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'used', label: 'Used' },
  { value: 'expired', label: 'Expired' }
];

const STATUS_BADGE: Record<StatusFilter, string> = {
  pending: 'bg-yellow-800 text-yellow-200',
  used: 'bg-green-800 text-green-200',
  expired: 'bg-gray-700 text-gray-400'
};

const RecoveryQueuePage = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetRecoveryRequestsQuery({
    page,
    status
  });

  const [revoke, { isLoading: isRevoking }] =
    useRevokeRecoveryRequestMutation();

  const handleTabChange = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const handleRevoke = async (id: number, username: string) => {
    if (!confirm(`Revoke recovery token for ${username}?`)) return;
    try {
      await revoke(id).unwrap();
      dispatch(addAlert('Recovery token revoked.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to revoke token.', 'danger')
      );
    }
  };

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold text-white">Recovery Queue</h1>

      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              status === t.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.data.length ? (
        <p className="text-sm text-gray-500">No {status} recovery requests.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-gray-300">
            <thead className="bg-gray-800 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Expires</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-900">
                  <td className="px-4 py-2">
                    <Link
                      to={`/private/user/${row.userId}`}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      {row.username}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-400">{row.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[row.status]
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    <Time date={row.createdAt} />
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    <Time date={row.expiresAt} />
                  </td>
                  <td className="px-4 py-2">
                    {row.status === 'pending' && (
                      <button
                        onClick={() => handleRevoke(row.id, row.username)}
                        disabled={isRevoking || isFetching}
                        className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 items-center text-sm text-gray-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default RecoveryQueuePage;
