import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRatioWatchQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const RatioWatchPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetRatioWatchQuery(page);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Ratio Watch</h2>
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
                <th className="text-left px-4 py-2 font-semibold">User</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
                <th className="text-left px-4 py-2 font-semibold">
                  Watch Started
                </th>
                <th className="text-left px-4 py-2 font-semibold">
                  Watch Expires
                </th>
                <th className="text-left px-4 py-2 font-semibold">
                  Leech Disabled
                </th>
                <th className="text-left px-4 py-2 font-semibold">
                  Last Evaluated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.data?.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No users on ratio watch.
                  </td>
                </tr>
              ) : (
                data.data.map((r) => (
                  <tr
                    key={r.userId}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${r.user.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {r.user.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs font-semibold ${
                          r.status === 'LEECH_DISABLED'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {r.status === 'LEECH_DISABLED'
                          ? 'Leech Disabled'
                          : 'Watch'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {r.watchStartedAt ? (
                        <Time date={r.watchStartedAt} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {r.watchExpiresAt ? (
                        <Time date={r.watchExpiresAt} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {r.leechDisabledAt ? (
                        <Time date={r.leechDisabledAt} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={r.lastEvaluatedAt} />
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

export default RatioWatchPage;
