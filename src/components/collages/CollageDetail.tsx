import { useState, useMemo, type CSSProperties } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCollageQuery,
  useDeleteCollageMutation,
  useSubscribeCollageMutation,
  useBookmarkCollageMutation,
  useAddCollageEntryMutation,
  useRemoveCollageEntryMutation
} from '../../store/services/collageApi';
import { useGetReleaseContributionsQuery } from '../../store/services/communityApi';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import CommentsSection from '../layout/CommentsSection';
import EditionStack from '../communities/EditionStack';

const CATEGORY_LABELS: Record<number, string> = {
  0: 'Personal',
  1: 'Theme / Genre',
  2: 'Discography',
  3: 'Label',
  4: 'Charts',
  5: 'Staff Picks',
  6: 'Other'
};

// Lazy edition disclosure for one collage entry — fetches the release's
// contributions only once its row is expanded (this component mounts on
// expand), then renders the read-only edition stack. Downloads/reports live on
// the release page, so no actions here.
const EntryEditions = ({
  communityId,
  releaseId
}: {
  communityId: number;
  releaseId: number;
}) => {
  const { data, isFetching } = useGetReleaseContributionsQuery({
    communityId,
    releaseId
  });
  if (isFetching && !data) {
    return (
      <div data-st="meta" className="px-3 py-2 text-xs">
        Loading editions…
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div data-st="meta" className="px-3 py-2 text-xs">
        No files contributed yet.
      </div>
    );
  }
  return <EditionStack contributions={data} />;
};

const CollageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const collageId = Number(id);
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const { data: collage, isLoading, error } = useGetCollageQuery(collageId);
  const [deleteCollage] = useDeleteCollageMutation();
  const [subscribe] = useSubscribeCollageMutation();
  const [bookmark] = useBookmarkCollageMutation();
  const [addEntry] = useAddCollageEntryMutation();
  const [removeEntry] = useRemoveCollageEntryMutation();

  const [releaseIdInput, setReleaseIdInput] = useState('');
  const [addError, setAddError] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Contributor power-law — group entries by the user who added them. The detail
  // payload carries per-entry `user`, so weights derive client-side with no API
  // dependency (PRD §5 / D-5); `share` drives the `bar` Role's --st-w. Declared
  // above the loading/error guards to keep hook order stable.
  const contributors = useMemo(() => {
    const entries = collage?.entries ?? [];
    const byUser = new Map<number, { username: string; count: number }>();
    for (const e of entries) {
      if (!e.user) continue;
      const cur = byUser.get(e.user.id);
      if (cur) cur.count += 1;
      else byUser.set(e.user.id, { username: e.user.username, count: 1 });
    }
    const total = entries.length;
    return [...byUser.entries()]
      .map(([id, v]) => ({
        id,
        username: v.username,
        count: v.count,
        share: total ? Math.round((v.count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [collage]);

  if (isLoading) return <Spinner />;
  if (error || !collage)
    return <div className="p-4 text-red-400">Collage not found.</div>;

  const isOwner = user?.id === collage.userId;
  const isStaff = hasAnyPermission(user, [
    'collages_moderate',
    'staff',
    'admin'
  ]);
  const canEdit = isOwner || isStaff;
  const canManageEntries =
    !collage.isLocked || isStaff
      ? isOwner || isStaff || collage.categoryId !== 0
      : false;

  const handleDelete = async () => {
    const msg =
      collage.categoryId === 0
        ? 'Delete this personal collage permanently?'
        : 'Mark this collage as deleted? (Staff can recover it)';
    if (!confirm(msg)) return;
    try {
      await deleteCollage(collageId).unwrap();
      navigate('/collages');
    } catch {
      alert('Failed to delete collage.');
    }
  };

  const handleSubscribe = async () => {
    try {
      await subscribe(collageId).unwrap();
    } catch {
      alert('Failed to update subscription.');
    }
  };

  const handleBookmark = async () => {
    try {
      await bookmark(collageId).unwrap();
    } catch {
      alert('Failed to update bookmark.');
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const releaseId = Number(releaseIdInput.trim());
    if (!releaseId) {
      setAddError('Enter a valid release ID.');
      return;
    }
    try {
      await addEntry({ id: collageId, releaseId }).unwrap();
      setReleaseIdInput('');
    } catch (err: unknown) {
      const e = err as { data?: { msg?: string } };
      setAddError(e?.data?.msg ?? 'Failed to add entry.');
    }
  };

  const handleRemoveEntry = async (releaseId: number) => {
    if (!confirm('Remove this release from the collage?')) return;
    try {
      await removeEntry({ id: collageId, releaseId }).unwrap();
    } catch {
      alert('Failed to remove entry.');
    }
  };

  const scrollToEntry = (releaseId: number) => {
    setHighlightedId(releaseId);
    const el = document.getElementById(`entry-${releaseId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedId(null), 1500);
    }
  };

  const coverImages = (collage.entries ?? [])
    .filter((e) => e.release?.image)
    .slice(0, 12)
    .map((e) => ({ src: e.release!.image!, releaseId: e.releaseId }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{collage.name}</h1>
            {collage.isLocked && (
              <span className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 rounded border border-yellow-900/60">
                Locked
              </span>
            )}
            {collage.isDeleted && (
              <span className="text-xs px-2 py-0.5 bg-red-900/40 text-red-400 rounded border border-red-900/60">
                Deleted
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            <Link
              to="/collages"
              className="text-indigo-400 hover:text-indigo-300"
            >
              [List of collages]
            </Link>
            {canEdit && (
              <>
                {' '}
                <Link
                  to={`/collages/${collageId}/edit`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  [Edit description]
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-xs shrink-0">
          <button
            onClick={handleSubscribe}
            className={`px-3 py-1 rounded border ${
              collage.isSubscribed
                ? 'border-green-600 text-green-400 hover:border-red-500 hover:text-red-400'
                : 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
            }`}
          >
            {collage.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
          <button
            onClick={handleBookmark}
            className={`px-3 py-1 rounded border ${
              collage.isBookmarked
                ? 'border-yellow-600 text-yellow-400'
                : 'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400'
            }`}
          >
            {collage.isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          {user && (
            <Link
              to={`/reports/new?targetType=Collage&targetId=${collageId}`}
              className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
            >
              Report
            </Link>
          )}
          {canEdit && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 rounded border border-gray-700 text-red-500 hover:border-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Cover art mosaic — coverart Part (D-4); the first cell leads 2×2. */}
          {coverImages.length > 0 && (
            <div data-st="panel">
              <div data-st="colhead">
                <span>Cover Art</span>
              </div>
              <div data-st="coverart-mosaic">
                {coverImages.map(({ src, releaseId }, i) => (
                  <button
                    key={releaseId}
                    data-st="coverart-cell"
                    data-st-lead={i === 0 ? '' : undefined}
                    onClick={() => scrollToEntry(releaseId)}
                    title="Scroll to release"
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entry list — list of rows; release link is the `title`, artist is
              `meta`. Editions deferred (rip-quality not in the read contract). */}
          <div data-st="panel">
            <div data-st="colhead">
              <span>Entries</span>
              <span>{collage.numEntries} entries</span>
            </div>
            {!collage.entries || collage.entries.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500">No entries yet.</p>
            ) : (
              <div data-st="list">
                {collage.entries.map((entry, i) => {
                  const communityId = entry.release?.communityId ?? null;
                  const isExpanded = expandedId === entry.releaseId;
                  return (
                    <div key={entry.id}>
                      <div
                        id={`entry-${entry.releaseId}`}
                        data-st="row"
                        className={
                          highlightedId === entry.releaseId
                            ? 'bg-indigo-900/30'
                            : undefined
                        }
                      >
                        <span className="text-xs text-gray-600 w-6 shrink-0 text-right">
                          {i + 1}
                        </span>
                        {communityId != null && (
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-label={`${
                              isExpanded ? 'Hide' : 'Show'
                            } editions`}
                            onClick={() =>
                              setExpandedId(isExpanded ? null : entry.releaseId)
                            }
                            className="text-xs text-gray-500 hover:text-gray-300 shrink-0 w-4"
                          >
                            {isExpanded ? '−' : '+'}
                          </button>
                        )}
                        {entry.release?.image ? (
                          <img
                            src={entry.release.image}
                            alt=""
                            className="w-8 h-8 object-cover rounded shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-800 rounded shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/communities/${
                              communityId ?? 0
                            }/releases/${entry.releaseId}`}
                            data-st="title"
                            className="block truncate"
                          >
                            {entry.release?.title ??
                              `Release #${entry.releaseId}`}
                          </Link>
                          {entry.release?.artist?.name && (
                            <div data-st="meta" data-st-em className="text-xs">
                              {entry.release.artist.name}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 shrink-0">
                          added by {entry.user?.username ?? '—'}
                        </span>
                        {(isOwner || isStaff || entry.userId === user?.id) && (
                          <button
                            onClick={() => handleRemoveEntry(entry.releaseId)}
                            className="text-xs text-red-600 hover:text-red-400 shrink-0"
                          >
                            [X]
                          </button>
                        )}
                      </div>
                      {isExpanded && communityId != null && (
                        <EntryEditions
                          communityId={communityId}
                          releaseId={entry.releaseId}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          {/* Category */}
          <div data-st="panel">
            <div data-st="colhead">Category</div>
            <div className="px-3 py-2 text-sm text-gray-300">
              {CATEGORY_LABELS[collage.categoryId] ?? 'Unknown'}
            </div>
          </div>

          {/* Description */}
          {collage.description && (
            <div data-st="panel">
              <div data-st="colhead">Description</div>
              <div className="px-3 py-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {collage.description}
              </div>
            </div>
          )}

          {/* Tags */}
          {collage.tags.length > 0 && (
            <div data-st="panel">
              <div data-st="colhead">Tags</div>
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {collage.tags.map((tag) => (
                  <span key={tag} data-st="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div data-st="panel">
            <div data-st="colhead">Statistics</div>
            <div className="px-3 py-2 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Entries</span>
                <span className="text-gray-200">{collage.numEntries}</span>
              </div>
              <div className="flex justify-between">
                <span>Subscribers</span>
                <span className="text-gray-200">{collage.numSubscribers}</span>
              </div>
              <div className="flex justify-between">
                <span>By</span>
                <Link
                  to={`/user/${collage.user?.username ?? collage.userId}`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {collage.user?.username ?? '—'}
                </Link>
              </div>
            </div>
          </div>

          {/* Top Contributors — the power-law block (D-5): the decomposed
              contributor pattern in practice (list › row › bar + title + meta),
              exercising the new `bar` Role. The leader reads loudest. */}
          {contributors.length > 0 && (
            <div data-st="panel">
              <div data-st="colhead">
                <span>Top Contributors</span>
              </div>
              <div data-st="list">
                {contributors.map((c, i) => (
                  <div
                    key={c.id}
                    data-st="row"
                    data-st-lead={i === 0 ? '' : undefined}
                  >
                    <div
                      data-st="bar"
                      data-st-lead={i === 0 ? '' : undefined}
                      style={{ '--st-w': c.share } as CSSProperties}
                    />
                    <Link
                      to={`/user/${c.username}`}
                      data-st="title"
                      className="truncate text-sm"
                    >
                      {c.username}
                    </Link>
                    <span data-st="meta" data-st-num className="text-xs">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add entry */}
          {canManageEntries && (
            <div data-st="panel">
              <div data-st="colhead">Add Release</div>
              <div className="px-3 py-2">
                <form onSubmit={handleAddEntry} className="flex gap-2">
                  <input
                    type="number"
                    value={releaseIdInput}
                    onChange={(e) => setReleaseIdInput(e.target.value)}
                    placeholder="Release ID"
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded shrink-0"
                  >
                    Add
                  </button>
                </form>
                {addError && (
                  <p className="mt-1 text-xs text-red-400">{addError}</p>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentsSection context="collages" pageId={collageId} />
        </div>
      </div>
    </div>
  );
};

export default CollageDetail;
