import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetIpBansQuery,
  useCreateIpBanMutation,
  useDeleteIpBanMutation
} from '../../store/services/adminApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const IpBansPage = () => {
  const dispatch = useDispatch();
  const { data: bans, isLoading } = useGetIpBansQuery();
  const [createBan, { isLoading: isCreating }] = useCreateIpBanMutation();
  const [deleteBan] = useDeleteIpBanMutation();

  const [fromIp, setFromIp] = useState('');
  const [toIp, setToIp] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBan({ fromIp, toIp: toIp || undefined }).unwrap();
      dispatch(addAlert('IP ban added.', 'success'));
      setFromIp('');
      setToIp('');
      setShowForm(false);
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to add ban.', 'danger')
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBan(id).unwrap();
      dispatch(addAlert('IP ban removed.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to remove ban.', 'danger')
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">IP Address Bans</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add ban'}
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
                htmlFor="fromIp"
                className="block text-xs text-gray-400 mb-1"
              >
                From IP <span className="text-red-400">*</span>
              </label>
              <input
                id="fromIp"
                type="text"
                value={fromIp}
                onChange={(e) => setFromIp(e.target.value)}
                placeholder="192.168.1.1"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="toIp"
                className="block text-xs text-gray-400 mb-1"
              >
                To IP{' '}
                <span className="text-gray-500">(optional — for ranges)</span>
              </label>
              <input
                id="toIp"
                type="text"
                value={toIp}
                onChange={(e) => setToIp(e.target.value)}
                placeholder="192.168.1.255"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {isCreating ? 'Adding…' : 'Add ban'}
          </button>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[1fr_1fr_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>From IP</span>
          <span>To IP</span>
          <span />
        </div>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !bans?.length ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No IP bans configured.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/40">
            {bans.map((ban) => (
              <div
                key={ban.id}
                className="px-4 py-2 grid grid-cols-[1fr_1fr_auto] gap-4 items-center text-sm"
              >
                <span className="font-mono text-gray-200">{ban.fromIp}</span>
                <span className="font-mono text-gray-200">{ban.toIp}</span>
                <button
                  onClick={() => handleDelete(ban.id)}
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

export default IpBansPage;
