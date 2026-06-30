import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetDncQuery,
  useCreateDncEntryMutation,
  useDeleteDncEntryMutation
} from '../../store/services/adminApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import Time from '../layout/Time';
import {
  PageShell,
  Panel,
  Button,
  DataTable,
  SectionHeading,
  type Column
} from '../ui';

type DncEntry = {
  id: number;
  name: string;
  comment?: string | null;
  addedBy?: { id: number; username: string } | null;
  createdAt: string;
};

const DncPage = () => {
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  const { data: communities } = useGetCommunitiesQuery(1);
  const { data: dnc, isLoading } = useGetDncQuery(communityId!, {
    skip: communityId === null
  });
  const [createEntry, { isLoading: isCreating }] = useCreateDncEntryMutation();
  const [deleteEntry] = useDeleteDncEntryMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!communityId) return;
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    try {
      await createEntry({
        communityId,
        name: name.trim(),
        comment: comment.trim()
      }).unwrap();
      setName('');
      setComment('');
    } catch {
      setFormError('Failed to add entry.');
    }
  };

  const columns: Column<DncEntry>[] = [
    { header: 'Name', cell: (entry) => entry.name },
    {
      header: 'Comment',
      tdClassName: 'max-w-xs truncate',
      cell: (entry) => (
        <span className="text-xs" title={entry.comment ?? undefined}>
          {entry.comment || '—'}
        </span>
      )
    },
    {
      header: 'Added By',
      cell: (entry) =>
        entry.addedBy ? (
          <Link to={`/private/user/${entry.addedBy.id}`} data-st="control">
            {entry.addedBy.username}
          </Link>
        ) : (
          <span className="text-[var(--st-text-faint)]">—</span>
        )
    },
    {
      header: 'Date',
      cell: (entry) => (
        <span className="text-xs">
          <Time date={entry.createdAt} />
        </span>
      )
    },
    {
      header: '',
      tdClassName: 'text-right',
      cell: (entry) => (
        <Button
          variant="link-danger"
          onClick={() =>
            deleteEntry({ communityId: communityId!, dncId: entry.id })
          }
        >
          Delete
        </Button>
      )
    }
  ];

  return (
    <PageShell title="Do Not Contribute List" width="lg">
      <div className="flex gap-2 items-center">
        <label htmlFor="dnc-community" data-st="meta">
          Community:
        </label>
        <select
          id="dnc-community"
          data-st="field"
          value={communityId ?? ''}
          onChange={(e) =>
            setCommunityId(e.target.value ? Number(e.target.value) : null)
          }
          className="w-auto"
        >
          <option value="">Select community…</option>
          {communities?.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {communityId !== null && (
        <>
          <section className="space-y-3">
            <SectionHeading>Add Entry</SectionHeading>
            <Panel
              as="form"
              onSubmit={handleSubmit}
              className="p-4 flex flex-col gap-2"
            >
              <input
                data-st="field"
                className="w-full"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Artist, label, or release title"
              />
              <input
                data-st="field"
                className="w-full"
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comment (optional)"
              />
              {formError && (
                <p className="text-xs text-[var(--st-danger)]">{formError}</p>
              )}
              <div>
                <Button variant="primary" type="submit" disabled={isCreating}>
                  Add
                </Button>
              </div>
            </Panel>
          </section>

          <DataTable
            columns={columns}
            rows={dnc as DncEntry[] | undefined}
            rowKey={(entry) => entry.id}
            isLoading={isLoading}
            empty="No DNC entries for this community."
          />
        </>
      )}
    </PageShell>
  );
};

export default DncPage;
