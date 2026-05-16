import { Link } from 'react-router-dom';
import { useGetSnatchListQuery } from '../../../../store/services/userApi';
import Spinner from '../../../layout/Spinner';

const SnatchList = () => {
  const { data: items, isLoading, error } = useGetSnatchListQuery();

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load snatch list.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-white mb-6">Snatch List</h2>

      {!items || items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-10 text-center">
          <p className="text-gray-500 text-sm">
            You have not downloaded any releases yet.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400 text-xs">
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">Artist</th>
                <th className="px-4 py-3 font-medium">Downloaded</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    {item.release.communityId ? (
                      <Link
                        to={`/private/communities/${item.release.communityId}/releases/${item.release.id}`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {item.release.title}
                      </Link>
                    ) : (
                      <span className="text-gray-300">
                        {item.release.title}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {item.artist?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {new Date(item.downloadedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SnatchList;
