import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInviteTreeQuery } from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const InviteTreePage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetInviteTreeQuery(page);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Invite Tree</h2>
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
                <th className="text-left px-4 py-2 font-semibold">
                  Invited By
                </th>
                <th className="text-right px-4 py-2 font-semibold">Tree</th>
                <th className="text-right px-4 py-2 font-semibold">Level</th>
                <th className="text-right px-4 py-2 font-semibold">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.data?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No invite tree data.
                  </td>
                </tr>
              ) : (
                data.data.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${row.user.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {row.user.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {row.inviter ? (
                        <Link
                          to={`/private/user/${row.inviter.id}`}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          {row.inviter.username}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 text-xs font-mono">
                      {row.treeId}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 text-xs">
                      {row.treeLevel}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 text-xs">
                      {row.treePosition}
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

export default InviteTreePage;
