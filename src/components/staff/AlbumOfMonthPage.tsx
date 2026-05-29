import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetAlbumOfMonthQuery,
  useCreateAlbumOfMonthMutation,
  useDeleteAlbumOfMonthMutation
} from '../../store/services/adminApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const AlbumOfMonthPage = () => {
  const [groupId, setGroupId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [started, setStarted] = useState('');
  const [ended, setEnded] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useGetAlbumOfMonthQuery();
  const [createAlbum, { isLoading: isCreating }] =
    useCreateAlbumOfMonthMutation();
  const [deleteAlbum] = useDeleteAlbumOfMonthMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const gId = parseInt(groupId, 10);
    const tId = parseInt(threadId, 10);
    if (isNaN(gId) || gId <= 0 || isNaN(tId) || tId <= 0) {
      setFormError('Group ID and Thread ID must be positive integers.');
      return;
    }
    if (!title.trim() || !started || !ended) {
      setFormError('All fields are required.');
      return;
    }
    try {
      await createAlbum({
        groupId: gId,
        threadId: tId,
        title: title.trim(),
        image: image.trim(),
        started: new Date(started).toISOString(),
        ended: new Date(ended).toISOString()
      }).unwrap();
      setGroupId('');
      setThreadId('');
      setTitle('');
      setImage('');
      setStarted('');
      setEnded('');
    } catch {
      setFormError('Failed to create entry. Check all fields and try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Album of the Month
        </h2>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Add Entry
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Group ID"
            className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            placeholder="Thread ID"
            className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="col-span-2 rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Cover image URL (optional — overrides release image)"
            className="col-span-2 rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="aom-started" className="text-xs text-gray-400">
              Started
            </label>
            <input
              id="aom-started"
              type="datetime-local"
              value={started}
              onChange={(e) => setStarted(e.target.value)}
              className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="aom-ended" className="text-xs text-gray-400">
              Ended
            </label>
            <input
              id="aom-ended"
              type="datetime-local"
              value={ended}
              onChange={(e) => setEnded(e.target.value)}
              className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {formError && (
            <p className="col-span-2 text-red-400 text-xs">{formError}</p>
          )}
          <div className="col-span-2">
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
                <th className="text-left px-4 py-2 font-semibold">Title</th>
                <th className="text-left px-4 py-2 font-semibold">Group</th>
                <th className="text-left px-4 py-2 font-semibold">Thread</th>
                <th className="text-left px-4 py-2 font-semibold">Started</th>
                <th className="text-left px-4 py-2 font-semibold">Ended</th>
                <th className="px-4 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!data?.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No albums on record.
                  </td>
                </tr>
              ) : (
                data.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-white">{a.title}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                      {a.groupId}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                      {a.threadId}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={a.started} />
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={a.ended} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => deleteAlbum(a.id)}
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
    </div>
  );
};

export default AlbumOfMonthPage;
