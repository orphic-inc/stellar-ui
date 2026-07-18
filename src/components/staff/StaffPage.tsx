import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { parseBBCode } from '../../utils/bbcode';
import { useGetStaffQuery } from '../../store/services/staffApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import { PageShell, DataTable, SectionHeading, type Column } from '../ui';

type StaffMember = {
  userId: number;
  username: string;
  rankName: string;
  rankColor?: string | null;
  lastSeen?: string | null;
  staffBio?: string | null;
};

const memberColumns: Column<StaffMember>[] = [
  {
    header: 'Username',
    cell: (m) => (
      <Link to={`/user/${m.userId}`} data-st="control">
        {m.username}
      </Link>
    )
  },
  {
    header: 'Rank',
    cell: (m) => (
      <span
        className="text-xs whitespace-nowrap"
        style={{ color: m.rankColor || undefined }}
      >
        {m.rankName}
      </span>
    )
  },
  {
    header: 'Last Seen',
    cell: (m) =>
      m.lastSeen ? (
        <span className="text-xs">
          <Time date={m.lastSeen} />
        </span>
      ) : (
        <span className="text-xs text-[var(--st-text-faint)]">Never</span>
      )
  },
  {
    header: 'Bio',
    cell: (m) =>
      m.staffBio ? (
        <span
          className="text-xs bbcode-content"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(parseBBCode(m.staffBio), {
              ALLOWED_TAGS: ['b', 'i', 'u', 's', 'a', 'br']
            })
          }}
        />
      ) : (
        <span className="text-[var(--st-text-faint)]">—</span>
      )
  }
];

const StaffPage = () => {
  const { data, isLoading, isError } = useGetStaffQuery();

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );

  if (isError)
    return (
      <p data-st="prose" className="text-sm text-[var(--st-danger)]">
        Failed to load staff list.
      </p>
    );

  return (
    <PageShell
      title="Staff"
      backTo={null}
      actions={
        <Link
          to="/inbox/staff/new"
          data-st="control"
          data-st-primary
          className="text-sm"
        >
          Contact Staff
        </Link>
      }
    >
      {data?.groups.length === 0 && (
        <p data-st="meta" className="text-sm">
          No staff groups configured.
        </p>
      )}

      {data?.groups.map((group) => (
        <section key={group.id ?? 'ungrouped'} className="space-y-3">
          <SectionHeading className={group.id === null ? 'italic' : undefined}>
            {group.name}
          </SectionHeading>
          <DataTable
            columns={memberColumns}
            rows={group.members as StaffMember[]}
            rowKey={(m) => m.userId}
            empty="No members."
          />
        </section>
      ))}
    </PageShell>
  );
};

export default StaffPage;
