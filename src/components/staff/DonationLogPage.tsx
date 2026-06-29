import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetDonationsQuery,
  useCreateDonationMutation,
  useDeleteDonationMutation,
  type Donation
} from '../../store/services/adminApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  PageShell,
  Panel,
  Field,
  Button,
  DataTable,
  Pagination,
  type Column
} from '../ui';

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

  const columns: Column<Donation>[] = [
    {
      header: 'User',
      cell: (d) => (d.user ? d.user.username : `#${d.userId}`)
    },
    {
      header: 'Email',
      cell: (d) => d.email,
      tdClassName: 'font-mono text-xs truncate'
    },
    {
      header: 'Amount',
      cell: (d) => (
        <span className="font-medium text-[var(--st-success)]">
          {d.amount.toFixed(2)} {d.currency}
        </span>
      )
    },
    {
      header: 'Date',
      cell: (d) => new Date(d.donatedAt).toLocaleDateString(),
      tdClassName: 'text-xs'
    },
    {
      header: '',
      tdClassName: 'text-right',
      cell: (d) => (
        <Button variant="link-danger" onClick={() => handleDelete(d.id)}>
          Remove
        </Button>
      )
    }
  ];

  return (
    <PageShell
      title="Donation Log"
      width="lg"
      actions={
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Manual entry'}
        </Button>
      }
    >
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={filterUserId}
          onChange={(e) => {
            setFilterUserId(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by user ID…"
          data-st="field"
          className="w-48"
        />
        {filterUserId && (
          <Button
            variant="link"
            onClick={() => {
              setFilterUserId('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {showForm && (
        <Panel as="form" onSubmit={handleCreate} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="don-userId"
              label="User ID"
              required
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="123"
            />
            <Field
              id="don-amount"
              label="Amount"
              required
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
            />
            <Field
              id="don-email"
              label="Donor email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="donor@example.com"
            />
            <Field
              id="don-date"
              label="Date"
              required
              type="datetime-local"
              value={donatedAt}
              onChange={(e) => setDonatedAt(e.target.value)}
            />
            <Field
              id="don-currency"
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
            />
            <Field
              id="don-source"
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="PayPal, Stripe…"
            />
            <Field
              id="don-reason"
              label="Reason"
              required
              containerClassName="col-span-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="General donation"
            />
          </div>
          <Button type="submit" variant="success" disabled={isCreating}>
            {isCreating ? 'Saving…' : 'Record donation'}
          </Button>
        </Panel>
      )}

      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        empty="No donations."
      />
      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onChange={setPage}
      />
    </PageShell>
  );
};

export default DonationLogPage;
