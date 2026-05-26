import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInvitesQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'USED', 'CANCELLED'];

function inviteStatusColor(status: string): string {
  if (status === 'USED' || status === 'ACCEPTED') return 'text-green-400';
  if (status === 'EXPIRED' || status === 'CANCELLED') return 'text-red-400';
  return 'text-yellow-400';
}

const InvitePoolPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useGetInvitesQuery(
    status ? { page, status } : { page }
  );

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Invite Pool</h2>
      </div>

      <div className="flex gap-2">
        <select
          value={status}
          onChange={handleStatusChange}
          className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        {status && (
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
            className="text-gray-400 hover:text-white text-sm px-2"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Inviter</th>
                <th className="text-left px-4 py-2 font-semibold">Email</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
                <th className="text-left px-4 py-2 font-semibold">Expires</th>
                <th className="text-left px-4 py-2 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.data?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No invites found.
                  </td>
                </tr>
              ) : (
                data.data.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${inv.inviter.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {inv.inviter.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-300 font-mono text-xs">
                      {inv.email}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className={inviteStatusColor(inv.status)}>
                        {inv.status.charAt(0) +
                          inv.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={inv.expires} />
                    </td>
                    <td
                      className="px-4 py-2 text-gray-400 text-xs max-w-xs truncate"
                      title={inv.reason}
                    >
                      {inv.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="hover:text-white disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page} / {data.meta.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(data.meta.totalPages, p + 1))
            }
            disabled={page === data.meta.totalPages}
            className="hover:text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default InvitePoolPage;
