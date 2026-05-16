import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSendMassPmMutation } from '../../store/services/messagesApi';
import { useGetUserRanksQuery } from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const MassPmPage = () => {
  const dispatch = useDispatch();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetRankId, setTargetRankId] = useState<number | ''>('');
  const [lastResult, setLastResult] = useState<{ sentCount: number } | null>(
    null
  );

  const { data: userRanks, isLoading: ranksLoading } = useGetUserRanksQuery();
  const [sendMassPm, { isLoading: isSending }] = useSendMassPmMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !confirm(
        `Send this message to ${
          targetRankId ? 'users of the selected rank' : 'ALL users'
        }? This cannot be undone.`
      )
    )
      return;

    try {
      const result = await sendMassPm({
        subject,
        body,
        targetRankId: targetRankId || undefined
      }).unwrap();
      setLastResult(result);
      dispatch(
        addAlert(`Mass PM sent to ${result.sentCount} users.`, 'success')
      );
      setSubject('');
      setBody('');
      setTargetRankId('');
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to send mass PM.', 'danger')
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold text-white mb-6">Mass PM</h2>

      {lastResult && (
        <div className="mb-4 bg-green-900/30 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
          Last send: {lastResult.sentCount} messages delivered.
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Target rank{' '}
              <span className="text-gray-500">
                (leave blank to send to all)
              </span>
            </label>
            {ranksLoading ? (
              <Spinner />
            ) : (
              <select
                value={targetRankId}
                onChange={(e) =>
                  setTargetRankId(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All users</option>
                {userRanks?.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              htmlFor="masspm-subject"
              className="block text-sm text-gray-300 mb-1"
            >
              Subject
            </label>
            <input
              id="masspm-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="masspm-message"
              className="block text-sm text-gray-300 mb-1"
            >
              Message
            </label>
            <textarea
              id="masspm-message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-amber-400">
              Warning: This will send a private message to{' '}
              {targetRankId ? 'all users of the selected rank' : 'all users'}.
            </p>
            <button
              type="submit"
              disabled={isSending || !subject || !body}
              className="px-6 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSending ? 'Sending…' : 'Send Mass PM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MassPmPage;
