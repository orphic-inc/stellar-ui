import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import {
  useCreateNotificationFilterMutation,
  useDeleteNotificationFilterMutation,
  useGetNotificationFiltersQuery,
  useUpdateNotificationFilterMutation,
  type NotificationFilter,
  type NotificationFilterInput
} from '../../store/services/notificationFilterApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import Button from '../ui/Button';
import PageShell from '../ui/PageShell';
import Panel from '../ui/Panel';
import NotificationFilterForm from './NotificationFilterForm';
import { summarizeFilter } from './filterOptions';

/** `null` is the create form; a number is the filter being edited. */
type Editing = null | 'new' | number;

const allowanceText = (used: number, limit: number | null) =>
  limit === null
    ? `${used} filter${used === 1 ? '' : 's'}, no limit`
    : `${used} of ${limit} filter${limit === 1 ? '' : 's'} used`;

const FilterRow = ({
  filter,
  communityName,
  onEdit,
  onDelete
}: {
  filter: NotificationFilter;
  communityName: (id: number) => string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <li data-st="row" className="items-start">
    <div className="flex-1 min-w-0 space-y-1">
      <span data-st="prose" data-st-strong className="text-sm">
        {filter.label}
      </span>
      <ul className="space-y-0.5">
        {summarizeFilter(filter, communityName).map((line) => (
          <li key={line} data-st="meta" className="text-xs">
            {line}
          </li>
        ))}
      </ul>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <Link
        to={`/notification-filters/${filter.id}/hits`}
        aria-label={`Matches for ${filter.label}`}
        data-st="control"
        className="text-xs"
      >
        Matches
      </Link>
      <Button
        variant="link"
        className="text-xs"
        aria-label={`Edit ${filter.label}`}
        onClick={onEdit}
      >
        Edit
      </Button>
      <Button
        variant="link-danger"
        className="text-xs"
        aria-label={`Delete ${filter.label}`}
        onClick={onDelete}
      >
        Delete
      </Button>
    </div>
  </li>
);

const useFilterWrites = (close: () => void) => {
  const dispatch = useAppDispatch();
  const [create, { isLoading: isCreating }] =
    useCreateNotificationFilterMutation();
  const [update, { isLoading: isUpdating }] =
    useUpdateNotificationFilterMutation();
  const [remove] = useDeleteNotificationFilterMutation();

  const fail = (err: unknown, fallback: string) =>
    dispatch(addAlert(getApiErrorMessage(err) ?? fallback, 'danger'));

  const save = async (input: NotificationFilterInput, id?: number) => {
    try {
      await (id ? update({ id, ...input }) : create(input)).unwrap();
      dispatch(addAlert(id ? 'Filter saved.' : 'Filter created.', 'success'));
      close();
    } catch (err) {
      fail(err, 'Failed to save the filter.');
    }
  };

  // Its hits go with it, so the member confirms first.
  const confirmDelete = async (filter: NotificationFilter) => {
    if (
      !window.confirm(
        `Delete "${filter.label}"? Everything it has matched is removed too.`
      )
    )
      return;
    try {
      await remove(filter.id).unwrap();
      close();
    } catch (err) {
      fail(err, 'Failed to delete the filter.');
    }
  };

  return { save, confirmDelete, isSaving: isCreating || isUpdating };
};

const FilterList = ({
  filters,
  onEdit,
  onDelete
}: {
  filters: NotificationFilter[];
  onEdit: (filter: NotificationFilter) => void;
  onDelete: (filter: NotificationFilter) => void;
}) => {
  const { data: communities } = useGetCommunitiesQuery(1);
  const communityName = (id: number) =>
    communities?.data.find((c) => c.id === id)?.name;

  if (filters.length === 0)
    return (
      <p data-st="prose" data-st-muted className="text-sm">
        You have no filters yet.
      </p>
    );
  return (
    <Panel className="overflow-hidden">
      <ul data-st="list">
        {filters.map((filter) => (
          <FilterRow
            key={filter.id}
            filter={filter}
            communityName={communityName}
            onEdit={() => onEdit(filter)}
            onDelete={() => onDelete(filter)}
          />
        ))}
      </ul>
    </Panel>
  );
};

const PageActions = ({
  canCreate,
  onCreate
}: {
  canCreate: boolean;
  onCreate: () => void;
}) => (
  <>
    <Link to="/notification-filters/hits" data-st="control" className="text-sm">
      All matches
    </Link>
    <Button onClick={onCreate} disabled={!canCreate}>
      New filter
    </Button>
  </>
);

/**
 * The member's contribution notification filters (#370, stellar-api#263):
 * list, create, edit and delete, within the rank's allowance.
 */
const NotificationFiltersPage = () => {
  const [editing, setEditing] = useState<Editing>(null);
  const { data, isLoading, error } = useGetNotificationFiltersQuery();
  const { save, confirmDelete, isSaving } = useFilterWrites(() =>
    setEditing(null)
  );

  if (isLoading) return <Spinner />;
  if (error || !data)
    return (
      <PageShell title="Notification filters" backTo={null}>
        <p data-st="prose" className="text-sm text-[var(--st-danger)]">
          {getApiErrorMessage(error) ?? 'Failed to load your filters.'}
        </p>
      </PageShell>
    );

  const { filters, limit } = data;
  const atLimit = limit !== null && filters.length >= limit;
  const editedFilter = filters.find((f) => f.id === editing);

  return (
    <PageShell
      title="Notification filters"
      backTo={null}
      width="xl"
      actions={
        <PageActions
          canCreate={!atLimit && editing === null}
          onCreate={() => setEditing('new')}
        />
      }
    >
      <p data-st="meta" className="text-sm mb-4">
        {allowanceText(filters.length, limit)}. You are notified when a new
        contribution matches every criterion a filter sets.
      </p>

      {editing !== null && (
        <div className="mb-4">
          <NotificationFilterForm
            key={editing}
            filter={editedFilter}
            isSaving={isSaving}
            onSubmit={(input) => save(input, editedFilter?.id)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <FilterList
        filters={filters}
        onEdit={(filter) => setEditing(filter.id)}
        onDelete={confirmDelete}
      />
    </PageShell>
  );
};

export default NotificationFiltersPage;
