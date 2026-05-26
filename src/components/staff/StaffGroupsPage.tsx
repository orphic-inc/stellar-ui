import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  useGetStaffGroupsQuery,
  useCreateStaffGroupMutation,
  useUpdateStaffGroupMutation,
  useDeleteStaffGroupMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

interface EditState {
  id: number;
  name: string;
  sortOrder: number;
}

const StaffGroupsPage = () => {
  const dispatch = useDispatch();
  const { data: groups, isLoading } = useGetStaffGroupsQuery();
  const [createStaffGroup, { isLoading: isCreating }] =
    useCreateStaffGroupMutation();
  const [updateStaffGroup] = useUpdateStaffGroupMutation();
  const [deleteStaffGroup] = useDeleteStaffGroupMutation();

  const [newName, setNewName] = useState('');
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [editing, setEditing] = useState<EditState | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createStaffGroup({
        name: newName.trim(),
        sortOrder: newSortOrder
      }).unwrap();
      setNewName('');
      setNewSortOrder(0);
      dispatch(addAlert('Staff group created.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to create group.', 'danger')
      );
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateStaffGroup({
        id: editing.id,
        name: editing.name.trim(),
        sortOrder: editing.sortOrder
      }).unwrap();
      setEditing(null);
      dispatch(addAlert('Staff group updated.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to update group.', 'danger')
      );
    }
  };

  const handleDelete = async (id: number, rankCount: number) => {
    if (rankCount > 0) {
      dispatch(
        addAlert(
          `Cannot delete: ${rankCount} rank(s) still assigned to this group.`,
          'danger'
        )
      );
      return;
    }
    if (!confirm('Delete this staff group?')) return;
    try {
      await deleteStaffGroup(id).unwrap();
      dispatch(addAlert('Staff group deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete group.', 'danger')
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex gap-3 text-sm mb-2">
            <Link
              to="/private/staff/tools"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Toolbox
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-white">Staff Groups</h2>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            New Group
          </h3>
        </div>
        <form onSubmit={handleCreate} className="p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="new-group-name"
              className="block text-xs text-gray-400 mb-1"
            >
              Name
            </label>
            <input
              id="new-group-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Moderation"
              className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-28">
            <label
              htmlFor="new-group-sort-order"
              className="block text-xs text-gray-400 mb-1"
            >
              Sort Order
            </label>
            <input
              id="new-group-sort-order"
              type="number"
              min={0}
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(Number(e.target.value))}
              className="w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newName.trim() || isCreating}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded transition-colors whitespace-nowrap"
          >
            {isCreating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {/* Group list */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[2fr_auto_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>Name</span>
          <span>Order</span>
          <span>Ranks</span>
          <span />
        </div>

        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !groups?.length ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No staff groups yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/40">
            {groups.map((group) =>
              editing?.id === group.id ? (
                <form
                  key={group.id}
                  onSubmit={handleUpdate}
                  className="px-4 py-2 grid grid-cols-[2fr_auto_auto_auto] gap-4 items-center text-sm"
                >
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    className="rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={editing.sortOrder}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sortOrder: Number(e.target.value)
                      })
                    }
                    className="w-16 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500 text-xs text-right">
                    {group.rankCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  key={group.id}
                  className="px-4 py-2 grid grid-cols-[2fr_auto_auto_auto] gap-4 items-center text-sm"
                >
                  <span className="text-gray-200">{group.name}</span>
                  <span className="text-gray-500 text-xs">
                    {group.sortOrder}
                  </span>
                  <span className="text-gray-500 text-xs text-right">
                    {group.rankCount}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setEditing({
                          id: group.id,
                          name: group.name,
                          sortOrder: group.sortOrder ?? 0
                        })
                      }
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(group.id, group.rankCount ?? 0)
                      }
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffGroupsPage;
