import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import CommentsSection from '../layout/CommentsSection';
import {
  useGetReleaseByIdQuery,
  useGetCommunityByIdQuery,
  useGetReleaseHistoryQuery,
  useVoteOnReleaseMutation,
  useRemoveVoteOnReleaseMutation,
  useAddTagToReleaseMutation,
  useVoteOnReleaseTagMutation,
  useRemoveTagFromReleaseMutation
} from '../../store/services/communityApi';
import type {
  MyVote,
  ReleaseTag,
  VoteAggregate
} from '../../store/services/communityApi';
import { useToggleReleaseBookmarkMutation } from '../../store/services/bookmarkApi';
import {
  useGetCommentSubscriptionQuery,
  useSubscribeCommentsMutation
} from '../../store/services/subscriptionApi';
import { addAlert } from '../../store/slices/alertSlice';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import DownloadButton from './DownloadButton';
import LinkStatusBadge from './LinkStatusBadge';
import ReportContributionModal from './ReportContributionModal';
import { formatBytes } from '../../utils';
import type { LinkHealthStatus } from '../../types';

type ReleaseWithVote = {
  myVote?: MyVote;
  voteAggregate?: VoteAggregate | null;
  releaseTags?: ReleaseTag[];
};

const formatHistoryValue = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

const ReleasePage = () => {
  const { communityId, releaseId } = useParams<{
    communityId: string;
    releaseId: string;
  }>();
  const cId = parseInt(communityId ?? '0');
  const rId = parseInt(releaseId ?? '0');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [pendingTag, setPendingTag] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    data: release,
    isLoading,
    error
  } = useGetReleaseByIdQuery({ communityId: cId, releaseId: rId });
  const { data: community } = useGetCommunityByIdQuery(cId);
  const { data: historyData, isLoading: historyLoading } =
    useGetReleaseHistoryQuery(
      { communityId: cId, releaseId: rId },
      { skip: !historyOpen }
    );
  const [toggleBookmark, { isLoading: bookmarking }] =
    useToggleReleaseBookmarkMutation();
  const [voteOn, { isLoading: voting }] = useVoteOnReleaseMutation();
  const [removeVote, { isLoading: unvoting }] =
    useRemoveVoteOnReleaseMutation();
  const [addTag, { isLoading: addingTag }] = useAddTagToReleaseMutation();
  const [voteTag, { isLoading: votingTag }] = useVoteOnReleaseTagMutation();
  const [removeTag, { isLoading: removingTag }] =
    useRemoveTagFromReleaseMutation();
  const { data: commentSubData } = useGetCommentSubscriptionQuery(
    { page: 'release', pageId: rId },
    { skip: !user }
  );
  const isSubscribedToComments = commentSubData?.subscribed ?? false;
  const [subscribeComments, { isLoading: subscribingComments }] =
    useSubscribeCommentsMutation();

  const handleCommentSubscribe = async () => {
    try {
      await subscribeComments({
        page: 'release',
        pageId: rId,
        action: isSubscribedToComments ? 'unsubscribe' : 'subscribe'
      }).unwrap();
      dispatch(
        addAlert(
          isSubscribedToComments
            ? 'Unsubscribed from comments.'
            : 'Subscribed to comments.',
          'success'
        )
      );
    } catch {
      dispatch(addAlert('Failed to update comment subscription.', 'danger'));
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(rId).unwrap();
      dispatch(
        addAlert(
          result.bookmarked ? 'Release bookmarked.' : 'Bookmark removed.',
          'success'
        )
      );
    } catch {
      dispatch(addAlert('Failed to update bookmark.', 'danger'));
    }
  };

  const handleVote = async (positive: boolean) => {
    const r = release as ReleaseWithVote | undefined;
    const alreadyThis =
      (positive && r?.myVote === 'up') || (!positive && r?.myVote === 'down');
    try {
      if (alreadyThis) {
        await removeVote({ communityId: cId, releaseId: rId }).unwrap();
      } else {
        await voteOn({
          communityId: cId,
          releaseId: rId,
          positive
        }).unwrap();
      }
    } catch {
      dispatch(addAlert('Failed to record vote.', 'danger'));
    }
  };

  const handleAddTag = async () => {
    const name = pendingTag.trim().toLowerCase();
    if (!name) return;
    try {
      await addTag({ communityId: cId, releaseId: rId, name }).unwrap();
      setPendingTag('');
    } catch (e: unknown) {
      const msg =
        (e as { data?: { msg?: string } })?.data?.msg ?? 'Failed to add tag.';
      dispatch(addAlert(msg, 'danger'));
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTag({ communityId: cId, releaseId: rId, tagId }).unwrap();
    } catch {
      dispatch(addAlert('Failed to remove tag.', 'danger'));
    }
  };

  const handleVoteTag = async (tagId: number, direction: 'up' | 'down') => {
    try {
      await voteTag({
        communityId: cId,
        releaseId: rId,
        tagId,
        direction
      }).unwrap();
    } catch {
      dispatch(addAlert('Failed to record tag vote.', 'danger'));
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !release)
    return <div className="p-4 text-red-400">Release not found.</div>;

  const r = release as typeof release & ReleaseWithVote;
  const tags = r.releaseTags ?? [];
  const myVote = r.myVote ?? null;
  const agg = r.voteAggregate ?? null;
  const historyEntries = historyData?.data ?? [];
  const canManageTags = Boolean(
    user?.userRank?.permissions?.communities_manage ||
      user?.userRank?.permissions?.staff ||
      user?.userRank?.permissions?.admin
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
          Communities
        </Link>
        {' › '}
        <Link
          to={`/private/communities/${communityId}`}
          className="hover:text-gray-300"
        >
          {community?.name ?? 'Community'}
        </Link>
        {' › '}
        <strong className="text-gray-200">{release.title}</strong>
      </nav>

      {/* Page title */}
      <h1 className="text-xl font-bold text-white mb-1">
        {release.artist && (
          <span className="text-gray-300">{release.artist.name} — </span>
        )}
        {release.title}
        {release.year && (
          <span className="text-gray-400 font-normal text-base ml-2">
            [{release.year}]
          </span>
        )}
      </h1>

      {/* Action links */}
      <div className="flex gap-3 text-xs text-indigo-400 mb-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/private/communities/${communityId}/releases/${releaseId}/contribute`
            )
          }
          className="hover:text-indigo-300 transition-colors"
        >
          [Add format]
        </button>
        {user && (
          <button
            type="button"
            onClick={handleBookmark}
            disabled={bookmarking}
            className="hover:text-yellow-300 transition-colors disabled:opacity-50"
          >
            [🔖 Bookmark]
          </button>
        )}
        {user && (
          <button
            type="button"
            onClick={handleCommentSubscribe}
            disabled={subscribingComments}
            className="hover:text-indigo-300 transition-colors disabled:opacity-50"
          >
            {isSubscribedToComments ? '[Unsubscribe]' : '[Subscribe]'}
          </button>
        )}
        <Link
          to={`/private/reports/new?targetType=Release&targetId=${rId}`}
          className="hover:text-indigo-300 transition-colors"
        >
          [Report release]
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Contributions table */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200">
              Contributions
            </div>
            {release.contributions && release.contributions.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left text-gray-400 text-xs">
                    <th className="px-4 py-2 font-medium">Format</th>
                    <th className="px-4 py-2 font-medium">Size</th>
                    <th className="px-4 py-2 font-medium">Contributor</th>
                    <th className="px-4 py-2 font-medium">Notes</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {release.contributions.map((c) => {
                    const linkStatus = ((c as { linkStatus?: string })
                      .linkStatus ?? 'UNKNOWN') as LinkHealthStatus;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-gray-800 hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-2 text-gray-300 text-xs font-medium">
                          {c.type}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                          {c.sizeInBytes
                            ? formatBytes(Number(c.sizeInBytes))
                            : '—'}
                        </td>
                        <td className="px-4 py-2">
                          <Link
                            to={`/private/user/${c.user.username}`}
                            className="text-indigo-400 hover:text-indigo-300 text-xs"
                          >
                            {c.user.username}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">
                          {c.releaseDescription ?? '—'}
                        </td>
                        <td className="px-4 py-2">
                          <LinkStatusBadge status={linkStatus} />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2 items-center text-xs">
                            <DownloadButton
                              contributionId={c.id}
                              canDownload={user?.canDownload ?? false}
                            />
                            <button
                              type="button"
                              className="text-gray-600 hover:text-gray-400 transition-colors"
                              title="Report dead or misleading link"
                              onClick={() => setReportingId(c.id)}
                            >
                              [Report]
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500">
                No contributions yet.{' '}
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300"
                  onClick={() =>
                    navigate(
                      `/private/communities/${communityId}/releases/${releaseId}/contribute`
                    )
                  }
                >
                  Be the first to contribute a file.
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {release.description && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Album Info
              </div>
              <div className="px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {release.description}
              </div>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full bg-gray-800 border-b border-gray-700 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200 flex items-center justify-between"
            >
              <span>History</span>
              <span>{historyOpen ? '▲' : '▼'}</span>
            </button>
            {historyOpen && (
              <>
                {historyLoading ? (
                  <div className="px-4 py-4">
                    <Spinner />
                  </div>
                ) : historyEntries.length > 0 ? (
                  <div className="divide-y divide-gray-800">
                    {historyEntries.map((entry) => {
                      const hasSnapshot = entry.before || entry.after;
                      return (
                        <div key={entry.id} className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-300">
                            <span>{entry.summary}</span>
                            <span className="text-gray-600">by</span>
                            <Link
                              to={`/private/user/${entry.actor.username}`}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              {entry.actor.username}
                            </Link>
                            <span className="text-gray-600">
                              <Time date={entry.createdAt} />
                            </span>
                          </div>
                          {entry.changedFields.length > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Fields: {entry.changedFields.join(', ')}
                            </p>
                          )}
                          {hasSnapshot && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-indigo-300 hover:text-indigo-200">
                                View snapshot
                              </summary>
                              <div className="mt-2 grid gap-3 md:grid-cols-2">
                                <div className="rounded border border-gray-800 bg-gray-950/60 p-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Before
                                  </p>
                                  <pre className="whitespace-pre-wrap break-words text-xs text-gray-300">
                                    {formatHistoryValue(entry.before)}
                                  </pre>
                                </div>
                                <div className="rounded border border-gray-800 bg-gray-950/60 p-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    After
                                  </p>
                                  <pre className="whitespace-pre-wrap break-words text-xs text-gray-300">
                                    {formatHistoryValue(entry.after)}
                                  </pre>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    No release history yet.
                  </div>
                )}
              </>
            )}
          </div>

          <CommentsSection
            page="release"
            pageId={rId}
            alreadySubscribed={isSubscribedToComments}
          />
        </div>

        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          {/* Cover art */}
          {release.image && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cover
              </div>
              <img
                src={release.image}
                alt={release.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Votes */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Rating
            </div>
            <div className="px-3 py-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Vote up"
                  disabled={voting || unvoting}
                  onClick={() => handleVote(true)}
                  className={`flex-1 py-1.5 text-sm rounded border transition-colors disabled:opacity-50 ${
                    myVote === 'up'
                      ? 'bg-green-700 border-green-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-green-400 hover:bg-green-900/40'
                  }`}
                >
                  ▲{agg ? ` ${agg.ups}` : ''}
                </button>
                <button
                  type="button"
                  aria-label="Vote down"
                  disabled={voting || unvoting}
                  onClick={() => handleVote(false)}
                  className={`flex-1 py-1.5 text-sm rounded border transition-colors disabled:opacity-50 ${
                    myVote === 'down'
                      ? 'bg-red-800 border-red-700 text-white'
                      : 'bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900/40'
                  }`}
                >
                  ▼{agg ? ` ${agg.total - agg.ups}` : ''}
                </button>
              </div>
              {agg && agg.total > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  {Math.round((agg.ups / agg.total) * 100)}% positive ·{' '}
                  {agg.total} vote{agg.total !== 1 ? 's' : ''}
                </p>
              )}
              {agg && agg.total > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Score: {(agg.score * 100).toFixed(1)}
                </p>
              )}
            </div>
          </div>

          {/* Artist */}
          {release.artist && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Artist
              </div>
              <div className="px-3 py-2 text-sm">
                <Link
                  to={`/private/artists/${release.artist.id}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {release.artist.name}
                </Link>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tags
            </div>
            <div className="px-3 py-2 space-y-2">
              {tags.length > 0 ? (
                <div className="space-y-2">
                  {tags.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs"
                    >
                      <Link
                        to={`/private/releases?tags=${encodeURIComponent(
                          t.name
                        )}`}
                        className="min-w-0 truncate text-indigo-300 hover:text-indigo-200"
                      >
                        {t.name}
                      </Link>
                      <div className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          title="Vote tag up"
                          aria-label={`Vote tag ${t.name} up`}
                          disabled={votingTag || t.myVotes?.up}
                          onClick={() => handleVoteTag(t.tagId, 'up')}
                          className={`rounded border px-1.5 py-0.5 transition-colors disabled:opacity-50 ${
                            t.myVotes?.up
                              ? 'border-green-600 bg-green-700/60 text-white'
                              : 'border-gray-600 text-green-400 hover:bg-green-900/40'
                          }`}
                        >
                          ▲
                        </button>
                        <span className="min-w-8 text-center text-gray-300">
                          {t.score}
                        </span>
                        <button
                          type="button"
                          title="Vote tag down"
                          aria-label={`Vote tag ${t.name} down`}
                          disabled={votingTag || t.myVotes?.down}
                          onClick={() => handleVoteTag(t.tagId, 'down')}
                          className={`rounded border px-1.5 py-0.5 transition-colors disabled:opacity-50 ${
                            t.myVotes?.down
                              ? 'border-red-700 bg-red-800/60 text-white'
                              : 'border-gray-600 text-red-400 hover:bg-red-900/40'
                          }`}
                        >
                          ▼
                        </button>
                        {canManageTags && (
                          <button
                            type="button"
                            title="Remove tag"
                            onClick={() => handleRemoveTag(t.tagId)}
                            disabled={removingTag}
                            className="ml-1 text-gray-500 transition-colors hover:text-red-400 disabled:opacity-50"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No tags yet.</p>
              )}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={pendingTag}
                  onChange={(e) => setPendingTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                  placeholder="Add tag…"
                  className="flex-1 min-w-0 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={addingTag || !pendingTag.trim()}
                  onClick={handleAddTag}
                  className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded disabled:opacity-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Info
            </div>
            <ul className="divide-y divide-gray-800 text-xs">
              {release.type && (
                <li className="flex justify-between px-3 py-1.5">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-300">{release.type}</span>
                </li>
              )}
              {release.year && (
                <li className="flex justify-between px-3 py-1.5">
                  <span className="text-gray-500">Year</span>
                  <span className="text-gray-300">{release.year}</span>
                </li>
              )}
              {(release as { isEdition?: boolean }).isEdition && (
                <li className="flex justify-between px-3 py-1.5">
                  <span className="text-gray-500">Edition</span>
                  <span className="text-gray-300">
                    {(release as { edition?: string }).edition ?? 'Yes'}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {reportingId !== null && (
        <ReportContributionModal
          contributionId={reportingId}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
};

export default ReleasePage;
