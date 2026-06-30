import { useState } from 'react';
import {
  useGetAlbumOfMonthQuery,
  useCreateAlbumOfMonthMutation,
  useDeleteAlbumOfMonthMutation
} from '../../store/services/adminApi';
import Time from '../layout/Time';
import {
  PageShell,
  Panel,
  Button,
  DataTable,
  SectionHeading,
  type Column
} from '../ui';

const AlbumOfMonthPage = () => {
  const [groupId, setGroupId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [started, setStarted] = useState('');
  const [ended, setEnded] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useGetAlbumOfMonthQuery();
  const [createAlbum, { isLoading: isCreating }] =
    useCreateAlbumOfMonthMutation();
  const [deleteAlbum] = useDeleteAlbumOfMonthMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const gId = parseInt(groupId, 10);
    const tId = parseInt(threadId, 10);
    if (isNaN(gId) || gId <= 0 || isNaN(tId) || tId <= 0) {
      setFormError('Group ID and Thread ID must be positive integers.');
      return;
    }
    if (!title.trim() || !started || !ended) {
      setFormError('All fields are required.');
      return;
    }
    try {
      await createAlbum({
        groupId: gId,
        threadId: tId,
        title: title.trim(),
        image: image.trim(),
        started: new Date(started).toISOString(),
        ended: new Date(ended).toISOString()
      }).unwrap();
      setGroupId('');
      setThreadId('');
      setTitle('');
      setImage('');
      setStarted('');
      setEnded('');
    } catch {
      setFormError('Failed to create entry. Check all fields and try again.');
    }
  };

  type Album = NonNullable<typeof data>[number];
  const columns: Column<Album>[] = [
    { header: 'Title', cell: (a) => a.title },
    {
      header: 'Group',
      tdClassName: 'font-mono text-xs',
      cell: (a) => a.groupId
    },
    {
      header: 'Thread',
      tdClassName: 'font-mono text-xs',
      cell: (a) => a.threadId
    },
    {
      header: 'Started',
      tdClassName: 'text-xs',
      cell: (a) => <Time date={a.started} />
    },
    {
      header: 'Ended',
      tdClassName: 'text-xs',
      cell: (a) => <Time date={a.ended} />
    },
    {
      header: '',
      tdClassName: 'text-right',
      cell: (a) => (
        <Button variant="link-danger" onClick={() => deleteAlbum(a.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <PageShell
      title="Album of the Month"
      backTo="/private/staff/tools"
      width="xl"
    >
      <Panel as="form" onSubmit={handleSubmit} className="p-4 space-y-3">
        <SectionHeading>Add Entry</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            data-st="field"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Group ID"
          />
          <input
            type="number"
            data-st="field"
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            placeholder="Thread ID"
          />
          <input
            type="text"
            data-st="field"
            className="col-span-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <input
            type="url"
            data-st="field"
            className="col-span-2"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Cover image URL (optional — overrides release image)"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="aom-started" data-st="meta" className="text-xs">
              Started
            </label>
            <input
              id="aom-started"
              type="datetime-local"
              data-st="field"
              value={started}
              onChange={(e) => setStarted(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="aom-ended" data-st="meta" className="text-xs">
              Ended
            </label>
            <input
              id="aom-ended"
              type="datetime-local"
              data-st="field"
              value={ended}
              onChange={(e) => setEnded(e.target.value)}
            />
          </div>
          {formError && (
            <p className="col-span-2 text-xs text-[var(--st-danger)]">
              {formError}
            </p>
          )}
          <div className="col-span-2">
            <Button type="submit" variant="primary" disabled={isCreating}>
              Add
            </Button>
          </div>
        </div>
      </Panel>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        empty="No albums on record."
      />
    </PageShell>
  );
};

export default AlbumOfMonthPage;
