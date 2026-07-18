import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSendMassPmMutation } from '../../store/services/messagesApi';
import { useGetUserRanksQuery } from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Field, Button, Badge } from '../ui';

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
    <PageShell title="Mass PM" backTo="/staff/tools" width="sm">
      {lastResult && (
        <Badge variant="success" className="block w-full text-sm">
          Last send: {lastResult.sentCount} messages delivered.
        </Badge>
      )}

      <Panel as="form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="masspm-rank" data-st="meta" className="block mb-1">
            Target rank{' '}
            <span className="text-[var(--st-text-faint)]">
              (leave blank to send to all)
            </span>
          </label>
          {ranksLoading ? (
            <Spinner />
          ) : (
            <select
              id="masspm-rank"
              data-st="field"
              className="w-full"
              value={targetRankId}
              onChange={(e) =>
                setTargetRankId(e.target.value ? Number(e.target.value) : '')
              }
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

        <Field
          id="masspm-subject"
          label="Subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <div>
          <label htmlFor="masspm-message" data-st="meta" className="block mb-1">
            Message
          </label>
          <textarea
            id="masspm-message"
            data-st="field"
            className="w-full"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
          />
        </div>

        <div className="pt-2 flex items-center justify-between gap-4">
          <p className="text-xs text-[var(--st-warning)]">
            Warning: This will send a private message to{' '}
            {targetRankId ? 'all users of the selected rank' : 'all users'}.
          </p>
          <Button
            type="submit"
            variant="danger"
            disabled={isSending || !subject || !body}
          >
            {isSending ? 'Sending…' : 'Send Mass PM'}
          </Button>
        </div>
      </Panel>
    </PageShell>
  );
};

export default MassPmPage;
