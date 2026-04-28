import { Link, useParams } from 'react-router-dom';
import {
  useGetCommunityByIdQuery,
  useGetReleasesByCommunityQuery
} from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';

const CommunityPage = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const id = parseInt(communityId ?? '0');

  const {
    data: community,
    isLoading: loadingCommunity,
    error
  } = useGetCommunityByIdQuery(id);
  const { data: releases, isLoading: loadingReleases } =
    useGetReleasesByCommunityQuery(id);

  if (loadingCommunity) return <Spinner />;
  if (error || !community)
    return <div className="p-4 text-red-400">Community not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
          Communities
        </Link>
        {' › '}
        <strong className="text-gray-200">{community.name}</strong>
      </nav>

      <div className="rounded border border-gray-700 bg-gray-900 mb-4">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t text-sm font-semibold text-gray-200">
          {community.name}
        </div>
        {community.description && (
          <div className="px-4 py-3 text-sm text-gray-400">
            {community.description}
          </div>
        )}
      </div>

      <div className="rounded border border-gray-700 bg-gray-900">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t text-sm font-semibold text-gray-200">
          Releases
        </div>
        {loadingReleases ? (
          <div className="p-4">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Artist</th>
                <th className="px-4 py-2 font-medium">Year</th>
                <th className="px-4 py-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {releases?.data && releases.data.length > 0 ? (
                releases.data.map((release) => (
                  <tr
                    key={release.id}
                    className="border-b border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-2">
                      <Link
                        to={`/private/communities/${communityId}/releases/${release.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {release.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {release.artist?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {release.year ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {release.type ?? '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-gray-500 text-center"
                  >
                    No releases yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
