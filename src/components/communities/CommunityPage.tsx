import { Link, useParams } from 'react-router-dom';
import {
  useGetCommunityByIdQuery,
  useGetReleasesByCommunityQuery
} from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';

const MusicNote = () => (
  <svg
    className="w-5 h-5 text-gray-600"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
  </svg>
);

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

  const releaseList = releases?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
          Communities
        </Link>
        {' › '}
        <strong className="text-gray-200">{community.name}</strong>
      </nav>

      {community.description && (
        <p className="text-sm text-gray-400 mb-4">{community.description}</p>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-200">Releases</span>
          <span className="text-xs text-gray-500">
            {releaseList.length} total
          </span>
        </div>

        {loadingReleases ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : releaseList.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            No releases yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-800">
            {releaseList.map((release) => {
              const tags =
                (release as { tags?: { name: string }[] }).tags ?? [];
              const count = (release as { _count?: { contributions?: number } })
                ._count?.contributions;
              return (
                <div
                  key={release.id}
                  className="flex gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors"
                >
                  <Link
                    to={`/private/communities/${communityId}/releases/${release.id}`}
                    className="shrink-0"
                    tabIndex={-1}
                  >
                    {release.image ? (
                      <img
                        src={release.image}
                        alt=""
                        className="w-14 h-14 object-cover rounded border border-gray-700"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded flex items-center justify-center">
                        <MusicNote />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {release.artist && (
                        <span className="text-sm font-medium text-gray-200">
                          {release.artist.name}
                        </span>
                      )}
                      {release.artist && (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                      <Link
                        to={`/private/communities/${communityId}/releases/${release.id}`}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {release.title}
                      </Link>
                      {release.year && (
                        <span className="text-gray-500 text-xs">
                          [{release.year}]
                        </span>
                      )}
                      {release.type && (
                        <span className="text-gray-600 text-xs">
                          [{release.type}]
                        </span>
                      )}
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {tags.map((t) => (
                          <span
                            key={t.name}
                            className="text-[10px] text-gray-500 italic"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {count != null && (
                    <div className="shrink-0 self-center text-xs text-gray-600 whitespace-nowrap">
                      {count} {count === 1 ? 'format' : 'formats'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
