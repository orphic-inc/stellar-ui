import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSessionsQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const LoginWatchPage = () => {
  const [page, setPage] = useState(1);
  const [userIdInput, setUserIdInput] = useState('');
  const [userId, setUserId] = useState<number | undefined>();

  const { data, isLoading } = useGetSessionsQuery(
    userId ? { page, userId } : { page }
  );

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userIdInput, 10);
    setUserId(isNaN(parsed) ? undefined : parsed);
    setPage(1);
  };

  const clearFilter = () => {
    setUserIdInput('');
    setUserId(undefined);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Login Watch</h2>
      </div>

      <form onSubmit={handleFilter} className="flex gap-2">
        <input
          type="number"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          placeholder="Filter by user ID"
          className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm"
        >
          Filter
        </button>
        {userId && (
          <button
            type="button"
            onClick={clearFilter}
            className="text-gray-400 hover:text-white text-sm px-2"
          >
            Clear
          </button>
        )}
      </form>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">User</th>
                <th className="text-left px-4 py-2 font-semibold">
                  IP Address
                </th>
                <th className="text-left px-4 py-2 font-semibold">
                  User Agent
                </th>
                <th className="text-left px-4 py-2 font-semibold">
                  First Seen
                </th>
                <th className="text-left px-4 py-2 font-semibold">
                  Last Active
                </th>
                <th className="text-left px-4 py-2 font-semibold">Revoked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.data?.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No sessions found.
                  </td>
                </tr>
              ) : (
                data.data.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${s.user.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {s.user.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-300 font-mono text-xs">
                      {s.ipAddress}
                    </td>
                    <td
                      className="px-4 py-2 text-gray-400 text-xs max-w-xs truncate"
                      title={s.userAgent ?? undefined}
                    >
                      {s.userAgent ? s.userAgent.slice(0, 60) : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={s.createdAt} />
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={s.lastActiveAt} />
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {s.revokedAt ? <Time date={s.revokedAt} /> : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
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

export default LoginWatchPage;
