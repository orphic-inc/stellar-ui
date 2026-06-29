import {
  useGetEmailBlacklistQuery,
  useCreateEmailBlacklistEntryMutation,
  useDeleteEmailBlacklistEntryMutation,
  type EmailBlacklistEntry
} from '../../store/services/adminApi';
import Blacklist from './Blacklist';

const EmailBlacklistPage = () => {
  const { data: entries, isLoading } = useGetEmailBlacklistQuery();
  const [createEntry, { isLoading: isCreating }] =
    useCreateEmailBlacklistEntryMutation();
  const [deleteEntry] = useDeleteEmailBlacklistEntryMutation();

  return (
    <Blacklist<EmailBlacklistEntry>
      title="Email Blacklist"
      noun="entry"
      emptyMessage="No blacklisted emails."
      entries={entries}
      isLoading={isLoading}
      isCreating={isCreating}
      entryKey={(entry) => entry.id}
      fields={[
        {
          name: 'email',
          label: 'Email',
          required: true,
          type: 'email',
          placeholder: 'bad@example.com'
        },
        {
          name: 'comment',
          label: 'Comment',
          placeholder: 'Reason for blacklisting'
        }
      ]}
      columns={[
        {
          header: 'Email',
          cell: (entry) => entry.email,
          tdClassName: 'font-mono'
        },
        { header: 'Comment', cell: (entry) => entry.comment || '—' }
      ]}
      onCreate={(v) =>
        createEntry({ email: v.email, comment: v.comment }).unwrap()
      }
      onDelete={(entry) => deleteEntry(entry.id).unwrap()}
      messages={{
        created: 'Email blacklisted.',
        createFailed: 'Failed to add entry.',
        deleted: 'Entry removed.',
        deleteFailed: 'Failed to remove entry.'
      }}
    />
  );
};

export default EmailBlacklistPage;
