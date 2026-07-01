import { Link } from 'react-router-dom';
import { useGetSnatchListQuery } from '../../../../store/services/userApi';
import Spinner from '../../../layout/Spinner';

const SnatchList = () => {
  const { data: items, isLoading, error } = useGetSnatchListQuery();

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div data-st="prose" className="p-4 text-sm text-[var(--st-danger)]">
        Failed to load snatch list.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 data-st="prose" data-st-strong className="text-xl mb-6">
        Snatch List
      </h2>

      {!items || items.length === 0 ? (
        <div data-st="panel" className="rounded-lg px-6 py-10 text-center">
          <p data-st="prose" data-st-muted className="text-sm">
            You have not downloaded any releases yet.
          </p>
        </div>
      ) : (
        <div data-st="panel" className="rounded-lg">
          <table data-st="grid" className="w-full text-sm">
            <thead data-st="colhead">
              <tr>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">Artist</th>
                <th className="px-4 py-3 font-medium">Downloaded</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} data-st="row">
                  <td className="px-4 py-2.5">
                    {item.release.communityId ? (
                      <Link
                        to={`/private/communities/${item.release.communityId}/releases/${item.release.id}`}
                        data-st="control"
                      >
                        {item.release.title}
                      </Link>
                    ) : (
                      <span data-st="prose">{item.release.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span data-st="meta">{item.artist?.name ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span data-st="meta">
                      {new Date(item.downloadedAt).toLocaleDateString()}
                    </span>
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
