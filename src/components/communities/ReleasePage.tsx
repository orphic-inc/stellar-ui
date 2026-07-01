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
import EditionStack from './EditionStack';
import type { LinkHealthStatus } from '../../types';
import { useReleaseWorkbench } from './useReleaseWorkbench';
import { useGetReleaseContributionsQuery } from '../../store/services/communityApi';
import { Modal } from '../ui';

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
  // Rip-quality + edition identity, read release-scoped (#129) — the detail
  // view omits it, so the edition stack loads from its own endpoint.
  const { data: editionContributions } = useGetReleaseContributionsQuery(
    { communityId: cId, releaseId: rId },
    { skip: !cId || !rId }
  );
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
      <nav data-st="meta" className="text-sm mb-4">
        <Link to="/private/communities" data-st="control">
          Communities
        </Link>
        {' › '}
        <Link to={`/private/communities/${communityId}`} data-st="control">
          {community?.name ?? 'Community'}
        </Link>
        {' › '}
        <strong data-st="prose" data-st-strong>
          {release.title}
        </strong>
      </nav>

      {/* Page title */}
      <h1 data-st="prose" data-st-strong className="text-xl font-bold mb-1">
        {release.artist && <span>{release.artist.name} — </span>}
        {release.title}
        {release.year && (
          <span data-st="meta" className="font-normal text-base ml-2">
            [{release.year}]
          </span>
        )}
      </h1>

      {/* Action links */}
      <div className="flex gap-3 text-xs mb-6">
        <button
          type="button"
          data-st="control"
          onClick={() =>
            navigate(
              `/private/communities/${communityId}/releases/${releaseId}/contribute`
            )
          }
        >
          [Add format]
        </button>
        {canEdit && (
          <button type="button" data-st="control" onClick={handleEditOpen}>
            [Edit release]
          </button>
        )}
        {user && (
          <button
            type="button"
            data-st="control"
            onClick={handleBookmark}
            disabled={bookmarking}
            className="disabled:opacity-50"
          >
            [🔖 Bookmark]
          </button>
        )}
        {user && (
          <button
            type="button"
            data-st="control"
            onClick={handleCommentSubscribe}
            disabled={subscribingComments}
            className="disabled:opacity-50"
          >
            {isSubscribedToComments ? '[Unsubscribe]' : '[Subscribe]'}
          </button>
        )}
        <Link
          to={`/private/reports/new?targetType=Release&targetId=${rId}`}
          data-st="control"
        >
          [Report release]
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Contributions table */}
          <div data-st="panel" className="overflow-hidden">
            <div data-st="colhead" className="px-4 py-2 text-sm font-semibold">
              Contributions
            </div>
            {editionContributions && editionContributions.length > 0 ? (
              <EditionStack
                contributions={editionContributions}
                renderActions={(c) => (
                  <span className="flex gap-2 items-center text-xs">
                    <LinkStatusBadge
                      status={(c.linkStatus ?? 'UNKNOWN') as LinkHealthStatus}
                    />
                    <DownloadButton
                      contributionId={c.id}
                      canDownload={user?.canDownload ?? false}
                    />
                    <button
                      type="button"
                      data-st="control"
                      title="Report dead or misleading link"
                      onClick={() => setReportingId(c.id)}
                    >
                      [Report]
                    </button>
                  </span>
                )}
              />
            ) : (
              <div data-st="meta" className="px-4 py-4 text-sm">
                No contributions yet.{' '}
                <button
                  type="button"
                  data-st="control"
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
            <div data-st="panel" className="overflow-hidden">
              <div
                data-st="colhead"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                Album Info
              </div>
              <div
                data-st="prose"
                className="px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
              >
                {release.description}
              </div>
            </div>
          )}

          <div data-st="panel" className="overflow-hidden">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              data-st="colhead"
              className="w-full px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider flex items-center justify-between"
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
                  <div data-st="list">
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
                        <div
                          key={entry.id}
                          data-st="row"
                          className="flex-col items-stretch px-4 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span data-st="prose">{entry.summary}</span>
                            <span data-st="meta">by</span>
                            <Link
                              to={`/private/user/${entry.actor.username}`}
                              data-st="control"
                            >
                              {entry.actor.username}
                            </Link>
                            <span data-st="meta">
                              <Time date={entry.createdAt} />
                            </span>
                            {canManageTags && entry.action === 'edit' && (
                              <span className="ml-auto flex items-center gap-1">
                                {isReverting ? (
                                  <>
                                    <span data-st="meta" className="text-xs">
                                      Confirm?
                                    </span>
                                    <button
                                      type="button"
                                      data-st="control"
                                      data-st-danger
                                      className="text-xs"
                                      onClick={() =>
                                        void handleRevertHistory(entry.id)
                                      }
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      data-st="control"
                                      className="text-xs"
                                      onClick={() => setRevertingId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    data-st="control"
                                    className="text-xs"
                                    onClick={() => setRevertingId(entry.id)}
                                  >
                                    Revert
                                  </button>
                                )}
                              </span>
                            )}
                          </div>
                          {showDiff && (
                            <table
                              data-st="grid"
                              className="mt-2 w-full text-xs"
                            >
                              <tbody>
                                {entry.changedFields.map((field) => (
                                  <tr key={field} data-st="row">
                                    <td className="py-1 pr-3 whitespace-nowrap">
                                      <span data-st="meta">
                                        {FIELD_LABELS[field] ?? field}
                                      </span>
                                    </td>
                                    <td className="py-1 pr-2 max-w-xs break-words">
                                      <span data-st="meta">
                                        {formatFieldValue(
                                          field,
                                          beforeSnap[field]
                                        )}
                                      </span>
                                    </td>
                                    <td className="py-1 pr-2">
                                      <span data-st="meta">→</span>
                                    </td>
                                    <td className="py-1 max-w-xs break-words">
                                      <span data-st="prose">
                                        {formatFieldValue(
                                          field,
                                          afterSnap[field]
                                        )}
                                      </span>
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
                  <div data-st="meta" className="px-4 py-4 text-sm">
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
            <div data-st="panel" className="overflow-hidden">
              <div
                data-st="colhead"
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              >
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
          <div data-st="panel" className="overflow-hidden">
            <div
              data-st="colhead"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            >
              Rating
            </div>
            <div className="px-3 py-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Vote up"
                  disabled={voting || unvoting}
                  onClick={() => handleVote(true)}
                  data-st="control"
                  data-st-primary
                  data-st-success
                  className={`flex-1 text-sm disabled:opacity-50 ${
                    myVote === 'up' ? '' : 'opacity-60'
                  }`}
                >
                  ▲{agg ? ` ${agg.ups}` : ''}
                </button>
                <button
                  type="button"
                  aria-label="Vote down"
                  disabled={voting || unvoting}
                  onClick={() => handleVote(false)}
                  data-st="control"
                  data-st-primary
                  data-st-danger
                  className={`flex-1 text-sm disabled:opacity-50 ${
                    myVote === 'down' ? '' : 'opacity-60'
                  }`}
                >
                  ▼{agg ? ` ${agg.total - agg.ups}` : ''}
                </button>
              </div>
              {agg && agg.total > 0 && (
                <p data-st="meta" className="text-xs text-center">
                  {Math.round((agg.ups / agg.total) * 100)}% positive ·{' '}
                  {agg.total} vote{agg.total !== 1 ? 's' : ''}
                </p>
              )}
              {agg && agg.total > 0 && (
                <p data-st="meta" className="text-xs text-center">
                  Score: {(agg.score * 100).toFixed(1)}
                </p>
              )}
            </div>
          </div>

          {/* Artist */}
          {release.artist && (
            <div data-st="panel" className="overflow-hidden">
              <div
                data-st="colhead"
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              >
                Artist
              </div>
              <div className="px-3 py-2 text-sm">
                <Link
                  to={`/private/artists/${release.artist.id}`}
                  data-st="control"
                >
                  {release.artist.name}
                </Link>
              </div>
            </div>
          )}

          {/* Tags */}
          <div data-st="panel" className="overflow-hidden">
            <div
              data-st="colhead"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            >
              Tags
            </div>
            <div className="px-3 py-2 space-y-2">
              {tags.length > 0 ? (
                <div className="space-y-2">
                  {tags.map((t) => (
                    <div
                      key={t.id}
                      data-st="chip"
                      className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs"
                    >
                      <Link
                        to={`/private/releases?tags=${encodeURIComponent(
                          t.name
                        )}`}
                        data-st="control"
                        className="min-w-0 truncate"
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
                          data-st="control"
                          data-st-primary
                          data-st-success
                          className={`disabled:opacity-50 ${
                            t.myVotes?.up ? '' : 'opacity-60'
                          }`}
                        >
                          ▲
                        </button>
                        <span data-st="meta" className="min-w-8 text-center">
                          {t.score}
                        </span>
                        <button
                          type="button"
                          title="Vote tag down"
                          aria-label={`Vote tag ${t.name} down`}
                          disabled={votingTag || t.myVotes?.down}
                          onClick={() => handleVoteTag(t.tagId, 'down')}
                          data-st="control"
                          data-st-primary
                          data-st-danger
                          className={`disabled:opacity-50 ${
                            t.myVotes?.down ? '' : 'opacity-60'
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
                            data-st="control"
                            data-st-danger
                            className="ml-1 disabled:opacity-50"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p data-st="meta" className="text-xs">
                  No tags yet.
                </p>
              )}
              <div className="flex gap-1">
                <input
                  type="text"
                  data-st="field"
                  value={pendingTag}
                  onChange={(e) => setPendingTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                  placeholder="Add tag…"
                  className="flex-1 min-w-0 text-xs rounded px-2 py-1"
                />
                <button
                  type="button"
                  disabled={addingTag || !pendingTag.trim()}
                  onClick={handleAddTag}
                  data-st="control"
                  data-st-primary
                  className="text-xs disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div data-st="panel" className="overflow-hidden">
            <div
              data-st="colhead"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            >
              Info
            </div>
            <ul data-st="list" className="text-xs">
              {release.type && (
                <li data-st="row" className="flex justify-between px-3 py-1.5">
                  <span data-st="meta">Type</span>
                  <span data-st="prose">{release.type}</span>
                </li>
              )}
              {release.year && (
                <li data-st="row" className="flex justify-between px-3 py-1.5">
                  <span data-st="meta">Year</span>
                  <span data-st="prose">{release.year}</span>
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
        <Modal
          title="Edit release"
          onClose={() => setEditOpen(false)}
          dismissable={!saving}
          bodyClassName="p-0"
        >
          <div className="px-5 py-4 space-y-4">
            <label className="block">
              <span data-st="meta" className="text-xs block mb-1">
                Title
              </span>
              <input
                type="text"
                data-st="field"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full rounded px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span data-st="meta" className="text-xs block mb-1">
                Description
              </span>
              <textarea
                data-st="field"
                value={editForm.description}
                rows={5}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full rounded px-3 py-1.5 text-sm resize-y"
              />
            </label>
            <div className="flex gap-3">
              <label className="block flex-1">
                <span data-st="meta" className="text-xs block mb-1">
                  Year
                </span>
                <input
                  type="number"
                  data-st="field"
                  min={1900}
                  max={2100}
                  value={editForm.year}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      year: parseInt(e.target.value) || 0
                    }))
                  }
                  className="w-full rounded px-3 py-1.5 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span data-st="meta" className="text-xs block mb-1">
                Cover image URL
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  data-st="field"
                  value={editForm.image}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, image: e.target.value }))
                  }
                  placeholder="https://…"
                  className="flex-1 rounded px-3 py-1.5 text-sm"
                />
                {editForm.image && (
                  <button
                    type="button"
                    data-st="control"
                    data-st-danger
                    onClick={() => setEditForm((f) => ({ ...f, image: '' }))}
                    className="text-xs px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </label>
            <label className="block">
              <span data-st="meta" className="text-xs block mb-1">
                Edit summary <span data-st="meta">(optional)</span>
              </span>
              <input
                type="text"
                data-st="field"
                value={editForm.editSummary}
                maxLength={255}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, editSummary: e.target.value }))
                }
                placeholder="Brief description of changes…"
                className="w-full rounded px-3 py-1.5 text-sm"
              />
            </label>
            {editError && <p className="text-xs text-red-400">{editError}</p>}
          </div>
          <div data-st="colhead" className="flex justify-end gap-2 px-5 py-3">
            <button
              type="button"
              data-st="control"
              onClick={() => setEditOpen(false)}
              className="text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              data-st="control"
              data-st-primary
              disabled={saving}
              onClick={handleEditSave}
              className="text-xs disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReleasePage;
