import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import DOMPurify from 'dompurify';
import { useGetProfileByUserIdQuery } from '../../store/services/profileApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useWarnUserMutation,
  useGetUserWarningsQuery,
  useGetUserNotesQuery,
  useAddUserNoteMutation,
  useDeleteUserNoteMutation,
  useDisableUserMutation,
  useEnableUserMutation,
  useSetUserRankMutation,
  useGetUserIpHistoryQuery,
  useGetUserEmailHistoryQuery,
  useGetUserRanksQuery,
  useGetDonorRanksQuery,
  useGrantDonorMutation,
  useRevokeDonorMutation,
  useRemoveUserWarningMutation,
  useGetSnatchListByUserIdQuery,
  useGetSnatchListQuery
} from '../../store/services/userApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { hasAnyPermission } from '../../utils/permissions';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';
import RatioStats from './RatioStats';
import UserBadges from '../layout/UserBadges';

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
        expiresAt: expiresAt || undefined
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Warn User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="warn-reason"
              className="block text-sm text-gray-300 mb-1"
            >
              Reason
            </label>
            <textarea
              id="warn-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label
              htmlFor="warn-expires"
              className="block text-sm text-gray-300 mb-1"
            >
              Expires at (optional)
            </label>
            <input
              id="warn-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {isLoading ? 'Issuing…' : 'Issue Warning'}
            </button>
          </div>
        </form>
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
  const [selectedRankId, setSelectedRankId] = useState<number | ''>('');
  const [donorRankId, setDonorRankId] = useState<number | ''>('');
  const [donorExpiry, setDonorExpiry] = useState('');

  const { data: userRanks } = useGetUserRanksQuery();
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
  const isDisabled = (profile as { disabled?: boolean } | undefined)?.disabled;

  const [disableUser, { isLoading: isDisabling }] = useDisableUserMutation();
  const [enableUser, { isLoading: isEnabling }] = useEnableUserMutation();
  const [setUserRank, { isLoading: isSettingRank }] = useSetUserRankMutation();
  const [addUserNote, { isLoading: isAddingNote }] = useAddUserNoteMutation();
  const [deleteUserNote] = useDeleteUserNoteMutation();
  const [removeUserWarning] = useRemoveUserWarningMutation();
  const [grantDonor, { isLoading: isGrantingDonor }] = useGrantDonorMutation();
  const [revokeDonor, { isLoading: isRevokingDonor }] =
    useRevokeDonorMutation();

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

  const handleSetRank = async () => {
    if (!selectedRankId) return;
    try {
      await setUserRank({
        id: profileId,
        userRankId: Number(selectedRankId)
      }).unwrap();
      dispatch(addAlert('Rank updated.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to set rank.', 'danger')
      );
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

  const sectionClass = 'border border-gray-700 rounded-lg overflow-hidden';
  const headClass =
    'bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-700';
  const bodyClass = 'px-4 py-3';

  return (
    <>
      {showWarnModal && (
        <WarnModal userId={profileId} onClose={() => setShowWarnModal(false)} />
      )}

      <div className="bg-gray-900 border border-amber-800/40 rounded-lg overflow-hidden">
        <div className="bg-amber-900/20 border-b border-amber-800/40 px-4 py-2">
          <h3 className="text-sm font-semibold text-amber-300">
            Staff Actions
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWarnModal(true)}
              className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded transition-colors"
            >
              Warn User
            </button>
            <button
              onClick={handleDisableToggle}
              disabled={isDisabling || isEnabling}
              className={`px-3 py-1.5 text-white text-xs rounded transition-colors disabled:opacity-50 ${
                isDisabled
                  ? 'bg-green-700 hover:bg-green-600'
                  : 'bg-red-700 hover:bg-red-600'
              }`}
            >
              {isDisabled ? 'Enable Account' : 'Disable Account'}
            </button>
          </div>

          {/* Change rank */}
          <div className={sectionClass}>
            <div className={headClass}>Change Rank</div>
            <div className={`${bodyClass} flex gap-2`}>
              <select
                value={selectedRankId}
                onChange={(e) =>
                  setSelectedRankId(
                    e.target.value ? Number(e.target.value) : ''
                  )
                }
                className="flex-1 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select rank…</option>
                {userRanks?.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSetRank}
                disabled={!selectedRankId || isSettingRank}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs rounded transition-colors"
              >
                {isSettingRank ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Donor status */}
          <div className={sectionClass}>
            <div className={headClass}>Donor Status</div>
            <div className={`${bodyClass} space-y-2`}>
              <div className="flex gap-2">
                <select
                  value={donorRankId}
                  onChange={(e) =>
                    setDonorRankId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="flex-1 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="w-44 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1.5 text-xs focus:outline-none"
                />
                <button
                  onClick={handleGrantDonor}
                  disabled={!donorRankId || isGrantingDonor}
                  className="px-3 py-1.5 bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white text-xs rounded transition-colors"
                >
                  {isGrantingDonor ? 'Granting…' : 'Grant'}
                </button>
              </div>
              <button
                onClick={handleRevokeDonor}
                disabled={isRevokingDonor}
                className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50"
              >
                Revoke donor status
              </button>
            </div>
          </div>

          {/* Snatch list */}
          <div className={sectionClass}>
            <button
              className={`${headClass} w-full text-left flex items-center justify-between`}
              onClick={() => setShowSnatchList((v) => !v)}
            >
              <span>Snatch List</span>
              <span>{showSnatchList ? '▲' : '▼'}</span>
            </button>
            {showSnatchList && (
              <div className={bodyClass}>
                {snatchList && snatchList.length > 0 ? (
                  <table className="w-full text-xs text-gray-300">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-1">Release</th>
                        <th className="text-left pb-1">Artist</th>
                        <th className="text-left pb-1">Downloaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snatchList.map((item) => (
                        <tr key={item.id} className="border-t border-gray-800">
                          <td className="py-1">
                            <Link
                              to={`/private/communities/${item.release.communityId}/releases/${item.release.id}`}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              {item.release.title}
                            </Link>
                          </td>
                          <td className="py-1 text-gray-400">
                            {item.artist?.name ?? '—'}
                          </td>
                          <td className="py-1 text-gray-500">
                            {new Date(item.downloadedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-500">No snatches.</p>
                )}
              </div>
            )}
          </div>

          {/* IP History */}
          <div className={sectionClass}>
            <button
              className={`${headClass} w-full text-left flex items-center justify-between`}
              onClick={() => setShowIpHistory((v) => !v)}
            >
              <span>IP History</span>
              <span>{showIpHistory ? '▲' : '▼'}</span>
            </button>
            {showIpHistory && (
              <div className={bodyClass}>
                {ipHistory && ipHistory.length > 0 ? (
                  <table className="w-full text-xs text-gray-300">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-1">IP</th>
                        <th className="text-left pb-1">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ipHistory.map((row, i) => (
                        <tr key={i} className="border-t border-gray-800">
                          <td className="py-1 font-mono">{row.ip}</td>
                          <td className="py-1 text-gray-500">
                            {new Date(row.seenAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-500">No IP history.</p>
                )}
              </div>
            )}
          </div>

          {/* Email History */}
          <div className={sectionClass}>
            <button
              className={`${headClass} w-full text-left flex items-center justify-between`}
              onClick={() => setShowEmailHistory((v) => !v)}
            >
              <span>Email History</span>
              <span>{showEmailHistory ? '▲' : '▼'}</span>
            </button>
            {showEmailHistory && (
              <div className={bodyClass}>
                {emailHistory && emailHistory.length > 0 ? (
                  <table className="w-full text-xs text-gray-300">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-1">Email</th>
                        <th className="text-left pb-1">Changed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailHistory.map((row, i) => (
                        <tr key={i} className="border-t border-gray-800">
                          <td className="py-1">{row.email}</td>
                          <td className="py-1 text-gray-500">
                            {new Date(row.changedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-500">No email history.</p>
                )}
              </div>
            )}
          </div>

          {/* Moderation Notes */}
          <div className={sectionClass}>
            <button
              className={`${headClass} w-full text-left flex items-center justify-between`}
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
                        className="p-2 bg-gray-800 rounded flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs text-gray-300">{note.body}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            By {note.author?.username ?? 'Unknown'} ·{' '}
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-600 hover:text-red-400 text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No notes.</p>
                )}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note…"
                    className="flex-1 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newNote.trim() || isAddingNote}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs rounded transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Warnings */}
          <div className={sectionClass}>
            <button
              className={`${headClass} w-full text-left flex items-center justify-between`}
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
                        className="p-2 bg-gray-800 rounded flex items-start justify-between gap-2"
                      >
                        <div className="text-xs">
                          <p className="text-gray-300">{w.reason}</p>
                          <p className="text-gray-500 mt-0.5">
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
                          className="text-gray-600 hover:text-red-400 text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No warnings.</p>
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
    <div className="rounded border border-gray-700 bg-gray-900 overflow-hidden">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <span className="text-sm font-semibold text-gray-200">Snatch List</span>
      </div>
      <div className="divide-y divide-gray-800">
        {snatchList.map((item) => (
          <div
            key={item.id}
            className="px-4 py-2 flex items-center justify-between text-sm"
          >
            <div>
              <Link
                to={`/private/communities/${item.release.communityId}/releases/${item.release.id}`}
                className="text-indigo-400 hover:text-indigo-300"
              >
                {item.release.title}
              </Link>
              {item.artist && (
                <span className="text-gray-500 ml-2 text-xs">
                  {item.artist.name}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
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

  if (isLoading) return <Spinner />;
  if (error || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 text-red-400">
        User not found.
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const isStaff = hasAnyPermission(currentUser, [
    'staff',
    'admin',
    'users_edit',
    'users_warn',
    'users_disable'
  ]);

  const profileAny = profile as Record<string, unknown>;
  const profileDisabled = profileAny.disabled as boolean | undefined;
  const profileWarned = profileAny.warned as string | null | undefined;
  const profileIsDonor = profileAny.isDonor as boolean | undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
        <UserBadges
          disabled={profileDisabled}
          warned={profileWarned}
          isDonor={profileIsDonor}
        />
        <div className="flex items-center gap-3 ml-auto text-sm">
          {isOwnProfile && (
            <Link
              to={`/private/user/edit/${profile.id}`}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Settings
            </Link>
          )}
          {!isOwnProfile && (
            <>
              <Link
                to={`/private/messages/new?to=${profile.username}`}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Send Message
              </Link>
              <Link
                to={`/private/reports/new?targetType=User&targetId=${profile.id}`}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                Report
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <div className="w-44 shrink-0 space-y-4">
          <div className="rounded border border-gray-700 bg-gray-900 overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avatar
              </span>
            </div>
            <div className="p-3 flex justify-center">
              <img
                width={150}
                alt={`${profile.username}'s avatar`}
                className="rounded object-cover w-full"
                src={
                  profile.profile?.avatar ??
                  profile.avatar ??
                  '/static/common/avatars/default.png'
                }
              />
            </div>
          </div>

          <div className="rounded border border-gray-700 bg-gray-900 overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Stats
              </span>
            </div>
            <ul className="px-3 py-2 space-y-1 text-xs text-gray-300">
              {profile.dateRegistered && (
                <li>
                  <span className="text-gray-500">Joined:</span>{' '}
                  <Time date={profile.dateRegistered} />
                </li>
              )}
              {profile.userRank && (
                <li>
                  <span className="text-gray-500">Class:</span>{' '}
                  <span style={{ color: profile.userRank.color }}>
                    {profile.userRank.name}
                  </span>
                </li>
              )}
              {profileIsDonor && <li className="text-pink-400">Donor ♥</li>}
            </ul>
          </div>

          {isOwnProfile && <RatioStats />}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4 min-w-0">
          {profile.profile?.profileInfo && (
            <div className="rounded border border-gray-700 bg-gray-900 overflow-hidden">
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
                <span className="text-sm font-semibold text-gray-200">
                  Profile
                </span>
              </div>
              <div
                className="p-4 text-sm text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(profile.profile.profileInfo)
                }}
              />
            </div>
          )}

          {isOwnProfile && <SnatchListSection />}

          {!isOwnProfile && isStaff && (
            <StaffActionsPanel profileId={profile.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
