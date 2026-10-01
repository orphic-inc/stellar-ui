import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
  useSetStaffBioMutation,
  type UserRankAssignment,
  type UserRankRecord
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import { InviteControls, type InviteProfile } from './InviteControlsPanel';
import RatioPolicyNotice from './RatioPolicyNotice';
import ProfileHeader from './view/ProfileHeader';
import DonorPresentationPanel from './view/DonorPresentationPanel';
import CollageShelves from './view/CollageShelves';
import {
  ProfileInfoPanel,
  RecentContributionsPanel,
  RecentSnatchesPanel
} from './view/ProfileFeedPanels';
import ProfileSidebar from './view/ProfileSidebar';
import {
  canEditOwnStaffBio,
  isStaffViewer,
  profileErrorMessage,
  type MyRatioStats,
  type ProfileView
} from './view/profileView';

// The staff controls on another member's profile. Staff get Staff Actions,
// which hold the Invites panel. A rank holding only an invite permission is
// not staff, and gets that panel on its own (#414): stellar-api#655 serves it
// the balance and privilege the panel needs, and nothing else Staff Actions
// shows.
function StaffOrInviteControls(props: {
  isStaff: boolean;
  profile: InviteProfile;
}) {
  const { isStaff, profile } = props;
  if (isStaff) return <StaffActionsPanel profileId={profile.id} />;
  return <InviteControls profile={profile} />;
}

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

const RankAssignmentPanel = ({
  profileId,
  assignment,
  primaryRanks,
  secondaryRanks,
  bodyClass
}: {
  profileId: number;
  assignment: UserRankAssignment;
  primaryRanks: UserRankRecord[];
  secondaryRanks: UserRankRecord[];
  bodyClass: string;
}) => {
  const dispatch = useDispatch();
  // Seeded from the loaded assignment at mount; the caller keys this on the
  // profile, so switching users remounts rather than resyncing through an effect.
  const [selectedRankId, setSelectedRankId] = useState<number | ''>(
    assignment.userRankId
  );
  const [selectedSecondaryRankIds, setSelectedSecondaryRankIds] = useState<
    number[]
  >(assignment.secondaryRankIds);
  const [rankLocked, setRankLocked] = useState(assignment.rankLocked);

  const [setUserRank, { isLoading: isSettingRank }] = useSetUserRankMutation();
  const [setUserRankLock, { isLoading: isTogglingLock }] =
    useSetUserRankLockMutation();

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

  return (
    <div data-st="panel">
      <div data-st="colhead">Change Rank</div>
      <div className={`${bodyClass} space-y-3`}>
        <div className="flex gap-2">
          <select
            value={selectedRankId}
            onChange={(e) =>
              setSelectedRankId(e.target.value ? Number(e.target.value) : '')
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
            <div data-st="meta" className="text-xs uppercase tracking-wide">
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
              Freeze this user from automatic class progression. Manual rank
              changes above still apply.
            </span>
          </span>
        </label>
      </div>
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

  const [disableUser, { isLoading: isDisabling }] = useDisableUserMutation();
  const [enableUser, { isLoading: isEnabling }] = useEnableUserMutation();
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

          {rankAssignment && (
            <RankAssignmentPanel
              key={profileId}
              profileId={profileId}
              assignment={rankAssignment}
              primaryRanks={primaryRanks}
              secondaryRanks={secondaryRanks}
              bodyClass={bodyClass}
            />
          )}

          {profile && (
            <InviteControls profile={profile} bodyClass={bodyClass} />
          )}

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

const ProfileMain = ({
  profile,
  myRatioStats,
  isOwnProfile,
  isStaff,
  canEditBio
}: {
  profile: ProfileView;
  myRatioStats?: MyRatioStats;
  isOwnProfile: boolean;
  isStaff: boolean;
  canEditBio: boolean;
}) => (
  <div className="flex-1 space-y-4 min-w-0">
    {/* Own profile only: `myRatioStats` is skipped off it. Mounted here
        rather than in the Statistics panel because that column is 176px
        wide (ui#334) — the notice is prose and needs the main column. */}
    {myRatioStats && <RatioPolicyNotice stats={myRatioStats} />}
    <ProfileInfoPanel html={profile.profile?.profileInfoHtml} />
    <DonorPresentationPanel presentation={profile.donorPresentation} />
    <CollageShelves shelves={profile.collageShelves} />
    <RecentContributionsPanel items={profile.recentContributions} />
    <RecentSnatchesPanel items={profile.recentSnatches} />
    {isOwnProfile && <SnatchListSection />}
    {canEditBio && (
      <StaffBioEditor
        key={profile.id}
        profileId={profile.id}
        initialBio={profile.staffBio}
      />
    )}
    {!isOwnProfile && (
      <StaffOrInviteControls isStaff={isStaff} profile={profile} />
    )}
  </div>
);

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector(selectCurrentUser);
  const { data: profile, isLoading, error } = useGetProfileByUserIdQuery(id!);
  // id may be a username string, so derive isOwnProfile from the loaded profile's id
  const isOwnProfile = !!profile && currentUser?.id === profile.id;
  const { data: myRatioStats } = useGetMyRatioStatsQuery(undefined, {
    skip: !isOwnProfile
  });

  if (isLoading) return <Spinner />;
  if (error) {
    return <div className="text-red-400">{profileErrorMessage(error)}</div>;
  }
  if (!profile) return <Spinner />;

  const isStaff = isStaffViewer(currentUser);
  const ownRatioStats = isOwnProfile ? myRatioStats : undefined;
  return (
    <div>
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isStaff={isStaff}
      />
      <div className="flex gap-6 items-start">
        <ProfileMain
          profile={profile}
          myRatioStats={ownRatioStats}
          isOwnProfile={isOwnProfile}
          isStaff={isStaff}
          canEditBio={canEditOwnStaffBio(currentUser, profile, isOwnProfile)}
        />
        <ProfileSidebar profile={profile} myRatioStats={ownRatioStats} />
      </div>
    </div>
  );
};

export default UserProfile;
