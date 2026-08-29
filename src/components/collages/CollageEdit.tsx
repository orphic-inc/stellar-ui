import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCollageQuery,
  useUpdateCollageMutation,
  type UpdateCollagePayload
} from '../../store/services/collageApi';
import { hasAnyPermission } from '../../utils/permissions';
import type { Collage } from '../../types';
import Spinner from '../layout/Spinner';

const CollageEditForm = ({
  collage,
  isStaff
}: {
  collage: Collage;
  isStaff: boolean;
}) => {
  const collageId = collage.id;
  const navigate = useNavigate();
  const [updateCollage, { isLoading: isSaving }] = useUpdateCollageMutation();

  const [name, setName] = useState(collage.name);
  const [description, setDescription] = useState(collage.description);
  const [tagsInput, setTagsInput] = useState(collage.tags.join(', '));
  const [isFeatured, setIsFeatured] = useState(collage.isFeatured);
  const [isLocked, setIsLocked] = useState(collage.isLocked);
  const [maxEntries, setMaxEntries] = useState(collage.maxEntries);
  const [maxEntriesPerUser, setMaxEntriesPerUser] = useState(
    collage.maxEntriesPerUser
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: UpdateCollagePayload = { id: collageId, description, tags };

    // Name: only for staff or personal collage owner
    if (isStaff || collage.categoryId === 0) {
      payload.name = name;
    }

    if (collage.categoryId === 0) {
      payload.isFeatured = isFeatured;
    }

    if (isStaff) {
      payload.isLocked = isLocked;
      payload.maxEntries = maxEntries;
      payload.maxEntriesPerUser = maxEntriesPerUser;
    }

    try {
      await updateCollage(payload).unwrap();
      navigate(`/collages/${collageId}`);
    } catch (err: unknown) {
      const e = err as { data?: { msg?: string } };
      setError(e?.data?.msg ?? 'Failed to update collage.');
    }
  };

  return (
    <div className="thin">
      <h2 className="text-xl font-semibold mb-4">Edit Collage</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {(isStaff || collage.categoryId === 0) && (
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm text-gray-300 mb-1"
            >
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="edit-description"
            className="block text-sm text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={5}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>

        <div>
          <label
            htmlFor="edit-tags"
            className="block text-sm text-gray-300 mb-1"
          >
            Tags <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            id="edit-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {collage.categoryId === 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isFeatured" className="text-sm text-gray-300">
              Feature this collage on my profile
            </label>
          </div>
        )}

        {isStaff && (
          <div className="border border-gray-700 rounded p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-400">
              Staff Settings
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLocked"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isLocked" className="text-sm text-gray-300">
                Lock collage (prevent new entries)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-max-entries"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Max Entries{' '}
                  <span className="text-gray-500">(0 = unlimited)</span>
                </label>
                <input
                  id="edit-max-entries"
                  type="number"
                  min={0}
                  value={maxEntries}
                  onChange={(e) => setMaxEntries(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-max-per-user"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Max Per User{' '}
                  <span className="text-gray-500">(0 = unlimited)</span>
                </label>
                <input
                  id="edit-max-per-user"
                  type="number"
                  min={0}
                  value={maxEntriesPerUser}
                  onChange={(e) => setMaxEntriesPerUser(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/collages/${collageId}`)}
            className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const CollageEdit = () => {
  const { id } = useParams<{ id: string }>();
  const collageId = Number(id);
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const { data: collage, isLoading } = useGetCollageQuery(collageId);

  const isStaff = hasAnyPermission(user, [
    'collages_moderate',
    'staff',
    'admin'
  ]);
  const isOwner = user?.id === collage?.userId;

  if (isLoading) return <Spinner />;
  if (!collage)
    return <div className="p-4 text-red-400">Collage not found.</div>;
  if (!isOwner && !isStaff) navigate('/collages');

  return <CollageEditForm collage={collage} isStaff={isStaff} />;
};

export default CollageEdit;
