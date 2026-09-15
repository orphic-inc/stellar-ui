import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import {
  useGetRatioPolicyQuery,
  useOverrideRatioPolicyMutation
} from '../../store/services/ratioPolicyApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { PageShell, Panel, Field, Button, Badge } from '../ui';
import type { BadgeVariant } from '../ui';

type PolicyStatus = 'OK' | 'WATCH' | 'DOWNLOAD_DISABLED';

const STATUS_LABEL: Record<PolicyStatus, string> = {
  OK: 'OK',
  WATCH: 'Ratio watch',
  DOWNLOAD_DISABLED: 'Downloads disabled'
};

const STATUS_BADGE: Record<PolicyStatus, BadgeVariant> = {
  OK: 'success',
  WATCH: 'warning',
  DOWNLOAD_DISABLED: 'danger'
};

// What each override does (stellar-api#646, ADR-0044). The disable line is the
// one that matters: a staff disable does not lift itself, so it cannot be used
// as a nudge that clears when the ratio recovers.
const STATUS_EFFECT: Record<PolicyStatus, string> = {
  OK: 'Clears any watch or disable. Automatic ratio rules resume.',
  WATCH:
    'Starts a 14-day watch. Downloading 10 GiB or more during it disables downloads.',
  DOWNLOAD_DISABLED:
    'Disables downloads until staff lift it. The ratio sweep will not.'
};

const CAUSE_TEXT: Record<'RATIO' | 'STAFF', string> = {
  RATIO: 'Ratio — lifts automatically once the ratio recovers (checked daily)',
  STAFF: 'Staff — only staff can lift it'
};

const isPolicyStatus = (s: string): s is PolicyStatus => s in STATUS_LABEL;

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : '—';

const PolicyView = ({ userId }: { userId: number }) => {
  const dispatch = useAppDispatch();
  const { data: state, isLoading, error } = useGetRatioPolicyQuery(userId);
  const [override, { isLoading: overriding }] =
    useOverrideRatioPolicyMutation();
  const [newStatus, setNewStatus] = useState<PolicyStatus>('OK');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  if (isLoading)
    return (
      <p data-st="meta" className="text-sm">
        Loading…
      </p>
    );
  if (error || !state)
    return (
      <p className="text-sm text-[var(--st-danger)]">
        User not found or access denied.
      </p>
    );

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    // The api trims and rejects a blank reason; refuse it here first so a
    // whitespace-only reason costs no round trip.
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      dispatch(addAlert('A reason is required.', 'danger'));
      return;
    }
    const trimmedMessage = message.trim();
    try {
      await override({
        userId,
        status: newStatus,
        reason: trimmedReason,
        ...(trimmedMessage ? { message: trimmedMessage } : {})
      }).unwrap();
      dispatch(
        addAlert(`Status set to ${STATUS_LABEL[newStatus]}.`, 'success')
      );
      setReason('');
      setMessage('');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to apply override.',
          'danger'
        )
      );
    }
  };

  const status: string = state.status;
  const known = isPolicyStatus(status);

  return (
    <>
      <Panel className="p-4 space-y-2">
        <div className="flex items-center gap-3">
          <span data-st="meta" className="text-sm">
            Current status
          </span>
          <Badge variant={known ? STATUS_BADGE[status] : 'default'}>
            {known ? STATUS_LABEL[status] : status}
          </Badge>
        </div>
        {status === 'DOWNLOAD_DISABLED' && state.disabledCause && (
          <p data-st="prose" className="text-sm">
            Cause: {CAUSE_TEXT[state.disabledCause]}
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <span data-st="meta">Watch started</span>
          <span data-st="prose">{fmt(state.watchStartedAt)}</span>
          <span data-st="meta">Watch expires</span>
          <span data-st="prose">{fmt(state.watchExpiresAt)}</span>
          <span data-st="meta">Download disabled</span>
          <span data-st="prose">{fmt(state.downloadDisabledAt)}</span>
          <span data-st="meta">Last evaluated</span>
          <span data-st="prose">{fmt(state.lastEvaluatedAt)}</span>
        </div>
      </Panel>

      <Panel as="form" onSubmit={handleOverride} className="p-4 space-y-3">
        <div>
          <label
            htmlFor="ratio-override-status"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Override status
          </label>
          <select
            id="ratio-override-status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as PolicyStatus)}
            data-st="field"
            className="w-full"
          >
            {(Object.keys(STATUS_LABEL) as PolicyStatus[]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
          <p data-st="meta" className="text-xs mt-1">
            {STATUS_EFFECT[newStatus]}
          </p>
        </div>
        <div>
          <label
            htmlFor="ratio-override-reason"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Reason
            <span className="text-[var(--st-danger)]"> *</span>
            <span className="text-[var(--st-text-faint)]">
              {' '}
              Staff only, recorded in the audit log.
            </span>
          </label>
          <textarea
            id="ratio-override-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={2}
            data-st="field"
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="ratio-override-message"
            data-st="meta"
            className="block text-xs mb-1"
          >
            Message to member
            <span className="text-[var(--st-text-faint)]">
              {' '}
              Sent to the member as a System PM. Leave blank and the member is
              not notified.
            </span>
          </label>
          <textarea
            id="ratio-override-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            data-st="field"
            className="w-full"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={overriding}>
            {overriding ? 'Applying…' : 'Apply override'}
          </Button>
        </div>
      </Panel>
    </>
  );
};

const RatioPolicyPanel = () => {
  const [inputId, setInputId] = useState('');
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputId, 10);
    if (id > 0) setActiveUserId(id);
  };

  return (
    <PageShell title="Ratio Policy Override">
      <form onSubmit={handleLookup} className="flex items-end gap-3">
        <Field
          id="ratio-user-id"
          label="User ID"
          type="number"
          min={1}
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          required
          placeholder="e.g. 42"
          containerClassName="flex-1"
        />
        <Button type="submit">Load</Button>
      </form>

      {activeUserId !== null && <PolicyView userId={activeUserId} />}
    </PageShell>
  );
};

export default RatioPolicyPanel;
