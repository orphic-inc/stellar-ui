import { Link } from 'react-router-dom';
import { useGetReleaseGroupQuery } from '../../store/services/releaseGroupApi';

/**
 * The release group panel (#317) — "this album, everywhere you can reach it".
 *
 * Identity and membership arrive from two different places, and the split is an
 * access boundary rather than a fetching convenience (stellar-api ADR-0037):
 *
 *  - **Identity inlines.** `release.group` ships with the release read, because
 *    seeing a release already entitles the viewer to its group's identity. The
 *    header renders from it with no request.
 *  - **Membership does not.** The sibling list stays behind
 *    `GET /release-groups/{id}`, which returns only the members this viewer may
 *    see. That list can be shorter than the album really is and can differ
 *    between two viewers — correct, not a gap.
 *
 * The endpoint answers 404 for a group with no viewer-visible member, using the
 * same status and message as a group that does not exist. That cannot arise
 * here — the viewer can see *this* release — so it is handled as "no panel"
 * rather than an error banner, which is also what it should look like if the
 * assumption ever stops holding.
 */
const ReleaseGroupPanel = ({
  group,
  currentReleaseId
}: {
  group: { id: number; title: string; year?: number | null };
  currentReleaseId: number;
}) => {
  const { data, isLoading, isError } = useGetReleaseGroupQuery(group.id);

  if (isError) return null;

  return (
    <div data-st="panel" className="overflow-hidden">
      <div
        data-st="colhead"
        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
      >
        This album
      </div>
      <div className="px-3 py-2">
        <div data-st="title" className="text-sm">
          {group.title}
        </div>
        {group.year != null && (
          <div data-st="meta" className="text-xs">
            {group.year}
          </div>
        )}
      </div>
      {isLoading && !data ? (
        <div data-st="meta" className="px-3 pb-2 text-xs">
          Loading other releases…
        </div>
      ) : (
        <div data-st="list">
          {(data?.releases ?? []).map((member) => {
            const isCurrent = member.id === currentReleaseId;
            return (
              <div key={member.id} data-st="row" className="px-3 py-1.5">
                <div className="flex-1 min-w-0">
                  {/* The current release is MARKED, not hidden, so the panel
                      reads as the whole album rather than a list of elsewhere. */}
                  {isCurrent || member.communityId == null ? (
                    <span data-st="prose" className="block truncate text-xs">
                      {member.title}
                    </span>
                  ) : (
                    <Link
                      to={`/communities/${member.communityId}/releases/${member.id}`}
                      data-st="title"
                      className="block truncate text-xs"
                    >
                      {member.title}
                    </Link>
                  )}
                  {member.community?.name && (
                    <span data-st="meta" className="text-xs">
                      {member.community.name}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <span data-st="chip" className="shrink-0 text-xs">
                    you are here
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReleaseGroupPanel;
