import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { addAlert } from '../../store/slices/alertSlice';
import {
  useGetRatioPolicyQuery,
  useOverrideRatioPolicyMutation
} from '../../store/services/ratioPolicyApi';

const STATUS_BADGE: Record<string, string> = {
  OK: 'bg-green-800 text-green-200',
  WATCH: 'bg-yellow-800 text-yellow-200',
  LEECH_DISABLED: 'bg-red-800 text-red-200'
};

const STATUS_OPTIONS = [
  { value: 'OK', label: 'OK — no restrictions' },
  { value: 'WATCH', label: 'WATCH — ratio watch period' },
  { value: 'LEECH_DISABLED', label: 'LEECH_DISABLED — downloads blocked' }
] as const;

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : '—';

const PolicyView = ({ userId }: { userId: number }) => {
  const dispatch = useAppDispatch();
  const { data: state, isLoading, error } = useGetRatioPolicyQuery(userId);
  const [override, { isLoading: overriding }] =
    useOverrideRatioPolicyMutation();
  const [newStatus, setNewStatus] = useState<'OK' | 'WATCH' | 'LEECH_DISABLED'>(
    'OK'
  );

  if (isLoading) return <p className="text-sm text-gray-400 mt-4">Loading…</p>;
  if (error || !state)
    return (
      <p className="text-sm text-red-400 mt-4">
        User not found or access denied.
      </p>
    );

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await override({ userId, status: newStatus }).unwrap();
      dispatch(addAlert(`Status set to ${newStatus}.`, 'success'));
    } catch {
      dispatch(addAlert('Failed to apply override.', 'danger'));
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-gray-900 border border-gray-700 rounded p-4 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Current status</span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              STATUS_BADGE[state.status] ?? 'bg-gray-700 text-gray-300'
            }`}
          >
            {state.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <span className="text-gray-500">Watch started</span>
          <span className="text-gray-300">{fmt(state.watchStartedAt)}</span>
          <span className="text-gray-500">Watch expires</span>
          <span className="text-gray-300">{fmt(state.watchExpiresAt)}</span>
          <span className="text-gray-500">Leech disabled</span>
          <span className="text-gray-300">{fmt(state.leechDisabledAt)}</span>
          <span className="text-gray-500">Last evaluated</span>
          <span className="text-gray-300">{fmt(state.lastEvaluatedAt)}</span>
        </div>
      </div>

      <form onSubmit={handleOverride} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="ratio-override-status"
            className="block text-sm text-gray-400 mb-1"
          >
            Override status
          </label>
          <select
            id="ratio-override-status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={overriding}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded disabled:opacity-50"
        >
          {overriding ? 'Applying…' : 'Apply override'}
        </button>
      </form>
    </div>
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
    <div className="thin">
      <div className="mb-4">
        <Link
          to="/private/staff/tools"
          className="text-blue-400 text-sm hover:underline"
        >
          ← Toolbox
        </Link>
      </div>

      <h2 className="text-xl font-semibold mb-4">Ratio Policy Override</h2>

      <form onSubmit={handleLookup} className="flex gap-3">
        <div className="flex-1">
          <label
            htmlFor="ratio-user-id"
            className="block text-sm text-gray-400 mb-1"
          >
            User ID
          </label>
          <input
            id="ratio-user-id"
            type="number"
            min={1}
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            required
            placeholder="e.g. 42"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="self-end px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
        >
          Load
        </button>
      </form>

      {activeUserId !== null && <PolicyView userId={activeUserId} />}
    </div>
  );
};

export default RatioPolicyPanel;
