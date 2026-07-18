import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { formatBytes, ordinalSuffix } from '../../utils';
import DOMPurify from 'dompurify';
import { Modal } from '../ui';

import {
  useGetMyRatioStatsQuery,
  useGetProfileByUserIdQuery
} from '../../store/services/profileApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useWarnUserMutation,
  useGetUserWarningsQuery,
  useGetUserNotesQuery,
  useAddUserNoteMutation,
  useDeleteUserNoteMutation,
  useDisableUserMutation,
  useEnableUserMutation,
  useGetUserRankAssignmentQuery,
  useSetUserRankMutation,
  useSetUserRankLockMutation,
  useGetUserIpHistoryQuery,
  useGetUserEmailHistoryQuery,
  useGetUserRanksQuery,
  useGetDonorRanksQuery,
  useGrantDonorMutation,
  useRevokeDonorMutation,
  useRemoveUserWarningMutation,
  useGetSnatchListByUserIdQuery,
  useGetSnatchListQuery,
  useTriggerUserRecoveryMutation,
  useSetStaffBioMutation
} from '../../store/services/userApi';
import {
  useGetFriendStatusQuery,
  useAddFriendMutation,
  useAcceptFriendRequestMutation,
  useRemoveFriendMutation
} from '../../store/services/friendApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { avatarSrc, onAvatarError } from '../../utils/avatar';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import UserBadges from '../layout/UserBadges';

const COLLAGE_CATEGORY_LABELS: Record<number, string> = {
  0: 'Personal',
  1: 'Theme / Genre',
  2: 'Discography',
  3: 'Label',
  4: 'Charts',
  5: 'Staff Picks',
  6: 'Other'
};

const formatByteStat = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 'Hidden';
  try {
    return formatBytes(Number(BigInt(String(value))));
  } catch {
    return formatBytes(Number(value));
  }
};

const formatPercentile = (percentile: number) =>
  `${ordinalSuffix(percentile)} percentile`;

// Ticket status → status-chip modifier (WS7). Resolved / unknown stay a neutral
// chip; the chip Role paints the box, the modifier only sets the hue.
const staffPmStatusMod = (status: string): Record<string, string> => {
  if (status === 'Unanswered') return { 'data-st-warning': '' };
  if (status === 'Open') return { 'data-st-info': '' };
  return {};
};

const WarnModal = ({
  userId,
  onClose
}: {
  userId: number;
  onClose: () => void;
}) => {
  const dispatch = useDispatch();
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [warnUser, { isLoading }] = useWarnUserMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await warnUser({
        id: userId,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
      }).unwrap();
      dispatch(addAlert('Warning issued.', 'success'));
      onClose();
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to warn user.', 'danger')
      );
    }
  };

  return (
    <Modal
      title="Warn User"
      size="sm"
      onClose={onClose}
      dismissable={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="warn-reason" data-st="meta" className="block mb-1">
            Reason
          </label>
          <textarea
            id="warn-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            data-st="field"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="warn-expires" data-st="meta" className="block mb-1">
            Expires at (optional)
          </label>
          <input
            id="warn-expires"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            data-st="field"
            className="w-full"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            data-st="control"
            className="text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            data-st="control"
            data-st-primary
            data-st-warning
            className="text-sm"
          >
            {isLoading ? 'Issuing…' : 'Issue Warning'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const StaffBioEditor = ({
  profileId,
  initialBio
}: {
  profileId: number;
  initialBio: string | null;
}) => {
  const dispatch = useDispatch();
  const [staffBioValue, setStaffBioValue] = useState(initialBio ?? '');
  const [setStaffBio, { isLoading: isSettingBio }] = useSetStaffBioMutation();

  useEffect(() => {
    setStaffBioValue(initialBio ?? '');
  }, [initialBio, profileId]);

  const handleSetStaffBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setStaffBio({
        id: profileId,
        staffBio: staffBioValue.trim() || null
      }).unwrap();
      dispatch(addAlert('Staff bio updated.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to update staff bio.',
          'danger'
        )
      );
    }
  };

  return (
    <div data-st="panel">
      <div data-st="colhead">Staff Bio</div>
      <form onSubmit={handleSetStaffBio} className="px-4 py-3 space-y-2">
        <textarea
          value={staffBioValue}
          onChange={(e) => setStaffBioValue(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Staff bio (BBCode supported, max 500 chars). Leave empty to clear."
          data-st="field"
          className="w-full resize-none"
        />
        <div className="flex items-center justify-between">
          <span data-st="meta" className="text-xs">
            {staffBioValue.length}/500
          </span>
          <button
            type="submit"
            disabled={isSettingBio}
            data-st="control"
            data-st-primary
            className="text-xs"
          >
            {isSettingBio ? 'Saving…' : 'Save Bio'}
          </button>
        </div>
      </form>
    </div>
  );
};

const StaffActionsPanel = ({ profileId }: { profileId: number }) => {
  const dispatch = useDispatch();
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showIpHistory, setShowIpHistory] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showSnatchList, setShowSnatchList] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedRankId, setSelectedRankId] = useState<number | ''>('');
  const [selectedSecondaryRankIds, setSelectedSecondaryRankIds] = useState<
    number[]
  >([]);
  const [rankLocked, setRankLocked] = useState(false);
  const [donorRankId, setDonorRankId] = useState<number | ''>('');
  const [donorExpiry, setDonorExpiry] = useState('');

  const { data: userRanks } = useGetUserRanksQuery();
  const { data: rankAssignment } = useGetUserRankAssignmentQuery(profileId);
  const { data: donorRanks } = useGetDonorRanksQuery();
  const { data: ipHistory } = useGetUserIpHistoryQuery(profileId, {
    skip: !showIpHistory
  });
  const { data: emailHistory } = useGetUserEmailHistoryQuery(profileId, {
    skip: !showEmailHistory
  });
  const { data: notes } = useGetUserNotesQuery(profileId, { skip: !showNotes });
  const { data: warnings } = useGetUserWarningsQuery(profileId, {
    skip: !showWarnings
  });
  const { data: snatchList } = useGetSnatchListByUserIdQuery(profileId, {
    skip: !showSnatchList
  });

  const { data: profile } = useGetProfileByUserIdQuery(String(profileId));
  const isDisabled = profile?.disabled;
  const staffPmOverview = profile?.staffPmOverview;
  const primaryRanks =
    userRanks
      ?.filter((rank) => !rank.secondary)
      .sort((a, b) => a.level - b.level) ?? [];
  const secondaryRanks =
    userRanks
      ?.filter((rank) => rank.secondary)
      .sort((a, b) => a.level - b.level) ?? [];

  useEffect(() => {
    if (!rankAssignment) return;
    setSelectedRankId(rankAssignment.userRankId);
    setSelectedSecondaryRankIds(rankAssignment.secondaryRankIds);
    setRankLocked(rankAssignment.rankLocked);
  }, [rankAssignment]);

  const [disableUser, { isLoading: isDisabling }] = useDisableUserMutation();
  const [enableUser, { isLoading: isEnabling }] = useEnableUserMutation();
  const [setUserRank, { isLoading: isSettingRank }] = useSetUserRankMutation();
  const [setUserRankLock, { isLoading: isTogglingLock }] =
    useSetUserRankLockMutation();
  const [addUserNote, { isLoading: isAddingNote }] = useAddUserNoteMutation();
  const [deleteUserNote] = useDeleteUserNoteMutation();
  const [removeUserWarning] = useRemoveUserWarningMutation();
  const [grantDonor, { isLoading: isGrantingDonor }] = useGrantDonorMutation();
  const [revokeDonor, { isLoading: isRevokingDonor }] =
    useRevokeDonorMutation();
  const [triggerRecovery, { isLoading: isSendingRecovery }] =
    useTriggerUserRecoveryMutation();

  const handleDisableToggle = async () => {
    try {
      if (isDisabled) {
        await enableUser(profileId).unwrap();
        dispatch(addAlert('Account enabled.', 'success'));
      } else {
        await disableUser(profileId).unwrap();
        dispatch(addAlert('Account disabled.', 'success'));
      }
    } catch (err) {
      dispatch(addAlert(getApiErrorMessage(err) ?? 'Action failed.', 'danger'));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await addUserNote({ id: profileId, body: newNote }).unwrap();
      setNewNote('');
      dispatch(addAlert('Note added.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to add note.', 'danger')
      );
    }
  };

  const handleSetRank = async () => {
    if (!selectedRankId) return;
    try {
      await setUserRank({
        id: profileId,
        userRankId: Number(selectedRankId),
        secondaryRankIds: selectedSecondaryRankIds
      }).unwrap();
      dispatch(addAlert('Rank updated.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to set rank.', 'danger')
      );
    }
  };

  const handleToggleRankLock = async () => {
    const next = !rankLocked;
    setRankLocked(next); // optimistic; refetch reconciles on settle
    try {
      await setUserRankLock({ id: profileId, rankLocked: next }).unwrap();
      dispatch(
        addAlert(
          next
            ? 'Rank locked — frozen from auto class-progression.'
            : 'Rank unlocked.',
          'success'
        )
      );
    } catch (err) {
      setRankLocked(!next); // revert on failure
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to update rank lock.',
          'danger'
        )
      );
    }
  };

  const handleToggleSecondaryRank = (rankId: number) => {
    setSelectedSecondaryRankIds((current) =>
      current.includes(rankId)
        ? current.filter((id) => id !== rankId)
        : [...current, rankId].sort((a, b) => a - b)
    );
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteUserNote({ id: profileId, noteId }).unwrap();
      dispatch(addAlert('Note deleted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to delete note.', 'danger')
      );
    }
  };

  const handleRemoveWarning = async (warnId: number) => {
    if (!confirm('Remove this warning?')) return;
    try {
      await removeUserWarning({ id: profileId, warnId }).unwrap();
      dispatch(addAlert('Warning removed.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to remove warning.',
          'danger'
        )
      );
    }
  };

  const handleGrantDonor = async () => {
    if (!donorRankId) return;
    try {
      await grantDonor({
        id: profileId,
        donorRankId: Number(donorRankId),
        expiresAt: donorExpiry || undefined
      }).unwrap();
      dispatch(addAlert('Donor status granted.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to grant donor.', 'danger')
      );
    }
  };

  const handleRevokeDonor = async () => {
    try {
      await revokeDonor(profileId).unwrap();
      dispatch(addAlert('Donor status revoked.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to revoke donor.', 'danger')
      );
    }
  };

  const handleTriggerRecovery = async () => {
    if (!confirm('Send a password recovery email to this user?')) return;
    try {
      await triggerRecovery(profileId).unwrap();
      dispatch(addAlert('Recovery email sent.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to send recovery email.',
          'danger'
        )
      );
    }
  };

  // Section chrome decomposes to Roles: wrapper → `panel`, header → `colhead`
  // (a clickable `<button>` colhead for the collapsible sections). Only the
  // body padding stays a layout utility.
  const bodyClass = 'px-4 py-3';

  return (
    <>
      {showWarnModal && (
        <WarnModal userId={profileId} onClose={() => setShowWarnModal(false)} />
      )}

      <div data-st="panel">
        <div data-st="colhead">Staff Actions</div>
        <div className="p-4 space-y-4">
          {/* Quick actions — colour encodes severity via the WS7 status fills. */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWarnModal(true)}
              data-st="control"
              data-st-primary
              data-st-warning
              className="text-xs"
            >
              Warn User
            </button>
            <button
              onClick={handleDisableToggle}
              disabled={isDisabling || isEnabling}
              data-st="control"
              data-st-primary
              data-st-success={isDisabled ? '' : undefined}
              data-st-danger={isDisabled ? undefined : ''}
              className="text-xs"
            >
              {isDisabled ? 'Enable Account' : 'Disable Account'}
            </button>
            <button
              onClick={handleTriggerRecovery}
              disabled={isSendingRecovery}
              data-st="control"
              data-st-primary
              className="text-xs"
            >
              {isSendingRecovery ? 'Sending…' : 'Send Recovery Email'}
            </button>
          </div>

          {staffPmOverview && (
            <div data-st="panel">
              <div data-st="colhead">Support Tickets</div>
              <div className={`${bodyClass} space-y-3`}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div data-st="panel" className="px-3 py-2 text-xs">
                    <div data-st="meta" className="uppercase tracking-wide">
                      Total
                    </div>
                    <div
                      data-st="prose"
                      data-st-strong
                      className="mt-1 text-base"
                    >
                      {staffPmOverview.total}
                    </div>
                  </div>
                  <div data-st="panel" className="px-3 py-2 text-xs">
                    <span
                      data-st="chip"
                      data-st-warning
                      className="uppercase tracking-wide"
                    >
                      Unresolved
                    </span>
                    <div
                      data-st="prose"
                      data-st-strong
                      className="mt-1 text-base"
                    >
                      {staffPmOverview.unresolved}
                    </div>
                  </div>
                </div>

                {staffPmOverview.recentConversations.length > 0 ? (
                  <table data-st="grid" className="text-xs">
                    <thead data-st="colhead">
                      <tr>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Assigned</th>
                        <th data-st-num>Replies</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPmOverview.recentConversations.map(
                        (conversation) => (
                          <tr key={conversation.id} data-st="row">
                            <td>
                              {conversation.viewerCanOpen ? (
                                <Link
                                  to={`/inbox/staff/${conversation.id}`}
                                  data-st="title"
                                >
                                  {conversation.subject}
                                </Link>
                              ) : (
                                <span data-st="prose" data-st-strong>
                                  {conversation.subject}
                                </span>
                              )}
                            </td>
                            <td>
                              <span data-st="meta">
                                <Time date={conversation.createdAt} />
                              </span>
                            </td>
                            <td>
                              <span data-st="meta">
                                {conversation.assignedStaff?.username ??
                                  'Class / unassigned'}
                              </span>
                            </td>
                            <td data-st-num>{conversation.replyCount}</td>
                            <td>
                              <span
                                data-st="chip"
                                {...staffPmStatusMod(conversation.status)}
                              >
                                {conversation.status}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p data-st="prose" data-st-muted className="text-xs">
                    No staff PMs for this user.
                  </p>
                )}
              </div>
            </div>
          )}

          <div data-st="panel">
            <div data-st="colhead">Change Rank</div>
            <div className={`${bodyClass} space-y-3`}>
              <div className="flex gap-2">
                <select
                  value={selectedRankId}
                  onChange={(e) =>
                    setSelectedRankId(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  data-st="field"
                  className="flex-1"
                >
                  <option value="">Select rank…</option>
                  {primaryRanks.map((rank) => (
                    <option key={rank.id} value={rank.id}>
                      {rank.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSetRank}
                  disabled={!selectedRankId || isSettingRank}
                  data-st="control"
                  data-st-primary
                  className="text-xs"
                >
                  {isSettingRank ? 'Saving…' : 'Save'}
                </button>
              </div>
              {secondaryRanks.length > 0 ? (
                <div data-st="panel" className="p-3 space-y-2">
                  <div
                    data-st="meta"
                    className="text-xs uppercase tracking-wide"
                  >
                    Secondary Classes
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {secondaryRanks.map((rank) => (
                      <label
                        key={rank.id}
                        aria-label={rank.name}
                        className="flex items-start gap-3 rounded border border-[var(--st-border)] px-3 py-2 cursor-pointer hover:border-[var(--st-border-strong)]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSecondaryRankIds.includes(rank.id)}
                          onChange={() => handleToggleSecondaryRank(rank.id)}
                          data-st="field"
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span data-st="prose" className="block text-sm">
                            {rank.name}
                          </span>
                          <span data-st="meta" className="block text-xs">
                            Level {rank.level}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <label
                aria-label="Lock rank"
                className="flex items-start gap-3 rounded border border-[var(--st-border)] px-3 py-2 cursor-pointer hover:border-[var(--st-border-strong)]"
              >
                <input
                  type="checkbox"
                  checked={rankLocked}
                  disabled={isTogglingLock}
                  onChange={handleToggleRankLock}
                  data-st="field"
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span data-st="prose" className="block text-sm">
                    Lock rank
                  </span>
                  <span data-st="meta" className="block text-xs">
                    Freeze this user from automatic class progression. Manual
                    rank changes above still apply.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Donor status */}
          <div data-st="panel">
            <div data-st="colhead">Donor Status</div>
            <div className={`${bodyClass} space-y-2`}>
              <div className="flex gap-2">
                <select
                  value={donorRankId}
                  onChange={(e) =>
                    setDonorRankId(e.target.value ? Number(e.target.value) : '')
                  }
                  data-st="field"
                  className="flex-1"
                >
                  <option value="">Select donor rank…</option>
                  {donorRanks?.map((rank) => (
                    <option key={rank.id} value={rank.id}>
                      {rank.name}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={donorExpiry}
                  onChange={(e) => setDonorExpiry(e.target.value)}
                  title="Expires at (optional)"
                  data-st="field"
                  className="w-44 text-xs"
                />
                <button
                  onClick={handleGrantDonor}
                  disabled={!donorRankId || isGrantingDonor}
                  data-st="control"
                  data-st-primary
                  className="text-xs"
                >
                  {isGrantingDonor ? 'Granting…' : 'Grant'}
                </button>
              </div>
              {profile?.isDonor && (
                <button
                  onClick={handleRevokeDonor}
                  disabled={isRevokingDonor}
                  data-st="control"
                  data-st-danger
                  className="text-xs"
                >
                  Revoke donor status
                </button>
              )}
            </div>
          </div>
          {/* Snatch list */}
          <div data-st="panel">
            <button
              data-st="colhead"
              className="w-full text-left"
              onClick={() => setShowSnatchList((v) => !v)}
            >
              <span>Snatch List</span>
              <span>{showSnatchList ? '▲' : '▼'}</span>
            </button>
            {showSnatchList && (
              <div className={bodyClass}>
                {snatchList && snatchList.length > 0 ? (
                  <table data-st="grid" className="text-xs">
                    <thead data-st="colhead">
                      <tr>
                        <th>Release</th>
                        <th>Artist</th>
                        <th>Downloaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snatchList.map((item) => (
                        <tr key={item.id} data-st="row">
                          <td className="py-1">
                            <Link
                              to={`/communities/${item.release.communityId}/releases/${item.release.id}`}
                              data-st="control"
                            >
                              {item.release.title}
                            </Link>
                          </td>
                          <td>
                            <span data-st="meta">
                              {item.artist?.name ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span data-st="meta">
                              {new Date(item.downloadedAt).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p data-st="prose" data-st-muted className="text-xs">
                    No snatches.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* IP History */}
          <div data-st="panel">
            <button
              data-st="colhead"
              className="w-full text-left"
              onClick={() => setShowIpHistory((v) => !v)}
            >
              <span>IP History</span>
              <span>{showIpHistory ? '▲' : '▼'}</span>
            </button>
            {showIpHistory && (
              <div className={bodyClass}>
                {ipHistory && ipHistory.length > 0 ? (
                  <table data-st="grid" className="text-xs">
                    <thead data-st="colhead">
                      <tr>
                        <th>IP</th>
                        <th>Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ipHistory.map((row, i) => (
                        <tr key={i} data-st="row">
                          <td className="font-mono">{row.ip}</td>
                          <td>
                            <span data-st="meta">
                              {new Date(row.seenAt).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p data-st="prose" data-st-muted className="text-xs">
                    No IP history.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Email History */}
          <div data-st="panel">
            <button
              data-st="colhead"
              className="w-full text-left"
              onClick={() => setShowEmailHistory((v) => !v)}
            >
              <span>Email History</span>
              <span>{showEmailHistory ? '▲' : '▼'}</span>
            </button>
            {showEmailHistory && (
              <div className={bodyClass}>
                {emailHistory && emailHistory.length > 0 ? (
                  <table data-st="grid" className="text-xs">
                    <thead data-st="colhead">
                      <tr>
                        <th>Email</th>
                        <th>Changed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailHistory.map((row, i) => (
                        <tr key={i} data-st="row">
                          <td>{row.email}</td>
                          <td>
                            <span data-st="meta">
                              {new Date(row.changedAt).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p data-st="prose" data-st-muted className="text-xs">
                    No email history.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Moderation Notes */}
          <div data-st="panel">
            <button
              data-st="colhead"
              className="w-full text-left"
              onClick={() => setShowNotes((v) => !v)}
            >
              <span>Moderation Notes</span>
              <span>{showNotes ? '▲' : '▼'}</span>
            </button>
            {showNotes && (
              <div className={`${bodyClass} space-y-3`}>
                {notes && notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2 bg-[var(--st-raised)] rounded flex items-start justify-between gap-2"
                      >
                        <div>
                          <p data-st="prose" className="text-xs">
                            {note.body}
                          </p>
                          <p data-st="meta" className="text-[10px] mt-0.5">
                            By {note.author?.username ?? 'Unknown'} ·{' '}
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          data-st="control"
                          data-st-danger
                          className="text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p data-st="prose" data-st-muted className="text-xs">
                    No notes.
                  </p>
                )}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note…"
                    data-st="field"
                    className="flex-1 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newNote.trim() || isAddingNote}
                    data-st="control"
                    data-st-primary
                    className="text-xs"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Warnings */}
          <div data-st="panel">
            <button
              data-st="colhead"
              className="w-full text-left"
              onClick={() => setShowWarnings((v) => !v)}
            >
              <span>Warnings</span>
              <span>{showWarnings ? '▲' : '▼'}</span>
            </button>
            {showWarnings && (
              <div className={bodyClass}>
                {warnings && warnings.length > 0 ? (
                  <div className="space-y-2">
                    {warnings.map((w) => (
                      <div
                        key={w.id}
                        className="p-2 bg-[var(--st-raised)] rounded flex items-start justify-between gap-2"
                      >
                        <div className="text-xs">
                          <p data-st="prose">{w.reason}</p>
                          <p data-st="meta" className="mt-0.5">
                            By {w.warnedBy?.username ?? 'Unknown'} ·{' '}
                            {new Date(w.createdAt).toLocaleString()}
                            {w.expiresAt &&
                              ` · Expires: ${new Date(
                                w.expiresAt
                              ).toLocaleString()}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveWarning(w.id)}
                          data-st="control"
                          data-st-danger
                          className="text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p data-st="prose" data-st-muted className="text-xs">
                    No warnings.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const SnatchListSection = () => {
  const { data: snatchList, isLoading } = useGetSnatchListQuery();

  if (isLoading) return <Spinner />;
  if (!snatchList?.length) return null;

  return (
    <div data-st="panel">
      <div data-st="colhead" data-st-title>
        <span>Snatch List</span>
      </div>
      <div className="divide-y divide-[var(--st-border-subtle)]">
        {snatchList.map((item) => (
          <div
            key={item.id}
            className="px-4 py-2 flex items-center justify-between text-sm"
          >
            <div>
              <Link
                to={`/communities/${item.release.communityId}/releases/${item.release.id}`}
                data-st="control"
              >
                {item.release.title}
              </Link>
              {item.artist && (
                <span className="text-[var(--st-text-muted)] ml-2 text-xs">
                  {item.artist.name}
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--st-text-muted)]">
              {new Date(item.downloadedAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector(selectCurrentUser);
  const { data: profile, isLoading, error } = useGetProfileByUserIdQuery(id!);
  // id may be a username string, so derive isOwnProfile from the loaded profile's id
  const isOwnProfile =
    !!currentUser && !!profile && currentUser.id === profile.id;
  const { data: myRatioStats } = useGetMyRatioStatsQuery(undefined, {
    skip: !isOwnProfile
  });
  const dispatch = useDispatch();
  const { data: friendStatus } = useGetFriendStatusQuery(profile?.id ?? 0, {
    skip: !profile || isOwnProfile || !currentUser
  });
  const [addFriend] = useAddFriendMutation();
  const [acceptRequest] = useAcceptFriendRequestMutation();
  const [removeFriend] = useRemoveFriendMutation();

  if (isLoading) return <Spinner />;
  if (error) {
    const status =
      'status' in error && typeof error.status === 'number' ? error.status : 0;
    let message = 'Unable to load profile.';
    if (status === 401) {
      message = 'You must be signed in to view this profile.';
    } else if (status === 403) {
      message = 'You do not have permission to view this profile.';
    } else if (status === 404) {
      message = 'User not found.';
    }

    return <div className="text-red-400">{message}</div>;
  }
  if (!profile) return <Spinner />;

  const isStaff = hasAnyPermission(currentUser, [
    'staff',
    'admin',
    'users_edit',
    'users_warn',
    'users_disable'
  ]);
  const canEditOwnStaffBio =
    isOwnProfile &&
    (profile.userRank.displayStaff || hasAnyPermission(currentUser, ['admin']));

  const profileDisabled = profile.disabled;
  const profileWarned = profile.warned;
  const profileIsDonor = profile.isDonor;
  const profileStats = profile.stats;
  const activitySummary = profile.activitySummary;
  // Paranoia-gated (stellar-api #193): null when the viewer's tier hides stats.
  const communityStats = profile.community;
  const donorPresentation = profile.donorPresentation;
  const featuredShelves = profile.collageShelves.featuredPersonalCollages;
  const publicShelves = profile.collageShelves.publicCollages;
  const percentileItems = [
    { label: 'Contributed', value: profile.percentiles.contributed },
    { label: 'Consumed', value: profile.percentiles.consumed },
    { label: 'Contributions', value: profile.percentiles.contributions },
    { label: 'Forum Posts', value: profile.percentiles.forumPosts },
    { label: 'Requests Filled', value: profile.percentiles.requestsFilled }
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <h1 data-st="prose" data-st-strong className="text-2xl">
          {profile.username}
        </h1>
        {profile.profile?.profileTitle && (
          <span data-st="meta" className="text-sm">
            {profile.profile.profileTitle}
          </span>
        )}
        <UserBadges
          disabled={profileDisabled}
          warned={profileWarned}
          isDonor={profileIsDonor}
        />
        <div className="flex items-center gap-3 ml-auto text-sm">
          {isOwnProfile && (
            <Link to={`/user/edit/${profile.id}`} data-st="control">
              Settings
            </Link>
          )}
          {(isOwnProfile || isStaff) && (
            <Link to={`/user/${profile.id}/stats`} data-st="control">
              Stats
            </Link>
          )}
          {!isOwnProfile && (
            <>
              <Link
                to={`/messages/new?to=${profile.username}`}
                data-st="control"
              >
                Send Message
              </Link>
              {friendStatus?.status === 'accepted' ? (
                <button
                  onClick={async () => {
                    try {
                      await removeFriend(profile.id).unwrap();
                      dispatch(
                        addAlert(
                          `${profile.username} removed from friends.`,
                          'success'
                        )
                      );
                    } catch (err) {
                      dispatch(
                        addAlert(
                          getApiErrorMessage(err) ?? 'Failed to remove friend.',
                          'danger'
                        )
                      );
                    }
                  }}
                  data-st="control"
                >
                  Remove Friend
                </button>
              ) : friendStatus?.status === 'pending_received' ? (
                <button
                  onClick={async () => {
                    try {
                      await acceptRequest(profile.id).unwrap();
                      dispatch(
                        addAlert(
                          `You and ${profile.username} are now friends.`,
                          'success'
                        )
                      );
                    } catch (err) {
                      dispatch(
                        addAlert(
                          getApiErrorMessage(err) ??
                            'Failed to accept request.',
                          'danger'
                        )
                      );
                    }
                  }}
                  data-st="control"
                  data-st-success
                >
                  Accept Friend Request
                </button>
              ) : friendStatus?.status === 'pending_sent' ? (
                <span data-st="meta">Friend Request Sent</span>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await addFriend(profile.id).unwrap();
                      dispatch(
                        addAlert(
                          `Friend request sent to ${profile.username}.`,
                          'success'
                        )
                      );
                    } catch (err) {
                      dispatch(
                        addAlert(
                          getApiErrorMessage(err) ?? 'Failed to add friend.',
                          'danger'
                        )
                      );
                    }
                  }}
                  data-st="control"
                >
                  Add to Friends
                </button>
              )}
              <Link
                to={`/reports/new?targetType=User&targetId=${profile.id}`}
                data-st="control"
              >
                Report
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main content (left) */}
        <div className="flex-1 space-y-4 min-w-0">
          {profile.profile?.profileInfo && (
            <div data-st="panel">
              <div data-st="colhead" data-st-title>
                <span>Profile</span>
              </div>
              <div
                data-st="prose"
                className="p-4 text-sm"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(profile.profile.profileInfo)
                }}
              />
            </div>
          )}

          {donorPresentation && (
            <div className="rounded border border-pink-900/50 bg-gradient-to-br from-pink-950/40 via-gray-900 to-gray-900 overflow-hidden">
              <div className="bg-pink-900/20 border-b border-pink-900/40 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-pink-200">
                  Donor Presentation
                </span>
                {donorPresentation.rank && (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: donorPresentation.rank.color || undefined }}
                  >
                    {donorPresentation.rank.badge} {donorPresentation.rank.name}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                {(donorPresentation.customIcon ||
                  donorPresentation.secondAvatar) && (
                  <div className="flex flex-wrap gap-4 items-start">
                    {donorPresentation.customIcon && (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-wide text-pink-200/80">
                          Custom Icon
                        </div>
                        {donorPresentation.customIconLink ? (
                          <a
                            href={donorPresentation.customIconLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={donorPresentation.customIcon}
                              alt=""
                              title={
                                donorPresentation.iconMouseOverText ?? undefined
                              }
                              className="h-12 w-12 object-contain rounded border border-pink-900/40 bg-black/20"
                            />
                          </a>
                        ) : (
                          <img
                            src={donorPresentation.customIcon}
                            alt=""
                            title={
                              donorPresentation.iconMouseOverText ?? undefined
                            }
                            className="h-12 w-12 object-contain rounded border border-pink-900/40 bg-black/20"
                          />
                        )}
                      </div>
                    )}
                    {donorPresentation.secondAvatar && (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-wide text-pink-200/80">
                          Donor Avatar
                        </div>
                        <img
                          src={donorPresentation.secondAvatar}
                          alt=""
                          title={
                            donorPresentation.avatarMouseOverText ?? undefined
                          }
                          className="h-20 w-20 object-cover rounded border border-pink-900/40"
                        />
                      </div>
                    )}
                  </div>
                )}

                {donorPresentation.rank && (
                  <div className="text-sm text-[var(--st-text)]">
                    Granted{' '}
                    <span className="text-[var(--st-text-strong)]">
                      {new Date(
                        donorPresentation.rank.grantedAt
                      ).toLocaleDateString()}
                    </span>
                    {donorPresentation.rank.expiresAt && (
                      <>
                        {' '}
                        · Expires{' '}
                        <span className="text-[var(--st-text-strong)]">
                          {new Date(
                            donorPresentation.rank.expiresAt
                          ).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {donorPresentation.profileBlocks.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {donorPresentation.profileBlocks.map((block, index) => (
                      <div
                        key={`${block.title}-${index}`}
                        className="rounded border border-pink-900/30 bg-black/10 p-3"
                      >
                        {block.title && (
                          <div className="mb-2 text-xs uppercase tracking-wide text-pink-200/80">
                            {block.title}
                          </div>
                        )}
                        <div className="text-sm text-[var(--st-text)] whitespace-pre-wrap">
                          {block.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(featuredShelves.length > 0 || publicShelves.length > 0) && (
            <div className="space-y-4">
              {featuredShelves.length > 0 && (
                <div data-st="panel">
                  <div data-st="colhead" data-st-title>
                    <span>Featured Shelves</span>
                  </div>
                  <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {featuredShelves.map((collage) => (
                      <Link
                        key={collage.id}
                        to={`/collages/${collage.id}`}
                        className="rounded border border-[var(--st-border)] bg-[var(--st-base)] hover:border-[var(--st-accent-ring)] transition-colors overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-px bg-[var(--st-border)]">
                          {collage.coverImages.length > 0 ? (
                            collage.coverImages
                              .slice(0, 4)
                              .map((image, index) => (
                                <img
                                  key={`${collage.id}-${index}`}
                                  src={image}
                                  alt=""
                                  className="aspect-square w-full object-cover"
                                />
                              ))
                          ) : (
                            <div className="col-span-2 aspect-[2/1] bg-[var(--st-base)]" />
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-medium text-[var(--st-text-strong)]">
                            {collage.name}
                          </div>
                          <div className="mt-1 text-xs text-[var(--st-text-muted)]">
                            {collage.numEntries} entries
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {publicShelves.length > 0 && (
                <div data-st="panel">
                  <div data-st="colhead" data-st-title>
                    <span>Public Collages</span>
                  </div>
                  <div className="divide-y divide-[var(--st-border-subtle)]">
                    {publicShelves.map((collage) => (
                      <Link
                        key={collage.id}
                        to={`/collages/${collage.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--st-border)]/30 transition-colors"
                      >
                        <div className="grid h-16 w-20 shrink-0 grid-cols-2 gap-px overflow-hidden rounded bg-[var(--st-border)]">
                          {collage.coverImages.length > 0 ? (
                            collage.coverImages
                              .slice(0, 4)
                              .map((image, index) => (
                                <img
                                  key={`${collage.id}-public-${index}`}
                                  src={image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ))
                          ) : (
                            <div className="col-span-2 h-full w-full bg-[var(--st-base)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[var(--st-text-strong)]">
                            {collage.name}
                          </div>
                          <div className="mt-1 text-xs text-[var(--st-text-muted)]">
                            {COLLAGE_CATEGORY_LABELS[collage.categoryId] ??
                              'Collage'}{' '}
                            · {collage.numEntries} entries
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-[var(--st-text-muted)]">
                          {new Date(collage.updatedAt).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div data-st="panel">
            <div data-st="colhead" data-st-title>
              <span>Recent Contributions</span>
            </div>
            {profile.recentContributions.length ? (
              <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
                {profile.recentContributions.map((item) => (
                  <Link
                    key={item.id}
                    to={`/communities/${item.release.communityId}/releases/${item.release.id}`}
                    className="overflow-hidden rounded border border-[var(--st-border-subtle)] bg-[var(--st-base)] hover:border-[var(--st-accent-ring)] transition-colors"
                  >
                    <div className="aspect-square bg-[var(--st-base)]">
                      {item.release.image ? (
                        <img
                          src={item.release.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-medium text-[var(--st-text-strong)]">
                        {item.release.title}
                      </div>
                      {item.release.artist && (
                        <div className="mt-1 truncate text-xs text-[var(--st-text-muted)]">
                          {item.release.artist.name}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-[var(--st-text-muted)]">
                        <Time date={item.createdAt} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-[var(--st-text-muted)]">
                No recent contributions.
              </div>
            )}
          </div>

          {profile.recentSnatches.length > 0 && (
            <div data-st="panel">
              <div data-st="colhead" data-st-title>
                <span>Recent Snatches</span>
              </div>
              <div className="divide-y divide-[var(--st-border-subtle)]">
                {profile.recentSnatches.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/communities/${item.release.communityId}/releases/${item.release.id}`}
                        data-st="control"
                      >
                        {item.release.title}
                      </Link>
                      {item.artist && (
                        <div className="text-xs text-[var(--st-text-muted)]">
                          {item.artist.name}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[var(--st-text-muted)]">
                      <Time date={item.downloadedAt} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && <SnatchListSection />}

          {canEditOwnStaffBio && (
            <StaffBioEditor
              profileId={profile.id}
              initialBio={profile.staffBio}
            />
          )}

          {!isOwnProfile && isStaff && (
            <StaffActionsPanel profileId={profile.id} />
          )}
        </div>

        {/* Sidebar (right) */}
        <div className="w-44 shrink-0 space-y-4">
          <div data-st="panel">
            <div data-st="colhead">
              <span>Avatar</span>
            </div>
            <div className="p-3 flex justify-center">
              <img
                width={150}
                alt={`${profile.username}'s avatar`}
                className="rounded object-cover w-full"
                src={avatarSrc(profile.profile?.avatar ?? profile.avatar)}
                onError={onAvatarError}
              />
            </div>
          </div>

          <div data-st="panel">
            <div data-st="colhead">
              <span>Statistics</span>
            </div>
            <ul className="px-3 py-2 space-y-1 text-xs text-[var(--st-text)]">
              {profile.dateRegistered && (
                <li>
                  <span data-st="meta">Joined:</span>{' '}
                  <Time date={profile.dateRegistered} />
                </li>
              )}
              {profile.lastSeen && (
                <li>
                  <span data-st="meta">Last seen:</span>{' '}
                  <Time date={profile.lastSeen} />
                </li>
              )}
              {profile.email && (
                <li className="break-all">
                  <span data-st="meta">Email:</span> {profile.email}
                </li>
              )}
              {profile.userRank && (
                <li>
                  <span data-st="meta">Class:</span>{' '}
                  <span style={{ color: profile.userRank.color }}>
                    {profile.userRank.badge ? `${profile.userRank.badge} ` : ''}
                    {profile.userRank.name}
                  </span>
                </li>
              )}
              {profile.inviteCount !== null &&
                profile.inviteCount !== undefined && (
                  <li>
                    <span data-st="meta">Invites:</span> {profile.inviteCount}
                  </li>
                )}
              {profileIsDonor && <li className="text-pink-400">Donor ♥</li>}
              <li>
                <span data-st="meta">Contributed:</span>{' '}
                {formatByteStat(profileStats.contributed)}
              </li>
              <li>
                <span data-st="meta">Consumed:</span>{' '}
                {formatByteStat(profileStats.consumed)}
              </li>
              <li>
                <span data-st="meta">Ratio:</span>{' '}
                {profileStats.ratio ?? 'Hidden'}
              </li>
              <li>
                <span data-st="meta">Buffer:</span>{' '}
                {formatByteStat(profileStats.buffer)}
              </li>
              {isOwnProfile && myRatioStats && (
                <>
                  <li>
                    <span data-st="meta">Required ratio:</span>{' '}
                    {myRatioStats.requiredRatio.toFixed(3)}
                  </li>
                  <li>
                    <span data-st="meta">Bracket:</span>{' '}
                    {myRatioStats.bracket.label}
                  </li>
                  <li>
                    <Link to="/ratio" data-st="control">
                      Ratio rules →
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {communityStats && (
            <div data-st="panel">
              <div data-st="colhead">
                <span>Reputation</span>
              </div>
              <div className="px-3 py-2 border-b border-[var(--st-border-subtle)]">
                <div className="text-[var(--st-text-muted)] text-xs uppercase tracking-wide">
                  Community Reputation Score
                </div>
                <div
                  data-st="prose"
                  data-st-strong
                  className="mt-0.5 text-lg font-semibold text-[var(--st-link)]"
                >
                  {communityStats.reputation.score.toFixed(2)}
                </div>
              </div>
              <ul className="divide-y divide-[var(--st-border-subtle)] text-xs">
                {communityStats.reputation.dimensions.map((dim) => (
                  <li
                    key={dim.name}
                    className="flex items-center justify-between px-3 py-1.5"
                  >
                    <span className="capitalize text-[var(--st-text-muted)]">
                      {dim.name}
                    </span>
                    <span className="text-[var(--st-text)]">
                      {dim.subScore.toFixed(2)}
                      <span className="text-[var(--st-text-faint)] ml-1">
                        (×wt {dim.weighted.toFixed(2)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-px bg-[var(--st-border)] grid-cols-2 border-t border-[var(--st-border-subtle)]">
                <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                  <div data-st="meta" className="uppercase tracking-wide">
                    Friends
                  </div>
                  <div
                    data-st="prose"
                    data-st-strong
                    className="mt-0.5 text-sm"
                  >
                    {communityStats.friends}
                  </div>
                </div>
                <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                  <div data-st="meta" className="uppercase tracking-wide">
                    Invites
                  </div>
                  <div
                    data-st="prose"
                    data-st-strong
                    className="mt-0.5 text-sm"
                  >
                    {communityStats.invites.direct} direct /{' '}
                    {communityStats.invites.total} total
                    <span data-st="meta">
                      {' '}
                      (depth {communityStats.invites.depth})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div data-st="panel">
            <div data-st="colhead">
              <span>Activity</span>
            </div>
            <div className="grid gap-px bg-[var(--st-border)] grid-cols-1">
              <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                <div data-st="meta" className="uppercase tracking-wide">
                  Contributions
                </div>
                <div data-st="prose" data-st-strong className="mt-0.5 text-sm">
                  {activitySummary.contributions}
                </div>
              </div>
              <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                <div data-st="meta" className="uppercase tracking-wide">
                  Requests
                </div>
                <div data-st="prose" data-st-strong className="mt-0.5 text-sm">
                  {activitySummary.requestsCreated} created /{' '}
                  {activitySummary.requestsFilled} filled
                </div>
              </div>
              <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                <div data-st="meta" className="uppercase tracking-wide">
                  Forums
                </div>
                <div data-st="prose" data-st-strong className="mt-0.5 text-sm">
                  {activitySummary.forumTopics} topics /{' '}
                  {activitySummary.forumPosts} posts
                </div>
              </div>
              <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                <div data-st="meta" className="uppercase tracking-wide">
                  Collections
                </div>
                <div data-st="prose" data-st-strong className="mt-0.5 text-sm">
                  {activitySummary.collagesStarted} collages
                </div>
              </div>
              <div className="bg-[var(--st-panel)] px-3 py-2 text-xs">
                <div data-st="meta" className="uppercase tracking-wide">
                  Comments
                </div>
                <div data-st="prose" data-st-strong className="mt-0.5 text-sm">
                  {activitySummary.comments}
                </div>
              </div>
            </div>
          </div>

          <div data-st="panel">
            <div data-st="colhead">
              <span>Percentile Rankings</span>
            </div>
            <div className="grid gap-px bg-[var(--st-border)] grid-cols-1">
              {percentileItems.map(({ label, value }) => (
                <div key={label} className="bg-[var(--st-panel)] px-3 py-2">
                  <div
                    data-st="meta"
                    className="text-xs uppercase tracking-wide"
                  >
                    {label}
                  </div>
                  <div
                    data-st="prose"
                    data-st-strong
                    className="mt-0.5 text-sm font-semibold"
                  >
                    {formatPercentile(value.percentile)}
                  </div>
                  <div data-st="meta" className="text-xs">
                    #{value.rank} of {value.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
