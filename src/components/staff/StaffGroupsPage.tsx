import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetStaffGroupsQuery,
  useCreateStaffGroupMutation,
  useUpdateStaffGroupMutation,
  useDeleteStaffGroupMutation
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  PageShell,
  Panel,
  Field,
  Button,
  DataTable,
  SectionHeading,
  type Column
} from '../ui';

interface EditState {
  id: number;
  name: string;
  sortOrder: number;
}

const StaffGroupsPage = () => {
  const dispatch = useDispatch();
  const { data: groups, isLoading } = useGetStaffGroupsQuery();
  const [createStaffGroup, { isLoading: isCreating }] =
    useCreateStaffGroupMutation();
  const [updateStaffGroup] = useUpdateStaffGroupMutation();
  const [deleteStaffGroup] = useDeleteStaffGroupMutation();

  const [newName, setNewName] = useState('');
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [editing, setEditing] = useState<EditState | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createStaffGroup({
        name: newName.trim(),
        sortOrder: newSortOrder
      }).unwrap();
      setNewName('');
      setNewSortOrder(0);
      dispatch(addAlert('Staff group created.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to create group.', 'danger')
      );
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateStaffGroup({
        id: editing.id,
        name: editing.name.trim(),
        sortOrder: editing.sortOrder
      }).unwrap();
      setEditing(null);
      dispatch(addAlert('Staff group updated.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to update group.', 'danger')
      );
    }
  };

  const handleDelete = async (id: number, rankCount: number) => {
    if (rankCount > 0) {
      dispatch(
        addAlert(
          `Cannot delete: ${rankCount} rank(s) still assigned to this group.`,
          'danger'
        )
      );
      return;
    }
    if (!confirm('Delete this staff group?')) return;
    try {
      await deleteStaffGroup(id).unwrap();
      dispatch(addAlert('Staff group deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete group.', 'danger')
      );
    }
  };

  type Group = NonNullable<typeof groups>[number];
  const columns: Column<Group>[] = [
    {
      header: 'Name',
      cell: (g) =>
        editing?.id === g.id ? (
          <input
            data-st="field"
            className="w-full"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
        ) : (
          g.name
        )
    },
    {
      header: 'Order',
      numeric: true,
      cell: (g) =>
        editing?.id === g.id ? (
          <input
            data-st="field"
            className="w-16"
            type="number"
            min={0}
            value={editing.sortOrder}
            onChange={(e) =>
              setEditing({ ...editing, sortOrder: Number(e.target.value) })
            }
          />
        ) : (
          g.sortOrder
        )
    },
    { header: 'Ranks', numeric: true, cell: (g) => g.rankCount },
    {
      header: '',
      tdClassName: 'text-right whitespace-nowrap',
      cell: (g) =>
        editing?.id === g.id ? (
          <span className="space-x-3">
            <Button variant="link" onClick={handleUpdate}>
              Save
            </Button>
            <Button variant="link" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </span>
        ) : (
          <span className="space-x-3">
            <Button
              variant="link"
              onClick={() =>
                setEditing({
                  id: g.id,
                  name: g.name,
                  sortOrder: g.sortOrder ?? 0
                })
              }
            >
              Edit
            </Button>
            <Button
              variant="link-danger"
              onClick={() => handleDelete(g.id, g.rankCount ?? 0)}
            >
              Delete
            </Button>
          </span>
        )
    }
  ];

  return (
    <PageShell title="Staff Groups" backTo="/staff/tools" width="sm">
      <section className="space-y-3">
        <SectionHeading>New Group</SectionHeading>
        <Panel
          as="form"
          onSubmit={handleCreate}
          className="p-4 flex gap-3 items-end"
        >
          <Field
            id="new-group-name"
            label="Name"
            containerClassName="flex-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Moderation"
          />
          <Field
            id="new-group-sort-order"
            label="Sort Order"
            type="number"
            min={0}
            containerClassName="w-28"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(Number(e.target.value))}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!newName.trim() || isCreating}
            className="whitespace-nowrap"
          >
            {isCreating ? 'Creating…' : 'Create'}
          </Button>
        </Panel>
      </section>

      <DataTable
        columns={columns}
        rows={groups}
        rowKey={(g) => g.id}
        isLoading={isLoading}
        empty="No staff groups yet."
        rowActive={(g) => editing?.id === g.id}
      />
    </PageShell>
  );
};

export default StaffGroupsPage;
