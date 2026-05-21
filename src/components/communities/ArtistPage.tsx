import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetArtistByIdQuery } from '../../store/services/artistApi';
import { useToggleArtistBookmarkMutation } from '../../store/services/bookmarkApi';
import {
  useSubscribeArtistMutation,
  useUnsubscribeArtistMutation
} from '../../store/services/subscriptionApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { useAppDispatch } from '../../store/hooks';
import Spinner from '../layout/Spinner';
import CommentsSection from '../layout/CommentsSection';

const ArtistPage = () => {
  const { id } = useParams<{ id: string }>();
  const artistId = parseInt(id ?? '0');
  const dispatch = useAppDispatch();
  const user = useSelector(selectCurrentUser);

  const { data: artist, isLoading, error } = useGetArtistByIdQuery(artistId);
  const [toggleBookmark, { isLoading: bookmarking }] =
    useToggleArtistBookmarkMutation();
  const [subscribeArtist, { isLoading: subscribing }] =
    useSubscribeArtistMutation();
  const [unsubscribeArtist, { isLoading: unsubscribing }] =
    useUnsubscribeArtistMutation();

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(artistId).unwrap();
      dispatch(
        addAlert(
          result.bookmarked ? 'Artist bookmarked.' : 'Bookmark removed.',
          'success'
        )
      );
    } catch {
      dispatch(addAlert('Failed to update bookmark.', 'danger'));
    }
  };

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeArtist(artistId).unwrap();
        dispatch(addAlert('Unsubscribed from artist.', 'success'));
      } else {
        await subscribeArtist(artistId).unwrap();
        dispatch(addAlert('Subscribed to artist.', 'success'));
      }
    } catch {
      dispatch(addAlert('Failed to update subscription.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !artist)
    return <div className="p-4 text-red-400">Artist not found.</div>;

  const isSubscribed = artist.isSubscribed ?? false;
  const tags = artist.tags ?? [];
  const similar = artist.similarTo ?? [];
  const aliases = artist.aliases ?? [];
  const releases = artist.releases ?? [];

  // Group releases by year for visual grouping
  const seenYears = new Set<number | null | undefined>();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
          Artists
        </Link>
        {' › '}
        <strong className="text-gray-200">{artist.name}</strong>
      </nav>

      {/* Artist header */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">
            {artist.name}
          </span>
          {artist.vanityHouse && (
            <span className="text-xs px-1.5 py-0.5 bg-indigo-900 text-indigo-300 rounded border border-indigo-700 font-medium">
              Vanity House
            </span>
          )}
          {user && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleSubscribe}
                disabled={subscribing || unsubscribing}
                className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-50 ${
                  isSubscribed
                    ? 'border-indigo-600 text-indigo-400 hover:border-red-500 hover:text-red-400'
                    : 'border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-400'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                title="Bookmark artist"
                className="text-gray-500 hover:text-yellow-300 text-sm transition-colors disabled:opacity-50"
              >
                🔖
              </button>
            </div>
          )}
        </div>
        {artist.description && (
          <div className="px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {artist.description}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Tags
        </div>
        <div className="px-4 py-2 text-sm text-gray-300">
          {tags.length > 0 ? (
            tags.map((t, i) => (
              <span key={t.tag.id}>
                {i > 0 && <span className="text-gray-600">{', '}</span>}
                <span className="text-indigo-400">{t.tag.name}</span>
              </span>
            ))
          ) : (
            <span className="text-gray-600">No tags.</span>
          )}
        </div>
      </div>

      {/* Similar artists */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Similar Artists
        </div>
        <div className="px-4 py-2 text-sm text-gray-300">
          {similar.length > 0 ? (
            similar.map((s, i) => (
              <span key={s.similarArtist.id}>
                {i > 0 && <span className="text-gray-600">{', '}</span>}
                <Link
                  to={`/private/artists/${s.similarArtist.id}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {s.similarArtist.name}
                </Link>
              </span>
            ))
          ) : (
            <span className="text-gray-600">No similar artists.</span>
          )}
        </div>
      </div>

      {/* Aliases */}
      {aliases.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Also Known As
          </div>
          <div className="px-4 py-2 text-sm text-gray-300">
            {aliases.map((a, i) => (
              <span key={a.redirect.id}>
                {i > 0 && <span className="text-gray-600">{', '}</span>}
                <Link
                  to={`/private/artists/${a.redirect.id}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {a.redirect.name}
                </Link>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Discography */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200">
          Discography
        </div>
        {releases.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No accessible releases.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400 text-xs">
                <th className="px-4 py-2 font-medium w-16">Year</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Community</th>
                <th className="px-4 py-2 font-medium w-32">Type</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => {
                const isFirstInYear = !seenYears.has(release.year);
                if (isFirstInYear) seenYears.add(release.year);
                const yearLabel = release.year ?? '—';

                return (
                  <tr
                    key={release.id}
                    className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-400 text-xs font-medium whitespace-nowrap">
                      {isFirstInYear ? (
                        yearLabel
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {release.communityId ? (
                        <Link
                          to={`/private/communities/${release.communityId}/releases/${release.id}`}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {release.title}
                        </Link>
                      ) : (
                        <span className="text-gray-300">{release.title}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {release.community ? (
                        <Link
                          to={`/private/communities/${release.community.id}`}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {release.community.name}
                        </Link>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {release.type ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <CommentsSection page="artist" pageId={artistId} />
    </div>
  );
};

export default ArtistPage;
