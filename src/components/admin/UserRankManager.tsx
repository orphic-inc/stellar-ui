import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetUserRanksQuery,
  useDeleteUserRankMutation,
  type UserRankRecord
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button, DataTable, type Column } from '../ui';

const permissionCount = (rank: UserRankRecord) =>
  Object.values(
    (rank as { permissions?: Record<string, boolean> | null }).permissions ?? {}
  ).filter(Boolean).length;

const UserRankManager = () => {
  const dispatch = useDispatch();
  const { data: userRanks, isLoading, error } = useGetUserRanksQuery();
  const [deleteUserRank] = useDeleteUserRankMutation();

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this user rank?'))
      return;
    try {
      await deleteUserRank(id).unwrap();
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to remove the user rank.',
          'danger'
        )
      );
    }
  };

  const columns: Column<UserRankRecord>[] = [
    {
      header: 'Name',
      // As the profile sidebar shows the rank: badge first, in its colour (#342).
      cell: (r) => (
        <span className="font-medium" style={{ color: r.color || undefined }}>
          {r.badge ? `${r.badge} ` : ''}
          {r.name}
        </span>
      )
    },
    { header: 'Level', cell: (r) => r.level, numeric: true },
    { header: 'Type', cell: (r) => (r.secondary ? 'Secondary' : 'Primary') },
    { header: 'Users', cell: (r) => r.userCount ?? 0, numeric: true },
    { header: 'Permissions', cell: permissionCount, numeric: true },
    {
      header: 'Forum Overrides',
      cell: (r) => r.permittedForumIds?.length ?? 0,
      numeric: true
    },
    {
      header: 'Collage Limit',
      // `null` is unlimited and `0` is none (stellar-api#881).
      cell: (r) =>
        r.personalCollageLimit === null
          ? '∞'
          : r.personalCollageLimit === 0
            ? 'none'
            : r.personalCollageLimit,
      numeric: true
    },
    {
      // Rate and cap together, because neither is readable alone: a rate above
      // the cap grants nothing at all (stellar-api ADR-0039), and that is only
      // visible when the two are side by side.
      header: 'Invites',
      cell: (r) =>
        (r.inviteGrantPerPeriod ?? 0) === 0
          ? '—'
          : `${r.inviteGrantPerPeriod} / ${r.inviteCap ?? 0}`,
      numeric: true
    },
    {
      header: 'Actions',
      cell: (r) => (
        <span className="flex gap-3">
          <Link to={`/staff/tools/user-ranks/${r.id}/edit`} data-st="control">
            Edit
          </Link>
          <Button variant="link-danger" onClick={() => handleDelete(r.id)}>
            Delete
          </Button>
        </span>
      )
    }
  ];

  return (
    <PageShell
      title="User Ranks"
      width="2xl"
      actions={
        <Link
          to="/staff/tools/user-ranks/new"
          data-st="control"
          data-st-primary
          className="text-sm"
        >
          + New User Rank
        </Link>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Panel className="p-4">
          <p data-st="prose" className="text-sm text-[var(--st-danger)]">
            Failed to load user ranks.
          </p>
        </Panel>
      ) : (
        <DataTable
          columns={columns}
          rows={userRanks}
          rowKey={(r) => r.id}
          empty="No user ranks defined yet."
        />
      )}
    </PageShell>
  );
};

export default UserRankManager;
