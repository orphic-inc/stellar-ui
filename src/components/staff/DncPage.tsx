import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetDncQuery,
  useCreateDncEntryMutation,
  useDeleteDncEntryMutation
} from '../../store/services/adminApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const DncPage = () => {
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  const { data: communities } = useGetCommunitiesQuery(1);
  const { data: dnc, isLoading } = useGetDncQuery(communityId!, {
    skip: communityId === null
  });
  const [createEntry, { isLoading: isCreating }] = useCreateDncEntryMutation();
  const [deleteEntry] = useDeleteDncEntryMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!communityId) return;
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    try {
      await createEntry({
        communityId,
        name: name.trim(),
        comment: comment.trim()
      }).unwrap();
      setName('');
      setComment('');
    } catch {
      setFormError('Failed to add entry.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Do Not Contribute List
        </h2>
      </div>

      <div className="flex gap-2 items-center">
        <label htmlFor="dnc-community" className="text-sm text-gray-400">
          Community:
        </label>
        <select
          id="dnc-community"
          value={communityId ?? ''}
          onChange={(e) =>
            setCommunityId(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select community…</option>
          {communities?.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {communityId !== null && (
        <>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Add Entry
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Artist, label, or release title"
                className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comment (optional)"
                className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <Spinner />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                    <th className="text-left px-4 py-2 font-semibold">Name</th>
                    <th className="text-left px-4 py-2 font-semibold">
                      Comment
                    </th>
                    <th className="text-left px-4 py-2 font-semibold">
                      Added By
                    </th>
                    <th className="text-left px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {!dnc?.length ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No DNC entries for this community.
                      </td>
                    </tr>
                  ) : (
                    dnc.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-4 py-2 text-white">{entry.name}</td>
                        <td
                          className="px-4 py-2 text-gray-400 text-xs max-w-xs truncate"
                          title={entry.comment}
                        >
                          {entry.comment || '—'}
                        </td>
                        <td className="px-4 py-2">
                          {entry.addedBy ? (
                            <Link
                              to={`/private/user/${entry.addedBy.id}`}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              {entry.addedBy.username}
                            </Link>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          <Time date={entry.createdAt} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() =>
                              deleteEntry({
                                communityId: communityId!,
                                dncId: entry.id
                              })
                            }
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DncPage;
