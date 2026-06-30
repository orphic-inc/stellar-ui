import { Link } from 'react-router-dom';
import {
  useGetUserRanksQuery,
  useDeleteUserRankMutation,
  type UserRankRecord
} from '../../store/services/userApi';
import Spinner from '../layout/Spinner';
import { PageShell, Panel, Button, DataTable, type Column } from '../ui';

const permissionCount = (rank: UserRankRecord) =>
  Object.values(
    (rank as { permissions?: Record<string, boolean> | null }).permissions ?? {}
  ).filter(Boolean).length;

const UserRankManager = () => {
  const { data: userRanks, isLoading, error } = useGetUserRanksQuery();
  const [deleteUserRank] = useDeleteUserRankMutation();

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this user rank?')) {
      await deleteUserRank(id);
    }
  };

  const columns: Column<UserRankRecord>[] = [
    {
      header: 'Name',
      cell: (r) => <span className="font-medium">{r.name}</span>
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
      cell: (r) =>
        r.personalCollageLimit === 0 ? '∞' : (r.personalCollageLimit ?? '∞'),
      numeric: true
    },
    {
      header: 'Actions',
      cell: (r) => (
        <span className="flex gap-3">
          <Link
            to={`/private/staff/tools/user-ranks/${r.id}/edit`}
            data-st="control"
          >
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
          to="/private/staff/tools/user-ranks/new"
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
