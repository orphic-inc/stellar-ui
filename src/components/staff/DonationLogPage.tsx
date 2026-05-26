import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetDonationsQuery,
  useCreateDonationMutation,
  useDeleteDonationMutation
} from '../../store/services/adminApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';

const DonationLogPage = () => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [filterUserId, setFilterUserId] = useState('');
  const { data, isLoading } = useGetDonationsQuery({
    page,
    userId: filterUserId ? Number(filterUserId) : undefined
  });
  const [createDonation, { isLoading: isCreating }] =
    useCreateDonationMutation();
  const [deleteDonation] = useDeleteDonationMutation();

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [donatedAt, setDonatedAt] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [source, setSource] = useState('');
  const [reason, setReason] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDonation({
        userId: Number(userId),
        amount: parseFloat(amount),
        email,
        donatedAt: new Date(donatedAt).toISOString(),
        currency: currency || undefined,
        source: source || undefined,
        reason
      }).unwrap();
      dispatch(addAlert('Donation recorded.', 'success'));
      setUserId('');
      setAmount('');
      setEmail('');
      setDonatedAt('');
      setCurrency('USD');
      setSource('');
      setReason('');
      setShowForm(false);
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to record donation.',
          'danger'
        )
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDonation(id).unwrap();
      dispatch(addAlert('Donation removed.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to remove donation.',
          'danger'
        )
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Donation Log</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ Manual entry'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={filterUserId}
          onChange={(e) => {
            setFilterUserId(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by user ID…"
          className="w-48 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        {filterUserId && (
          <button
            onClick={() => {
              setFilterUserId('');
              setPage(1);
            }}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="don-userId"
                className="block text-xs text-gray-400 mb-1"
              >
                User ID <span className="text-red-400">*</span>
              </label>
              <input
                id="don-userId"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="123"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="don-amount"
                className="block text-xs text-gray-400 mb-1"
              >
                Amount <span className="text-red-400">*</span>
              </label>
              <input
                id="don-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="don-email"
                className="block text-xs text-gray-400 mb-1"
              >
                Donor email <span className="text-red-400">*</span>
              </label>
              <input
                id="don-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="donor@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="don-date"
                className="block text-xs text-gray-400 mb-1"
              >
                Date <span className="text-red-400">*</span>
              </label>
              <input
                id="don-date"
                type="datetime-local"
                value={donatedAt}
                onChange={(e) => setDonatedAt(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="don-currency"
                className="block text-xs text-gray-400 mb-1"
              >
                Currency
              </label>
              <input
                id="don-currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="don-source"
                className="block text-xs text-gray-400 mb-1"
              >
                Source
              </label>
              <input
                id="don-source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="PayPal, Stripe…"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="don-reason"
                className="block text-xs text-gray-400 mb-1"
              >
                Reason <span className="text-red-400">*</span>
              </label>
              <input
                id="don-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="General donation"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {isCreating ? 'Saving…' : 'Record donation'}
          </button>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <span>User</span>
          <span>Email</span>
          <span>Amount</span>
          <span>Date</span>
          <span />
        </div>
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner />
          </div>
        ) : !data?.data.length ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No donations.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/40">
            {data.data.map((d) => (
              <div
                key={d.id}
                className="px-4 py-2 grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center text-sm"
              >
                <span className="text-gray-300">
                  {d.user ? d.user.username : `#${d.userId}`}
                </span>
                <span className="text-gray-400 font-mono text-xs truncate">
                  {d.email}
                </span>
                <span className="text-green-400 font-medium">
                  {d.amount.toFixed(2)} {d.currency}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(d.donatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded transition-colors"
          >
            Prev
          </button>
          <span className="text-gray-500">
            {page} / {data.meta.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(data.meta.totalPages, p + 1))
            }
            disabled={page === data.meta.totalPages}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DonationLogPage;
