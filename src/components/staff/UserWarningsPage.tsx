import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllWarningsQuery } from '../../store/services/userApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const UserWarningsPage = () => {
  const [page, setPage] = useState(1);
  const [userIdInput, setUserIdInput] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<number | undefined>();

  const { data, isLoading } = useGetAllWarningsQuery({
    page,
    userId: userIdFilter
  });

  const warnings = data?.data ?? [];
  const meta = data?.meta;

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userIdInput, 10);
    setUserIdFilter(isNaN(parsed) ? undefined : parsed);
    setPage(1);
  };

  const handleClearFilter = () => {
    setUserIdInput('');
    setUserIdFilter(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">User Warnings</h2>
      </div>

      <form onSubmit={handleFilter} className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          placeholder="Filter by user ID"
          className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          Filter
        </button>
        {userIdFilter && (
          <button
            type="button"
            onClick={handleClearFilter}
            className="text-gray-400 hover:text-white text-sm transition-colors"
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
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-2 text-gray-400 font-medium">
                  User
                </th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">
                  Reason
                </th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">
                  Warned by
                </th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">
                  Issued
                </th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {warnings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-gray-500 text-center"
                  >
                    No warnings found.
                  </td>
                </tr>
              ) : (
                warnings.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${w.userId}`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {w.user?.username ?? `#${w.userId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-200 max-w-xs truncate">
                      {w.reason}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {w.warnedBy ? (
                        <Link
                          to={`/private/user/${w.warnedBy.id}`}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {w.warnedBy.username}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      <Time date={w.createdAt} />
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {w.expiresAt ? <Time date={w.expiresAt} /> : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white transition-colors"
          >
            Prev
          </button>
          <span className="text-gray-400">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserWarningsPage;
