import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import CommentsSection from '../layout/CommentsSection';
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
import { useReleaseWorkbench } from './useReleaseWorkbench';

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  image: 'Cover art',
  year: 'Year'
};

const formatFieldValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (field === 'description' && typeof value === 'string') {
    return value.length > 120 ? value.slice(0, 120) + '…' : value;
  }
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);
  return JSON.stringify(value);
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
  const {
    release,
    community,
    isLoading,
    error,
    tags,
    myVote,
    agg,
    historyEntries,
    historyOpen,
    setHistoryOpen,
    historyLoading,
    pendingTag,
    setPendingTag,
    revertingId,
    setRevertingId,
    editOpen,
    setEditOpen,
    editForm,
    setEditForm,
    editError,
    canManageTags,
    canEdit,
    voting,
    unvoting,
    addingTag,
    votingTag,
    removingTag,
    saving,
    handleVote,
    handleAddTag,
    handleRemoveTag,
    handleVoteTag,
    handleEditOpen,
    handleEditSave,
    handleRevertHistory
  } = useReleaseWorkbench({
    communityId: cId,
    releaseId: rId,
    user
  });
  const [toggleBookmark, { isLoading: bookmarking }] =
    useToggleReleaseBookmarkMutation();
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

  if (isLoading) return <Spinner />;
  if (error || !release)
    return <div className="p-4 text-red-400">Release not found.</div>;

  return (
    <div>
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
        {canEdit && (
          <button
            type="button"
            onClick={handleEditOpen}
            className="hover:text-indigo-300 transition-colors"
          >
            [Edit release]
          </button>
        )}
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
                      const beforeSnap = entry.before as
                        | Record<string, unknown>
                        | null
                        | undefined;
                      const afterSnap = entry.after as
                        | Record<string, unknown>
                        | null
                        | undefined;
                      const showDiff =
                        entry.action === 'edit' &&
                        beforeSnap &&
                        afterSnap &&
                        entry.changedFields.length > 0;
                      const isReverting = revertingId === entry.id;
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
                            {canManageTags && entry.action === 'edit' && (
                              <span className="ml-auto flex items-center gap-1">
                                {isReverting ? (
                                  <>
                                    <span className="text-gray-400 text-xs">
                                      Confirm?
                                    </span>
                                    <button
                                      type="button"
                                      className="text-xs text-red-400 hover:text-red-300"
                                      onClick={() =>
                                        void handleRevertHistory(entry.id)
                                      }
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      className="text-xs text-gray-400 hover:text-gray-300"
                                      onClick={() => setRevertingId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="text-xs text-gray-500 hover:text-gray-300"
                                    onClick={() => setRevertingId(entry.id)}
                                  >
                                    Revert
                                  </button>
                                )}
                              </span>
                            )}
                          </div>
                          {showDiff && (
                            <table className="mt-2 w-full text-xs border-collapse">
                              <tbody>
                                {entry.changedFields.map((field) => (
                                  <tr
                                    key={field}
                                    className="border-t border-gray-800"
                                  >
                                    <td className="py-1 pr-3 text-gray-500 whitespace-nowrap">
                                      {FIELD_LABELS[field] ?? field}
                                    </td>
                                    <td className="py-1 pr-2 text-gray-400 max-w-xs break-words">
                                      {formatFieldValue(
                                        field,
                                        beforeSnap[field]
                                      )}
                                    </td>
                                    <td className="py-1 pr-2 text-gray-500">
                                      →
                                    </td>
                                    <td className="py-1 text-gray-200 max-w-xs break-words">
                                      {formatFieldValue(
                                        field,
                                        afterSnap[field]
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
            context="release"
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

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-gray-100">
                Edit release
              </h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <label className="block">
                <span className="text-xs text-gray-400 block mb-1">Title</span>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 block mb-1">
                  Description
                </span>
                <textarea
                  value={editForm.description}
                  rows={5}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                />
              </label>
              <div className="flex gap-3">
                <label className="block flex-1">
                  <span className="text-xs text-gray-400 block mb-1">Year</span>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={editForm.year}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        year: parseInt(e.target.value) || 0
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-gray-400 block mb-1">
                  Cover image URL
                </span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editForm.image}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, image: e.target.value }))
                    }
                    placeholder="https://…"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {editForm.image && (
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, image: '' }))}
                      className="text-xs text-gray-500 hover:text-red-400 px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 block mb-1">
                  Edit summary <span className="text-gray-600">(optional)</span>
                </span>
                <input
                  type="text"
                  value={editForm.editSummary}
                  maxLength={255}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, editSummary: e.target.value }))
                  }
                  placeholder="Brief description of changes…"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </label>
              {editError && <p className="text-xs text-red-400">{editError}</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleEditSave}
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs rounded transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleasePage;
