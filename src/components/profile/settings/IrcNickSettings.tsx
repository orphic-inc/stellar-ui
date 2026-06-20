import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLinkIrcNickMutation } from '../../../store/services/userApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';

const IrcNickSettings = ({ userId }: { userId: number }) => {
  const dispatch = useDispatch();
  const [nick, setNick] = useState('');
  const [instructions, setInstructions] = useState<string | null>(null);
  const [linkIrcNick, { isLoading }] = useLinkIrcNickMutation();

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nick.trim();
    if (!trimmed) return;
    try {
      const result = await linkIrcNick({
        id: userId,
        ircNick: trimmed
      }).unwrap();
      setInstructions(result.instructions ?? null);
      dispatch(addAlert(result.msg, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to link IRC nick.',
          'danger'
        )
      );
    }
  };

  const handleClear = async () => {
    try {
      const result = await linkIrcNick({ id: userId, ircNick: null }).unwrap();
      setInstructions(null);
      setNick('');
      dispatch(addAlert(result.msg, 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to clear IRC nick.',
          'danger'
        )
      );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-2">
        IRC Nick
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Link a verified IRC nick. Setting a nick issues a one-time code you
        prove from that nick on IRC — it does not bind the nick until you
        verify.
      </p>
      <form onSubmit={handleLink} className="space-y-3">
        <div>
          <label
            htmlFor="irc-nick"
            className="block text-sm text-gray-300 mb-1"
          >
            IRC nick
          </label>
          <input
            id="irc-nick"
            type="text"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={30}
            placeholder="your_irc_nick"
            className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !nick.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {isLoading ? 'Linking…' : 'Link nick'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear IRC nick
          </button>
        </div>
      </form>
      {instructions && (
        <div className="mt-4 rounded border border-indigo-700/50 bg-indigo-950/30 p-3 text-sm text-indigo-200">
          {instructions}
        </div>
      )}
    </div>
  );
};

export default IrcNickSettings;
