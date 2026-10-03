import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCommunityByIdQuery,
  useGetReleasesByCommunityQuery,
  useAddCommunityMemberMutation,
  useRemoveCommunityMemberMutation,
  useAddCommunityCuratorMutation,
  useRemoveCommunityCuratorMutation
} from '../../store/services/communityApi';
import { useToggleCommunityBookmarkMutation } from '../../store/services/bookmarkApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import ReportContributionModal from './ReportContributionModal';
import CommunityReleaseRow from './CommunityReleaseRow';
import LeaderOfferPanel from './LeaderOfferPanel';
import { Pagination } from '../ui';

const CommunityPage = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const id = parseInt(communityId ?? '0');
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [releasePage, setReleasePage] = useState(1);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [addCommunityMember, { isLoading: isAdding }] =
    useAddCommunityMemberMutation();
  const [removeCommunityMember] = useRemoveCommunityMemberMutation();
  const [addCommunityCurator] = useAddCommunityCuratorMutation();
  const [toggleBookmark, { isLoading: bookmarking }] =
    useToggleCommunityBookmarkMutation();

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(id).unwrap();
      dispatch(
        addAlert(
          result.bookmarked ? 'Community bookmarked.' : 'Bookmark removed.',
          'success'
        )
      );
    } catch {
      dispatch(addAlert('Failed to update bookmark.', 'danger'));
    }
  };
  const [removeCommunityCurator] = useRemoveCommunityCuratorMutation();

  // The roster's writes, unwrapped so a refusal is said rather than dropped
  // (#464). The api's message names the reason, such as a role to remove first.
  const fail = (err: unknown, what: string) =>
    dispatch(
      addAlert(getApiErrorMessage(err) ?? `Failed to ${what}.`, 'danger')
    );
  const run = async (
    write: { unwrap: () => Promise<unknown> },
    what: string
  ) => {
    try {
      await write.unwrap();
    } catch (err) {
      fail(err, what);
    }
  };

  const {
    data: community,
    isLoading: loadingCommunity,
    error
  } = useGetCommunityByIdQuery(id);
  const {
    data: releases,
    isLoading: loadingReleases,
    error: releasesError
  } = useGetReleasesByCommunityQuery({ communityId: id, page: releasePage });

  if (loadingCommunity) return <Spinner />;
  if (!community) {
    const status = (error as { status?: number } | undefined)?.status;
    if (status === 403)
      return (
        <div className="p-4 text-yellow-400">
          You are not a member of this community.
        </div>
      );
    return <div className="p-4 text-red-400">Community not found.</div>;
  }

  const isCurator = community.curators?.some((c) => c.id === user?.id) ?? false;
  const isCommunityAdmin = hasAnyPermission(user, [
    'communities_manage',
    'admin'
  ]);
  const canManageMembers = isCurator || isCommunityAdmin;
  // Curators admit members; only the leader, or staff, appoints curators
  // (stellar-api#895, ADR-0053).
  const canManageCurators =
    isCommunityAdmin ||
    (community.leaderId != null && community.leaderId === user?.id);

  // The leader (ADR-0021) is a first-class role, surfaced separately from the
  // curator roster. The contract carries only leaderId, so resolve a username
  // from the members roster when possible; otherwise link the profile by id.
  const leader =
    community.leaderId != null
      ? community.members?.find((m) => m.id === community.leaderId)
      : undefined;

  // A curator may remove themselves (stellar-api#895). It ends their member
  // management at once, so it asks first.
  const handleStepDown = async () => {
    if (!user || !window.confirm('Step down as a curator of this community?'))
      return;
    try {
      await removeCommunityCurator({
        communityId: id,
        userId: user.id
      }).unwrap();
      dispatch(addAlert('You are no longer a curator here.', 'success'));
    } catch {
      dispatch(addAlert('Failed to step down.', 'danger'));
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(newMemberUserId, 10);
    if (!uid) return;
    // A refused add keeps the typed ID (#464).
    try {
      await addCommunityMember({ communityId: id, userId: uid }).unwrap();
      setNewMemberUserId('');
    } catch (err) {
      fail(err, 'add the member');
    }
  };

  const toggleCurator = (userId: number, isCurator: boolean) =>
    isCurator
      ? run(
          removeCommunityCurator({ communityId: id, userId }),
          'demote the curator'
        )
      : run(
          addCommunityCurator({ communityId: id, userId }),
          'make them a curator'
        );

  const removeMember = (userId: number) =>
    run(
      removeCommunityMember({ communityId: id, userId }),
      'remove the member'
    );

  const releaseList = releases?.data ?? [];
  const total = releases?.meta?.total ?? 0;
  const pageSize = releases?.meta?.limit ?? 25;
  const totalPages = Math.ceil(total / pageSize);
  // Staff read every community's record but not its contents (stellar-api#902,
  // ADR-0055), so a 403 on the release list is that, not an empty community.
  const releasesForbidden =
    (releasesError as { status?: number } | undefined)?.status === 403;
  const releasesEmpty = releasesForbidden
    ? "Releases are visible to this community's members."
    : 'No releases yet.';
  // A refused list has no count to state; "0 total" would claim it is empty.
  const releaseTotal = releasesForbidden ? '' : `${total} total`;

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/communities" className="hover:text-gray-300">
          Communities
        </Link>
        {' › '}
        <strong className="text-gray-200">{community.name}</strong>
        {user && (
          <button
            onClick={handleBookmark}
            disabled={bookmarking}
            title="Bookmark community"
            className="ml-3 text-gray-500 hover:text-yellow-300 transition-colors text-sm disabled:opacity-50"
          >
            🔖
          </button>
        )}
      </nav>

      {community.description && (
        <p className="text-sm text-gray-400 mb-4">{community.description}</p>
      )}

      {/* Always shown, so a leaderless community's history stays reachable
          (stellar-ui#474, #475). */}
      <p className="text-sm text-gray-400 mb-4">
        <span className="text-gray-500">Leader: </span>
        {community.leaderId != null ? (
          <Link
            to={`/user/${leader?.username ?? community.leaderId}`}
            className="text-indigo-400 hover:text-indigo-300"
          >
            {leader?.username ?? `User #${community.leaderId}`}
          </Link>
        ) : (
          <span className="text-gray-500">none</span>
        )}{' '}
        <Link
          to={`/communities/${community.id}/leadership`}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          (history)
        </Link>
      </p>

      <LeaderOfferPanel
        community={community}
        userId={user?.id}
        leaderName={leader?.username ?? `User #${community.leaderId}`}
      />

      {canManageMembers && (
        <div data-st="panel" className="mb-4">
          <div data-st="colhead">
            <span>Members</span>
            {/* The roster's own length, not _count.consumers — membership is the
                role union (ADR-0033), so a curator holding no Consumer row is a
                member the relation count cannot see. */}
            <span>{community.members?.length ?? 0} total</span>
          </div>
          <div className="px-4 py-3 border-b border-gray-800">
            <form onSubmit={handleAddMember} className="flex gap-2">
              <input
                type="number"
                min={1}
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                placeholder="User ID"
                className="rounded bg-gray-700 border border-gray-600 text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
              />
              <button
                type="submit"
                disabled={isAdding || !newMemberUserId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
              >
                Add Member
              </button>
            </form>
          </div>
          {community.members && community.members.length > 0 ? (
            <div data-st="list">
              {community.members.map((m) => {
                // ADR-0033 §Decision 4: the roster reports its own roles, so
                // this no longer reconstructs one by cross-referencing lists.
                const memberIsCurator = m.roles.includes('curator');
                // The api refuses removing the leader as a curator: they are
                // reassigned or cleared instead (stellar-api#891).
                const memberIsLeader = m.id === community.leaderId;
                return (
                  <div key={m.id} data-st="row" className="justify-between">
                    <div className="flex items-center gap-2">
                      <span data-st="meta">{m.username}</span>
                      {memberIsCurator && <span data-st="chip">Curator</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {canManageCurators && !memberIsLeader && (
                        <button
                          type="button"
                          onClick={() => toggleCurator(m.id, memberIsCurator)}
                          className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                        >
                          {memberIsCurator ? 'Demote' : 'Make Curator'}
                        </button>
                      )}
                      {!canManageCurators &&
                        memberIsCurator &&
                        m.id === user?.id && (
                          <button
                            type="button"
                            onClick={handleStepDown}
                            className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                          >
                            Step down
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-600">No members yet.</p>
          )}
        </div>
      )}

      <div data-st="panel">
        <div data-st="colhead">
          <span>Releases</span>
          <span>{releaseTotal}</span>
        </div>

        {loadingReleases ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : releaseList.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            {releasesEmpty}
          </p>
        ) : (
          <div data-st="list">
            {releaseList.map((release) => (
              <CommunityReleaseRow
                key={release.id}
                release={release}
                communityId={id}
                canDownload={user?.canDownload ?? false}
                onReport={setReportingId}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={releasePage}
        totalPages={totalPages}
        onChange={setReleasePage}
      />

      {reportingId !== null && (
        <ReportContributionModal
          contributionId={reportingId}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
};

export default CommunityPage;
