import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetRegistrationLogQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const RegistrationLogPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetRegistrationLogQuery(page);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">Registration Log</h2>

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>Username</span>
          <span>Email</span>
          <span>Rank</span>
          <span>Registered</span>
          <span>Last IP</span>
        </div>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !data?.data.length ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No users found.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/40">
            {data.data.map((user) => (
              <div
                key={user.id}
                className="px-4 py-2 grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center text-sm"
              >
                <div className="flex items-center gap-2">
                  <Link
                    to={`/private/users/${user.id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {user.username}
                  </Link>
                  {user.disabled && (
                    <span className="px-1 py-0.5 bg-red-900/50 text-red-400 rounded text-xs">
                      Disabled
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs truncate">
                  {user.email ?? '—'}
                </span>
                <span className="text-gray-400 text-xs">
                  {user.userRank?.name ?? '—'}
                </span>
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {new Date(user.dateRegistered).toLocaleDateString()}
                </span>
                <span className="font-mono text-gray-600 text-xs">
                  {user.lastIp ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded transition-colors"
          >
            Prev
          </button>
          <span className="text-gray-500">
            {page} / {data.meta.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(data.meta.totalPages, p + 1))
            }
            disabled={page === data.meta.totalPages}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistrationLogPage;
