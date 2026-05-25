import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetEmailBlacklistQuery,
  useCreateEmailBlacklistEntryMutation,
  useDeleteEmailBlacklistEntryMutation
} from '../../store/services/adminApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const EmailBlacklistPage = () => {
  const dispatch = useDispatch();
  const { data: entries, isLoading } = useGetEmailBlacklistQuery();
  const [createEntry, { isLoading: isCreating }] =
    useCreateEmailBlacklistEntryMutation();
  const [deleteEntry] = useDeleteEmailBlacklistEntryMutation();

  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEntry({ email, comment }).unwrap();
      dispatch(addAlert('Email blacklisted.', 'success'));
      setEmail('');
      setComment('');
      setShowForm(false);
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to add entry.', 'danger')
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEntry(id).unwrap();
      dispatch(addAlert('Entry removed.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to remove entry.', 'danger')
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Email Blacklist</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add entry'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="bl-email"
                className="block text-xs text-gray-400 mb-1"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="bl-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bad@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="bl-comment"
                className="block text-xs text-gray-400 mb-1"
              >
                Comment
              </label>
              <input
                id="bl-comment"
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason for blacklisting"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {isCreating ? 'Adding…' : 'Add entry'}
          </button>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[1fr_1fr_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>Email</span>
          <span>Comment</span>
          <span />
        </div>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !entries?.length ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No blacklisted emails.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/40">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-2 grid grid-cols-[1fr_1fr_auto] gap-4 items-center text-sm"
              >
                <span className="font-mono text-gray-200">{entry.email}</span>
                <span className="text-gray-400">{entry.comment || '—'}</span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailBlacklistPage;
