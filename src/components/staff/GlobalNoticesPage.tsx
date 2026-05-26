import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetGlobalNoticesQuery,
  useCreateGlobalNoticeMutation,
  useDeleteGlobalNoticeMutation
} from '../../store/services/announcementApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const inputClass =
  'rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const GlobalNoticesPage = () => {
  const { data: globalNotices, isLoading } = useGetGlobalNoticesQuery();
  const [createGlobalNotice, { isLoading: creating }] =
    useCreateGlobalNoticeMutation();
  const [deleteGlobalNotice] = useDeleteGlobalNoticeMutation();

  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [expiry, setExpiry] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGlobalNotice({
      message,
      ...(url ? { url } : {}),
      ...(expiry ? { expiresAt: new Date(expiry).toISOString() } : {})
    });
    setMessage('');
    setUrl('');
    setExpiry('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">Global Notices</h2>
        <p className="mt-1 text-sm text-gray-400">
          Sent as notifications to all active users.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Message</th>
                <th className="text-left px-4 py-2 font-semibold">URL</th>
                <th className="text-left px-4 py-2 font-semibold">Expires</th>
                <th className="text-left px-4 py-2 font-semibold">Sent</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!globalNotices?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No notices.
                  </td>
                </tr>
              ) : (
                globalNotices.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-200">{n.message}</td>
                    <td className="px-4 py-2 text-gray-400 truncate max-w-xs">
                      {n.url ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {n.expiresAt ? (
                        <Time date={n.expiresAt} />
                      ) : (
                        <span className="text-gray-600">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      <Time date={n.createdAt} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => deleteGlobalNotice(n.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
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

        <form
          onSubmit={handleCreate}
          className="p-4 border-t border-gray-700 space-y-3"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Send Global Notice
          </h4>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (max 500 chars)"
            maxLength={500}
            required
            className={`${inputClass} w-full`}
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link URL (optional, must be absolute)"
            className={`${inputClass} w-full`}
          />
          <input
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className={`${inputClass} w-full`}
            title="Expiry (optional)"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {creating ? 'Sending…' : 'Send Notice'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GlobalNoticesPage;
