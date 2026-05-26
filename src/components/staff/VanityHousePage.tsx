import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetVanityHouseArtistsQuery,
  useSetVanityHouseMutation
} from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';

const VanityHousePage = () => {
  const [page, setPage] = useState(1);
  const [artistIdInput, setArtistIdInput] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useGetVanityHouseArtistsQuery(page);
  const [setVanityHouse, { isLoading: isSetting }] =
    useSetVanityHouseMutation();

  const handleRemove = async (id: number) => {
    await setVanityHouse({ id, vanityHouse: false });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = parseInt(artistIdInput, 10);
    if (isNaN(id) || id <= 0) {
      setError('Enter a valid artist ID.');
      return;
    }
    try {
      await setVanityHouse({ id, vanityHouse: true }).unwrap();
      setArtistIdInput('');
    } catch {
      setError('Failed to add artist. Check the ID and try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Vanity House Artists
        </h2>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 items-start">
        <div className="flex flex-col gap-1">
          <input
            type="number"
            value={artistIdInput}
            onChange={(e) => setArtistIdInput(e.target.value)}
            placeholder="Artist ID"
            className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
          />
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
        <button
          type="submit"
          disabled={isSetting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
        >
          Add Artist
        </button>
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
                <th className="text-left px-4 py-2 font-semibold">ID</th>
                <th className="text-left px-4 py-2 font-semibold">Artist</th>
                <th className="text-left px-4 py-2 font-semibold">Releases</th>
                <th className="px-4 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.data?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No vanity house artists.
                  </td>
                </tr>
              ) : (
                data.data.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                      {a.id}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/artist/${a.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {a._count.releases}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemove(a.id)}
                        disabled={isSetting}
                        className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                      >
                        Remove
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

export default VanityHousePage;
