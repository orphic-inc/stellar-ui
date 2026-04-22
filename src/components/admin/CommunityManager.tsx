import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetCommunitiesQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation
} from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
import type { Community } from '../../types';

const EditRow = ({
  community,
  onDone
}: {
  community: Community;
  onDone: () => void;
}) => {
  const [updateCommunity] = useUpdateCommunityMutation();
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCommunity({ id: community.id, name, description });
    onDone();
  };

  return (
    <tr className="bg-indigo-950/30">
      <td className="px-4 py-2" colSpan={4}>
        <form onSubmit={handleSave} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onDone}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </form>
      </td>
    </tr>
  );
};

const CommunityManager = () => {
  const { data: communities, isLoading, error } = useGetCommunitiesQuery();
  const [createCommunity, { isLoading: isCreating }] =
    useCreateCommunityMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCommunity({ name: newName, description: newDescription });
    setNewName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <Link
            to="/private/staff/tools"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← Toolbox
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-white">
            Community Manager
          </h2>
        </div>
      </div>

      {/* Existing communities */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Communities
          </h3>
        </div>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <p className="p-4 text-sm text-red-400">
            Failed to load communities.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-4 py-2 font-semibold">
                  Description
                </th>
                <th className="text-right px-4 py-2 font-semibold">Releases</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!communities?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No communities yet.
                  </td>
                </tr>
              ) : (
                communities.map((c) =>
                  editingId === c.id ? (
                    <EditRow
                      key={c.id}
                      community={c}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-200 font-medium">
                        <Link
                          to={`/private/communities/${c.id}`}
                          className="hover:text-indigo-300 transition-colors"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        {c.description ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-right">
                        {c.numReleases ?? 0}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingId(c.id)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create new community */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Create New Community
          </h3>
        </div>
        <form
          onSubmit={handleCreate}
          className="p-4 flex flex-wrap gap-4 items-end"
        >
          <div>
            <label
              htmlFor="cm-name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="cm-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="Community name"
              className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>
          <div className="flex-1 min-w-60">
            <label
              htmlFor="cm-description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description
            </label>
            <input
              id="cm-description"
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {isCreating ? 'Creating…' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityManager;
