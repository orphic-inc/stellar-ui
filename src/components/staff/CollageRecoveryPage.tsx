import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetDeletedCollagesQuery } from '../../store/services/adminApi';
import { useRecoverCollageMutation } from '../../store/services/collageApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const CollageRecoveryPage = () => {
  const [page, setPage] = useState(1);
  const [recovering, setRecovering] = useState<number | null>(null);

  const { data, isLoading } = useGetDeletedCollagesQuery(page);
  const [recoverCollage] = useRecoverCollageMutation();

  const handleRecover = async (id: number) => {
    setRecovering(id);
    try {
      await recoverCollage(id).unwrap();
    } finally {
      setRecovering(null);
    }
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
        <h2 className="mt-1 text-2xl font-bold text-white">Collage Recovery</h2>
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
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-4 py-2 font-semibold">
                  Created By
                </th>
                <th className="text-left px-4 py-2 font-semibold">Created</th>
                <th className="text-left px-4 py-2 font-semibold">Deleted</th>
                <th className="px-4 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.data?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No deleted collages.
                  </td>
                </tr>
              ) : (
                data.data.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-white">{c.name}</td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/user/${c.user.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {c.user.username}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={c.createdAt} />
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {c.deletedAt ? <Time date={c.deletedAt} /> : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRecover(c.id)}
                        disabled={recovering === c.id}
                        className="text-green-400 hover:text-green-300 text-xs disabled:opacity-50"
                      >
                        {recovering === c.id ? 'Recovering…' : 'Recover'}
                      </button>
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

export default CollageRecoveryPage;
