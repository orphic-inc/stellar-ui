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
    <div data-st="panel" className="p-5">
      <h3
        data-st="prose"
        data-st-strong
        className="text-sm uppercase tracking-wider mb-2"
      >
        IRC Nick
      </h3>
      <p data-st="meta" className="text-sm mb-4">
        Link a verified IRC nick. Setting a nick issues a one-time code you
        prove from that nick on IRC — it does not bind the nick until you
        verify.
      </p>
      <form onSubmit={handleLink} className="space-y-3">
        <div>
          <label
            htmlFor="irc-nick"
            data-st="meta"
            className="block text-sm mb-1"
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
            data-st="field"
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !nick.trim()}
            data-st="control"
            data-st-primary
            className="text-sm"
          >
            {isLoading ? 'Linking…' : 'Link nick'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            data-st="control"
            className="text-sm"
          >
            Clear IRC nick
          </button>
        </div>
      </form>
      {instructions && (
        <div data-st="panel" className="mt-4 p-3 text-sm text-[var(--st-text)]">
          {instructions}
        </div>
      )}
    </div>
  );
};

export default IrcNickSettings;
