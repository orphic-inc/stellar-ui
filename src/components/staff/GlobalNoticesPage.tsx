import { useState } from 'react';
import {
  useGetGlobalNoticesQuery,
  useCreateGlobalNoticeMutation,
  useDeleteGlobalNoticeMutation
} from '../../store/services/announcementApi';
import Time from '../layout/Time';
import {
  PageShell,
  Panel,
  Button,
  DataTable,
  SectionHeading,
  type Column
} from '../ui';

const GlobalNoticesPage = () => {
  const { data: globalNotices, isLoading } = useGetGlobalNoticesQuery();
  const [createGlobalNotice, { isLoading: creating }] =
    useCreateGlobalNoticeMutation();
  const [deleteGlobalNotice] = useDeleteGlobalNoticeMutation();

  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [expiry, setExpiry] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGlobalNotice({
      message,
      ...(url ? { url } : {}),
      ...(expiry ? { expiresAt: new Date(expiry).toISOString() } : {})
    });
    setMessage('');
    setUrl('');
    setExpiry('');
  };

  type Notice = NonNullable<typeof globalNotices>[number];
  const columns: Column<Notice>[] = [
    { header: 'Message', cell: (n) => n.message },
    {
      header: 'URL',
      tdClassName: 'truncate max-w-xs',
      cell: (n) => n.url ?? '—'
    },
    {
      header: 'Expires',
      cell: (n) =>
        n.expiresAt ? (
          <Time date={n.expiresAt} />
        ) : (
          <span className="text-[var(--st-text-faint)]">Never</span>
        )
    },
    { header: 'Sent', cell: (n) => <Time date={n.createdAt} /> },
    {
      header: '',
      tdClassName: 'text-right',
      cell: (n) => (
        <Button variant="link-danger" onClick={() => deleteGlobalNotice(n.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <PageShell title="Global Notices" backTo="/private/staff/tools" width="lg">
      <p data-st="meta" className="text-sm">
        Sent as notifications to all active users.
      </p>

      <DataTable
        columns={columns}
        rows={globalNotices}
        rowKey={(n) => n.id}
        isLoading={isLoading}
        empty="No notices."
      />

      <Panel as="form" onSubmit={handleCreate} className="p-4 space-y-3">
        <SectionHeading>Send Global Notice</SectionHeading>
        <input
          type="text"
          data-st="field"
          className="w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message (max 500 chars)"
          maxLength={500}
          required
        />
        <input
          type="url"
          data-st="field"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link URL (optional, must be absolute)"
        />
        <input
          type="datetime-local"
          data-st="field"
          className="w-full"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          title="Expiry (optional)"
        />
        <Button type="submit" variant="warning" disabled={creating}>
          {creating ? 'Sending…' : 'Send Notice'}
        </Button>
      </Panel>
    </PageShell>
  );
};

export default GlobalNoticesPage;
