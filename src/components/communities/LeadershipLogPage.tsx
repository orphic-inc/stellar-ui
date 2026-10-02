import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetCommunityByIdQuery,
  useGetCommunityLeadershipLogQuery,
  type LeadershipLogResponse
} from '../../store/services/communityApi';
import Time from '../layout/Time';
import { PageShell, DataTable, Pagination, type Column } from '../ui';

type LeadershipEvent = LeadershipLogResponse['data'][number];
type UserRef = NonNullable<LeadershipEvent['to']>;

const Name = ({ user }: { user: UserRef | null }) =>
  user ? (
    <Link to={`/user/${user.username}`} data-st="control">
      {user.username}
    </Link>
  ) : (
    <span>someone</span>
  );

/**
 * One line per kind of change (stellar-api#897, ADR-0054). A Record, so a kind
 * the api adds fails the type-check here instead of rendering nothing.
 */
const SENTENCE: Record<
  LeadershipEvent['kind'],
  (e: LeadershipEvent) => ReactNode
> = {
  founded: (e) => (
    <>
      <Name user={e.to} /> became the first leader
    </>
  ),
  assigned: (e) => (
    <>
      Staff made <Name user={e.to} /> leader
      {e.from && (
        <>
          , replacing <Name user={e.from} />
        </>
      )}
    </>
  ),
  handed_off: (e) => (
    <>
      <Name user={e.to} /> took over from <Name user={e.from} /> (handoff)
    </>
  ),
  cleared: (e) => (
    <>
      Staff cleared <Name user={e.from} /> as leader
    </>
  )
};

const columns: Column<LeadershipEvent>[] = [
  {
    header: 'Change',
    cell: (e) => (
      <span>
        {SENTENCE[e.kind](e)}
        {/* The api sends `actor` to staff only (ADR-0054 §5), and on a handoff
            it is always the successor, already named. */}
        {e.actor && e.kind !== 'handed_off' && (
          <span data-st="meta">
            {' '}
            · by <Name user={e.actor} />
          </span>
        )}
      </span>
    )
  },
  {
    header: 'When',
    cell: (e) => <Time date={e.at} />,
    tdClassName: 'text-xs'
  }
];

/**
 * A community's leadership history: each change of leader, newest first. Any
 * reader of the community can see it; a 403 or 404 reads as the community
 * page does.
 */
const LeadershipLogPage = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const id = parseInt(communityId ?? '0');
  const [page, setPage] = useState(1);
  const { data: community } = useGetCommunityByIdQuery(id);
  const { data, isLoading, error } = useGetCommunityLeadershipLogQuery({
    communityId: id,
    page
  });

  const status = (error as { status?: number } | undefined)?.status;
  const title = community
    ? `${community.name}: leadership history`
    : 'Leadership history';

  return (
    <PageShell
      title={title}
      width="lg"
      backTo={`/communities/${id}`}
      backLabel="← Community"
    >
      {status === 403 ? (
        <p data-st="meta">You are not a member of this community.</p>
      ) : status ? (
        <p data-st="meta">Community not found.</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.data}
            rowKey={(e) => e.id}
            isLoading={isLoading}
            empty="No leadership changes yet."
          />
          <Pagination
            page={page}
            totalPages={data?.meta?.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </PageShell>
  );
};

export default LeadershipLogPage;
