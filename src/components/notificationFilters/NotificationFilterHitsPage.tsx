import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import {
  useCatchUpNotificationFilterHitsMutation,
  useClearReadNotificationFilterHitsMutation,
  useGetNotificationFilterHitsQuery,
  useGetNotificationFiltersQuery,
  useMarkNotificationFilterHitReadMutation,
  useRemoveNotificationFilterHitMutation,
  type NotificationFilterHit
} from '../../store/services/notificationFilterApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { bitrateLabel } from '../../utils/edition';
import Spinner from '../layout/Spinner';
import Button from '../ui/Button';
import PageShell from '../ui/PageShell';
import Pagination from '../ui/Pagination';
import Panel from '../ui/Panel';

const releasePath = ({ release }: NotificationFilterHit['contribution']) =>
  release.communityId
    ? `/communities/${release.communityId}/releases/${release.id}`
    : null;

const ViewTabs = () => {
  const { data } = useGetNotificationFiltersQuery();
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm border-b-2 ${
      isActive
        ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
        : 'border-transparent text-[var(--st-text-muted)] hover:text-[var(--st-text)]'
    }`;

  return (
    <nav aria-label="Filters" className="flex flex-wrap gap-0.5 mb-4">
      <NavLink to="/notification-filters/hits" end className={tabClass}>
        All filters
      </NavLink>
      {(data?.filters ?? []).map((filter) => (
        <NavLink
          key={filter.id}
          to={`/notification-filters/${filter.id}/hits`}
          className={tabClass}
        >
          {filter.label}
        </NavLink>
      ))}
    </nav>
  );
};

const HitRow = ({
  hit,
  filterId,
  onOpen,
  onRemove
}: {
  hit: NotificationFilterHit;
  filterId?: number;
  onOpen: () => void;
  onRemove: () => void;
}) => {
  const { contribution } = hit;
  const path = releasePath(contribution);
  const title = `${contribution.release.title} (${contribution.release.year})`;

  return (
    <li
      data-st="row"
      data-st-open={hit.read ? undefined : ''}
      className="items-start"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        {path ? (
          <Link
            to={path}
            onClick={onOpen}
            data-st="control"
            data-st-strong={hit.read ? undefined : ''}
            className="text-sm"
          >
            {title}
          </Link>
        ) : (
          <span data-st="prose" className="text-sm">
            {title}
          </span>
        )}
        <p data-st="meta" className="text-xs">
          {contribution.type}
          {contribution.bitrate && ` · ${bitrateLabel(contribution.bitrate)}`}
          {' · '}
          uploaded by {contribution.uploader.username} ·{' '}
          {new Date(hit.matchedAt).toLocaleString()}
        </p>
        {filterId === undefined && (
          <p data-st="meta" className="text-xs">
            Matched by{' '}
            {hit.filters.map((filter, i) => (
              <span key={filter.id}>
                {i > 0 && ', '}
                <Link to={`/notification-filters/${filter.id}/hits`}>
                  {filter.label}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
      <Button
        variant="link-danger"
        className="text-xs"
        onClick={onRemove}
        aria-label={`Remove ${title}`}
      >
        Remove
      </Button>
    </li>
  );
};

/**
 * Writes against the hits in view. `filterId` scopes each one to that
 * filter's rows; omitted, it spans every filter, as the combined view does.
 */
const useHitActions = (filterId?: number) => {
  const dispatch = useAppDispatch();
  const [markRead] = useMarkNotificationFilterHitReadMutation();
  const [remove] = useRemoveNotificationFilterHitMutation();
  const [catchUp, { isLoading: isCatchingUp }] =
    useCatchUpNotificationFilterHitsMutation();
  const [clearRead, { isLoading: isClearing }] =
    useClearReadNotificationFilterHitsMutation();

  const run = async (write: { unwrap: () => Promise<void> }, what: string) => {
    try {
      await write.unwrap();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? `Failed to ${what}.`, 'danger')
      );
    }
  };

  return {
    // Opening a hit is what reads it; loading the page reads nothing.
    open: (hit: NotificationFilterHit) => {
      if (!hit.read) markRead({ contributionId: hit.contributionId, filterId });
    },
    remove: (hit: NotificationFilterHit) =>
      run(
        remove({ contributionId: hit.contributionId, filterId }),
        'remove it'
      ),
    catchUp: () => run(catchUp({ filterId }), 'catch up'),
    clearRead: () => run(clearRead({ filterId }), 'clear read matches'),
    isBusy: isCatchingUp || isClearing
  };
};

// Both act on the view in front of the member: every filter, or this one.
const BulkActions = ({
  actions
}: {
  actions: ReturnType<typeof useHitActions>;
}) => (
  <div className="flex justify-end gap-4 mb-2">
    <Button
      variant="link"
      className="text-xs"
      onClick={actions.catchUp}
      disabled={actions.isBusy}
    >
      Catch up
    </Button>
    <Button
      variant="link-danger"
      className="text-xs"
      onClick={actions.clearRead}
      disabled={actions.isBusy}
    >
      Clear read
    </Button>
  </div>
);

const HitsView = ({ filterId }: { filterId?: number }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetNotificationFilterHitsQuery({
    page,
    filterId
  });
  const actions = useHitActions(filterId);

  if (isLoading) return <Spinner />;
  if (error || !data)
    return (
      <p data-st="prose" className="text-sm text-[var(--st-danger)]">
        {getApiErrorMessage(error) ?? 'Failed to load your matches.'}
      </p>
    );

  return (
    <>
      <BulkActions actions={actions} />
      {data.data.length === 0 ? (
        <p data-st="prose" data-st-muted className="text-sm">
          Nothing matched yet.
        </p>
      ) : (
        <Panel className="overflow-hidden">
          <ul data-st="list">
            {data.data.map((hit) => (
              <HitRow
                key={hit.contributionId}
                hit={hit}
                filterId={filterId}
                onOpen={() => actions.open(hit)}
                onRemove={() => actions.remove(hit)}
              />
            ))}
          </ul>
        </Panel>
      )}
      <Pagination
        page={page}
        totalPages={data.meta?.totalPages ?? 1}
        onChange={setPage}
        className="mt-4"
      />
    </>
  );
};

/**
 * New contributions the member's filters caught (#370): every filter's in one
 * list, each contribution once, or one filter's at `/:filterId/hits`.
 */
const NotificationFilterHitsPage = () => {
  const { filterId: param } = useParams<{ filterId?: string }>();
  const filterId = param ? Number(param) : undefined;

  return (
    <PageShell
      title="Filter matches"
      backTo={null}
      width="xl"
      actions={
        <Link to="/notification-filters" data-st="control" className="text-sm">
          Manage filters
        </Link>
      }
    >
      <ViewTabs />
      <HitsView key={param ?? 'all'} filterId={filterId} />
    </PageShell>
  );
};

export default NotificationFilterHitsPage;
