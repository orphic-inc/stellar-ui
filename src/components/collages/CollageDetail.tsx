import { useState } from 'react';
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
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import CommentsSection from '../layout/CommentsSection';

const CATEGORY_LABELS: Record<number, string> = {
  0: 'Personal',
  1: 'Theme / Genre',
  2: 'Discography',
  3: 'Label',
  4: 'Charts',
  5: 'Staff Picks',
  6: 'Other'
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
      navigate('/private/collages');
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
              to="/private/collages"
              className="text-indigo-400 hover:text-indigo-300"
            >
              [List of collages]
            </Link>
            {canEdit && (
              <>
                {' '}
                <Link
                  to={`/private/collages/${collageId}/edit`}
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
              to={`/private/reports/new?targetType=Collage&targetId=${collageId}`}
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
          {/* Cover art mosaic */}
          {coverImages.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
                <span className="text-sm font-semibold text-gray-200">
                  Cover Art
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6">
                {coverImages.map(({ src, releaseId }) => (
                  <button
                    key={releaseId}
                    onClick={() => scrollToEntry(releaseId)}
                    className="focus:outline-none"
                    title="Scroll to release"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full aspect-square object-cover hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entry list */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-200">
                Entries
              </span>
              <span className="text-xs text-gray-500">
                {collage.numEntries} entries
              </span>
            </div>
            {!collage.entries || collage.entries.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500">No entries yet.</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {collage.entries.map((entry, i) => (
                  <div
                    id={`entry-${entry.releaseId}`}
                    key={entry.id}
                    className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                      highlightedId === entry.releaseId
                        ? 'bg-indigo-900/30'
                        : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <span className="text-xs text-gray-600 w-6 shrink-0 text-right">
                      {i + 1}
                    </span>
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
                        to={`/private/communities/${
                          entry.release?.communityId ?? 0
                        }/releases/${entry.releaseId}`}
                        className="text-sm text-blue-400 hover:underline truncate block"
                      >
                        {entry.release?.title ?? `Release #${entry.releaseId}`}
                      </Link>
                      {entry.release?.artist?.name && (
                        <div className="text-xs text-gray-500 italic">
                          {entry.release.artist.name}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 shrink-0">
                      added by {entry.user?.username ?? '—'}
                    </div>
                    {(isOwner || isStaff || entry.userId === user?.id) && (
                      <button
                        onClick={() => handleRemoveEntry(entry.releaseId)}
                        className="text-xs text-red-600 hover:text-red-400 shrink-0"
                      >
                        [X]
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          {/* Category */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Category
            </div>
            <div className="px-3 py-2 text-sm text-gray-300">
              {CATEGORY_LABELS[collage.categoryId] ?? 'Unknown'}
            </div>
          </div>

          {/* Description */}
          {collage.description && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Description
              </div>
              <div className="px-3 py-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {collage.description}
              </div>
            </div>
          )}

          {/* Tags */}
          {collage.tags.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tags
              </div>
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {collage.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded border border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Statistics
            </div>
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
                  to={`/private/user/${
                    collage.user?.username ?? collage.userId
                  }`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {collage.user?.username ?? '—'}
                </Link>
              </div>
            </div>
          </div>

          {/* Add entry */}
          {canManageEntries && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Add Release
              </div>
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
          <CommentsSection page="collages" pageId={collageId} />
        </div>
      </div>
    </div>
  );
};

export default CollageDetail;
