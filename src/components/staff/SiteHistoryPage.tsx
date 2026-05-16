import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetSiteHistoryQuery,
  useCreateSiteHistoryMutation,
  useUpdateSiteHistoryMutation,
  useDeleteSiteHistoryMutation,
  type SiteHistoryEntry
} from '../../store/services/siteHistoryApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

interface EntryModalProps {
  entry?: SiteHistoryEntry;
  onClose: () => void;
}

const EntryModal = ({ entry, onClose }: EntryModalProps) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState(entry?.title ?? '');
  const [body, setBody] = useState(entry?.body ?? '');
  const [create, { isLoading: isCreating }] = useCreateSiteHistoryMutation();
  const [update, { isLoading: isUpdating }] = useUpdateSiteHistoryMutation();

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (entry) {
        await update({ id: entry.id, title, body }).unwrap();
        dispatch(addAlert('Entry updated.', 'success'));
      } else {
        await create({ title, body }).unwrap();
        dispatch(addAlert('Entry created.', 'success'));
      }
      onClose();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to save.', 'danger')
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">
          {entry ? 'Edit Entry' : 'New Entry'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="history-title"
              className="block text-sm text-gray-300 mb-1"
            >
              Title
            </label>
            <input
              id="history-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="history-body"
              className="block text-sm text-gray-300 mb-1"
            >
              Body
            </label>
            <textarea
              id="history-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={6}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {isLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SiteHistoryPage = () => {
  const dispatch = useDispatch();
  const { data: entries, isLoading, error } = useGetSiteHistoryQuery();
  const [deleteEntry] = useDeleteSiteHistoryMutation();
  const [modalEntry, setModalEntry] = useState<
    SiteHistoryEntry | null | undefined
  >(undefined);
  // undefined = closed, null = create new, SiteHistoryEntry = edit

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteEntry(id).unwrap();
      dispatch(addAlert('Entry deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete.', 'danger')
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load site history.</div>;

  return (
    <>
      {modalEntry !== undefined && (
        <EntryModal
          entry={modalEntry ?? undefined}
          onClose={() => setModalEntry(undefined)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Site History</h2>
          <button
            onClick={() => setModalEntry(null)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            + Add Entry
          </button>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-10 text-center">
            <p className="text-gray-500 text-sm">No site history entries.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
              >
                <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-200">
                    {entry.title}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setModalEntry(entry)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {entry.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SiteHistoryPage;
