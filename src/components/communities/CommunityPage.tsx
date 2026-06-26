import { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCommunityByIdQuery,
  useGetReleasesByCommunityQuery,
  useAddCommunityMemberMutation,
  useRemoveCommunityMemberMutation,
  useAddCommunityStaffMutation,
  useRemoveCommunityStaffMutation
} from '../../store/services/communityApi';
import { useToggleCommunityBookmarkMutation } from '../../store/services/bookmarkApi';
import { addAlert } from '../../store/slices/alertSlice';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import DownloadButton from './DownloadButton';
import LinkStatusBadge from './LinkStatusBadge';
import ReportContributionModal from './ReportContributionModal';
import { formatSize } from '../../utils';
import type { LinkHealthStatus } from '../../types';

interface ContributionRow {
  id: number;
  type: string;
  sizeInBytes?: number | null;
  linkStatus?: string | null;
  user: { id: number; username: string };
  _count?: { consumers: number };
}

const MusicNote = () => (
  <svg
    className="w-5 h-5 text-gray-600"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
  </svg>
);

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
  const [addCommunityStaff] = useAddCommunityStaffMutation();
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
  const [removeCommunityStaff] = useRemoveCommunityStaffMutation();

  const {
    data: community,
    isLoading: loadingCommunity,
    error
  } = useGetCommunityByIdQuery(id);
  const { data: releases, isLoading: loadingReleases } =
    useGetReleasesByCommunityQuery({ communityId: id, page: releasePage });

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

  const isStaff = community.staff?.some((s) => s.id === user?.id) ?? false;
  const canManageMembers =
    isStaff || hasAnyPermission(user, ['communities_manage', 'admin']);

  // The leader (ADR-0021) is a first-class role, surfaced separately from the
  // staff roster. The contract carries only leaderId, so resolve a username from
  // the staff/consumer lists when possible; otherwise link the profile by id.
  const leader =
    community.leaderId != null
      ? (community.staff?.find((s) => s.id === community.leaderId) ??
        community.consumers?.find((c) => c.user.id === community.leaderId)
          ?.user)
      : undefined;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(newMemberUserId, 10);
    if (!uid) return;
    await addCommunityMember({ communityId: id, userId: uid });
    setNewMemberUserId('');
  };

  const releaseList = releases?.data ?? [];
  const total = releases?.meta?.total ?? 0;
  const pageSize = releases?.meta?.limit ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/private/communities" className="hover:text-gray-300">
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

      {community.leaderId != null && (
        <p className="text-sm text-gray-400 mb-4">
          <span className="text-gray-500">Leader: </span>
          <Link
            to={`/private/user/${leader?.username ?? community.leaderId}`}
            className="text-indigo-400 hover:text-indigo-300"
          >
            {leader?.username ?? `User #${community.leaderId}`}
          </Link>
        </p>
      )}

      {canManageMembers && (
        <div data-st="panel" className="mb-4">
          <div data-st="colhead">
            <span>Members</span>
            <span>{community._count?.consumers ?? 0} total</span>
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
          {community.consumers && community.consumers.length > 0 ? (
            <div data-st="list">
              {community.consumers.map((c) => {
                const memberIsStaff =
                  community.staff?.some((s) => s.id === c.user.id) ?? false;
                return (
                  <div
                    key={c.user.id}
                    data-st="row"
                    className="justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span data-st="meta">{c.user.username}</span>
                      {memberIsStaff && <span data-st="chip">Staff</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          memberIsStaff
                            ? removeCommunityStaff({
                                communityId: id,
                                userId: c.user.id
                              })
                            : addCommunityStaff({
                                communityId: id,
                                userId: c.user.id
                              })
                        }
                        className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        {memberIsStaff ? 'Demote' : 'Make Staff'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeCommunityMember({
                            communityId: id,
                            userId: c.user.id
                          })
                        }
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
          <span>{total} total</span>
        </div>

        {loadingReleases ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : releaseList.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            No releases yet.
          </p>
        ) : (
          <div data-st="list">
            {releaseList.map((release) => {
              const tags =
                (release as { tags?: { name: string }[] }).tags ?? [];
              const contributions =
                (release as { contributions?: ContributionRow[] })
                  .contributions ?? [];

              const contributorCount = new Set(
                contributions.map((c) => c.user.id)
              ).size;
              const consumerCount = contributions.reduce(
                (sum, c) => sum + (c._count?.consumers ?? 0),
                0
              );

              return (
                <Fragment key={release.id}>
                  {/* Release header row */}
                  <div data-st="row">
                    <Link
                      to={`/private/communities/${communityId}/releases/${release.id}`}
                      className="shrink-0"
                      tabIndex={-1}
                    >
                      {release.image ? (
                        <img
                          src={release.image}
                          alt=""
                          className="w-14 h-14 object-cover rounded border border-gray-700"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded flex items-center justify-center">
                          <MusicNote />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        {release.artist && (
                          <span data-st="meta" data-st-em className="text-sm">
                            {release.artist.name}
                          </span>
                        )}
                        {release.artist && (
                          <span data-st="meta" className="text-sm">
                            —
                          </span>
                        )}
                        <Link
                          to={`/private/communities/${communityId}/releases/${release.id}`}
                          data-st="title"
                          className="text-sm"
                        >
                          {release.title}
                        </Link>
                        {release.year && (
                          <span data-st="meta" data-st-num className="text-xs">
                            [{release.year}]
                          </span>
                        )}
                        {release.type && (
                          <span data-st="meta" className="text-xs">
                            [{release.type}]
                          </span>
                        )}
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tags.map((t) => (
                            <span key={t.name} data-st="chip">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Release-level stats */}
                    <div className="shrink-0 self-center text-right space-y-0.5 whitespace-nowrap">
                      {contributorCount > 0 && (
                        <div data-st="meta" data-st-num className="text-xs">
                          {contributorCount}{' '}
                          {contributorCount === 1
                            ? 'contributor'
                            : 'contributors'}
                        </div>
                      )}
                      {consumerCount > 0 && (
                        <div data-st="meta" data-st-num className="text-xs">
                          {consumerCount}{' '}
                          {consumerCount === 1 ? 'snatch' : 'snatches'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Format rows */}
                  {contributions.length > 0 && (
                    <div data-st="list" className="pl-[4.25rem]">
                      {contributions.map((c) => {
                        const linkStatus = (c.linkStatus ??
                          'UNKNOWN') as LinkHealthStatus;
                        return (
                          <div key={c.id} data-st="row">
                            <span
                              data-st="chip"
                              data-st-mono
                              className="shrink-0"
                            >
                              {c.type}
                            </span>
                            <span
                              data-st="meta"
                              data-st-num
                              className="text-xs w-20 shrink-0"
                            >
                              {c.sizeInBytes
                                ? formatSize(Number(c.sizeInBytes))
                                : '—'}
                            </span>
                            <Link
                              to={`/private/user/${c.user.username}`}
                              className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
                            >
                              {c.user.username}
                            </Link>
                            <span
                              data-st="meta"
                              data-st-num
                              className="text-xs shrink-0"
                            >
                              {c._count?.consumers ?? 0}{' '}
                              {(c._count?.consumers ?? 0) === 1
                                ? 'snatch'
                                : 'snatches'}
                            </span>
                            <LinkStatusBadge status={linkStatus} />
                            <div className="flex gap-2 items-center ml-auto">
                              <DownloadButton
                                contributionId={c.id}
                                canDownload={user?.canDownload ?? false}
                              />
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                                title="Report dead or misleading link"
                                onClick={() => setReportingId(c.id)}
                              >
                                [Report]
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm">
          <button
            disabled={releasePage === 1}
            onClick={() => setReleasePage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-400">
            {releasePage} / {totalPages}
          </span>
          <button
            disabled={releasePage === totalPages}
            onClick={() => setReleasePage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

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
