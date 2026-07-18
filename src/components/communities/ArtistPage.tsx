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
import { Badge } from '../ui';

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
    <div>
      {/* Breadcrumb */}
      <nav data-st="meta" className="text-sm mb-4">
        <Link to="/communities" data-st="control">
          Artists
        </Link>
        {' › '}
        <strong data-st="prose" data-st-strong>
          {artist.name}
        </strong>
      </nav>

      {/* Artist header */}
      <div data-st="panel" className="overflow-hidden mb-4">
        <div data-st="colhead" className="px-4 py-2 flex items-center gap-2">
          <span
            data-st="prose"
            data-st-strong
            className="text-sm font-semibold"
          >
            {artist.name}
          </span>
          {artist.vanityHouse && <Badge variant="info">Vanity House</Badge>}
          {user && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleSubscribe}
                disabled={subscribing || unsubscribing}
                data-st="control"
                {...(isSubscribed ? { 'data-st-danger': '' } : {})}
                className="text-xs disabled:opacity-50"
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                title="Bookmark artist"
                data-st="control"
                className="text-sm disabled:opacity-50"
              >
                🔖
              </button>
            </div>
          )}
        </div>
        {artist.description && (
          <div
            data-st="prose"
            className="px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
          >
            {artist.description}
          </div>
        )}
      </div>

      {/* Tags */}
      <div data-st="panel" className="overflow-hidden mb-4">
        <div
          data-st="colhead"
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
        >
          Tags
        </div>
        <div className="px-4 py-2 text-sm">
          {tags.length > 0 ? (
            tags.map((t, i) => (
              <span key={t.tag.id}>
                {i > 0 && <span data-st="meta">{', '}</span>}
                <span data-st="control">{t.tag.name}</span>
              </span>
            ))
          ) : (
            <span data-st="meta">No tags.</span>
          )}
        </div>
      </div>

      {/* Similar artists */}
      <div data-st="panel" className="overflow-hidden mb-4">
        <div
          data-st="colhead"
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
        >
          Similar Artists
        </div>
        <div className="px-4 py-2 text-sm">
          {similar.length > 0 ? (
            similar.map((s, i) => (
              <span key={s.similarArtist.id}>
                {i > 0 && <span data-st="meta">{', '}</span>}
                <Link to={`/artists/${s.similarArtist.id}`} data-st="control">
                  {s.similarArtist.name}
                </Link>
              </span>
            ))
          ) : (
            <span data-st="meta">No similar artists.</span>
          )}
        </div>
      </div>

      {/* Aliases */}
      {aliases.length > 0 && (
        <div data-st="panel" className="overflow-hidden mb-4">
          <div
            data-st="colhead"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            Also Known As
          </div>
          <div className="px-4 py-2 text-sm">
            {aliases.map((a, i) => (
              <span key={a.redirect.id}>
                {i > 0 && <span data-st="meta">{', '}</span>}
                <Link to={`/artists/${a.redirect.id}`} data-st="control">
                  {a.redirect.name}
                </Link>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Discography */}
      <div data-st="panel" className="overflow-hidden">
        <div data-st="colhead" className="px-4 py-2 text-sm font-semibold">
          Discography
        </div>
        {releases.length === 0 ? (
          <div data-st="meta" className="px-4 py-6 text-sm text-center">
            No accessible releases.
          </div>
        ) : (
          <table data-st="grid" className="w-full text-sm">
            <thead data-st="colhead">
              <tr className="text-xs">
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
                    data-st="row"
                    className="transition-colors"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span data-st="meta" className="text-xs font-medium">
                        {isFirstInYear ? yearLabel : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {release.communityId ? (
                        <Link
                          to={`/communities/${release.communityId}/releases/${release.id}`}
                          data-st="control"
                        >
                          {release.title}
                        </Link>
                      ) : (
                        <span data-st="prose">{release.title}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {release.community ? (
                        <Link
                          to={`/communities/${release.community.id}`}
                          data-st="control"
                        >
                          {release.community.name}
                        </Link>
                      ) : (
                        <span data-st="meta">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span data-st="meta">{release.type ?? '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <CommentsSection context="artist" pageId={artistId} />
    </div>
  );
};

export default ArtistPage;
