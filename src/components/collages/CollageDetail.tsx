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

  return (
    <div className="thin">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">{collage.name}</h2>
            {collage.isLocked && (
              <span className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 rounded">
                Locked
              </span>
            )}
            {collage.isDeleted && (
              <span className="text-xs px-2 py-0.5 bg-red-900/40 text-red-400 rounded">
                Deleted
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {CATEGORY_LABELS[collage.categoryId] ?? 'Unknown'} · by{' '}
            <Link
              to={`/private/user/${collage.user?.username ?? collage.userId}`}
              className="text-blue-400 hover:underline"
            >
              {collage.user?.username ?? '—'}
            </Link>
            {' · '}
            {collage.numEntries} entries · {collage.numSubscribers} subscribers
          </div>
        </div>

        <div className="flex gap-2 text-sm shrink-0 ml-4">
          <button
            onClick={handleSubscribe}
            className={`px-3 py-1 rounded border text-xs ${
              collage.isSubscribed
                ? 'border-green-600 text-green-400 hover:border-red-500 hover:text-red-400'
                : 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
            }`}
          >
            {collage.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
          <button
            onClick={handleBookmark}
            className={`px-3 py-1 rounded border text-xs ${
              collage.isBookmarked
                ? 'border-yellow-600 text-yellow-400'
                : 'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400'
            }`}
          >
            {collage.isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          {canEdit && (
            <Link
              to={`/private/collages/${collageId}/edit`}
              className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:border-gray-500 text-xs"
            >
              Edit
            </Link>
          )}
          {canEdit && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 rounded border border-gray-700 text-red-500 hover:border-red-700 text-xs"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {collage.tags.length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {collage.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mb-6 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {collage.description}
      </div>

      {canManageEntries && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Add Release
          </h3>
          <form onSubmit={handleAddEntry} className="flex gap-2">
            <input
              type="number"
              value={releaseIdInput}
              onChange={(e) => setReleaseIdInput(e.target.value)}
              placeholder="Release ID"
              className="w-40 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
            >
              Add
            </button>
          </form>
          {addError && <p className="mt-1 text-xs text-red-400">{addError}</p>}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Entries ({collage.numEntries})
        </h3>

        {!collage.entries || collage.entries.length === 0 ? (
          <p className="text-gray-500 text-sm">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {collage.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-2 bg-gray-900/50 border border-gray-800 rounded hover:border-gray-700"
              >
                {entry.release?.image ? (
                  <img
                    src={entry.release.image}
                    alt=""
                    className="w-10 h-10 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-800 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/private/communities/${
                      entry.release?.artist?.id ?? 0
                    }/releases/${entry.releaseId}`}
                    className="text-sm text-blue-400 hover:underline truncate block"
                  >
                    {entry.release?.title ?? `Release #${entry.releaseId}`}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {entry.release?.artist?.name ?? '—'} ·{' '}
                    {entry.release?.year ?? ''}
                  </div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">
                  added by {entry.user?.username ?? '—'}
                </div>
                {(isOwner || isStaff || entry.userId === user?.id) && (
                  <button
                    onClick={() => handleRemoveEntry(entry.releaseId)}
                    className="text-xs text-red-500 hover:text-red-400 shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <CommentsSection page="collages" pageId={collageId} />
      </div>
    </div>
  );
};

export default CollageDetail;
