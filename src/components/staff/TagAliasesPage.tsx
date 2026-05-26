import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTagAliasesQuery,
  useCreateTagAliasMutation,
  useUpdateTagAliasMutation,
  useDeleteTagAliasMutation
} from '../../store/services/tagAliasApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const TagAliasesPage = () => {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBadTag, setEditBadTag] = useState('');
  const [editGoodTag, setEditGoodTag] = useState('');
  const [newBadTag, setNewBadTag] = useState('');
  const [newGoodTag, setNewGoodTag] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useGetTagAliasesQuery({ page });
  const [createTagAlias, { isLoading: creating }] = useCreateTagAliasMutation();
  const [updateTagAlias] = useUpdateTagAliasMutation();
  const [deleteTagAlias] = useDeleteTagAliasMutation();

  const aliases = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await createTagAlias({
      badTag: newBadTag.trim(),
      goodTag: newGoodTag.trim()
    });
    if ('error' in result) {
      setError('Failed to create alias. Check that the canonical tag exists.');
    } else {
      setNewBadTag('');
      setNewGoodTag('');
    }
  };

  const startEdit = (id: number, badTag: string, goodTagName: string) => {
    setEditingId(id);
    setEditBadTag(badTag);
    setEditGoodTag(goodTagName);
  };

  const handleSaveEdit = async (id: number) => {
    await updateTagAlias({
      id,
      badTag: editBadTag.trim(),
      goodTag: editGoodTag.trim()
    });
    setEditingId(null);
  };

  const inputClass =
    'rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Tag Aliases</h2>
        <p className="text-sm text-gray-400 mt-1">
          Maps misspelled or non-canonical tag names to the correct tag. Applied
          automatically on new submissions.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-2 text-gray-400 font-medium w-1/3">
                  Bad tag (rename from)
                </th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium w-1/3">
                  Canonical tag (rename to)
                </th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">
                  Added
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {aliases.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-gray-500 text-center"
                  >
                    No aliases defined.
                  </td>
                </tr>
              ) : (
                aliases.map((a) =>
                  editingId === a.id ? (
                    <tr key={a.id} className="bg-gray-700/30">
                      <td className="px-4 py-2">
                        <input
                          className={inputClass}
                          value={editBadTag}
                          onChange={(e) => setEditBadTag(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className={inputClass}
                          value={editGoodTag}
                          onChange={(e) => setEditGoodTag(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        <Time date={a.createdAt} />
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(a.id)}
                          className="text-green-400 hover:text-green-300 text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-white text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-2 text-red-300 font-mono">
                        {a.badTag}
                      </td>
                      <td className="px-4 py-2 text-green-300 font-mono">
                        {a.goodTag.name}
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        <Time date={a.createdAt} />
                      </td>
                      <td className="px-4 py-2 text-right space-x-3">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(a.id, a.badTag, a.goodTag.name)
                          }
                          className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTagAlias(a.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}

              {/* Create row */}
              <tr className="bg-gray-700/20">
                <td className="px-4 py-2">
                  <input
                    className={`${inputClass} w-full`}
                    placeholder="e.g. hip-hop"
                    value={newBadTag}
                    onChange={(e) => setNewBadTag(e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className={`${inputClass} w-full`}
                    placeholder="e.g. hip.hop"
                    value={newGoodTag}
                    onChange={(e) => setNewGoodTag(e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  Canonical tag must exist
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    disabled={creating || !newBadTag || !newGoodTag}
                    onClick={handleCreate}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    {creating ? 'Adding…' : 'Add alias'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white transition-colors"
          >
            Prev
          </button>
          <span className="text-gray-400">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TagAliasesPage;
