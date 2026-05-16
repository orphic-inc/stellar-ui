import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetDonorRanksQuery,
  useCreateDonorRankMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const DonorRanksPage = () => {
  const dispatch = useDispatch();
  const { data: ranks, isLoading, error } = useGetDonorRanksQuery();
  const [createRank, { isLoading: isCreating }] = useCreateDonorRankMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    minDonation: '',
    badge: '',
    expiresAfterDays: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRank({
        name: form.name,
        minDonation: Number(form.minDonation),
        badge: form.badge || undefined,
        expiresAfterDays: form.expiresAfterDays
          ? Number(form.expiresAfterDays)
          : undefined
      }).unwrap();
      dispatch(addAlert('Donor rank created.', 'success'));
      setForm({ name: '', minDonation: '', badge: '', expiresAfterDays: '' });
      setShowForm(false);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to create donor rank.',
          'danger'
        )
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return <div className="p-4 text-red-400">Failed to load donor ranks.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Donor Ranks</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create Rank'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">
            New Donor Rank
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="donor-rank-name"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Name
                </label>
                <input
                  id="donor-rank-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-min-donation"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Min Donation ($)
                </label>
                <input
                  id="donor-rank-min-donation"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minDonation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minDonation: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-badge"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Badge (emoji/text)
                </label>
                <input
                  id="donor-rank-badge"
                  type="text"
                  value={form.badge}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, badge: e.target.value }))
                  }
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="donor-rank-expires"
                  className="block text-xs text-gray-400 mb-1"
                >
                  Expires after (days, optional)
                </label>
                <input
                  id="donor-rank-expires"
                  type="number"
                  min={0}
                  value={form.expiresAfterDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expiresAfterDays: e.target.value
                    }))
                  }
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {isCreating ? 'Creating…' : 'Create Rank'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!ranks || ranks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-10 text-center">
          <p className="text-gray-500 text-sm">No donor ranks defined yet.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400 text-xs">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Min Donation</th>
                <th className="px-4 py-3 font-medium">Badge</th>
                <th className="px-4 py-3 font-medium">Expires After</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((rank) => (
                <tr
                  key={rank.id}
                  className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-200">{rank.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    ${rank.minDonation}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {rank.badge ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {rank.expiresAfterDays != null
                      ? `${rank.expiresAfterDays} days`
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonorRanksPage;
