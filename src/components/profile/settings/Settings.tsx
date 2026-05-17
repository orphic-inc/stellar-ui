import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation
} from '../../../store/services/profileApi';
import {
  useChangePasswordMutation,
  useChangeEmailMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation
} from '../../../store/services/authApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import Spinner from '../../layout/Spinner';
import type { paths } from '../../../types/api';

type ProfileForm = NonNullable<
  paths['/profile/me']['put']['requestBody']
>['content']['application/json'];
type MyProfileResponse =
  paths['/profile/me']['get']['responses'][200]['content']['application/json'];

type Tab = 'appearance' | 'privacy' | 'security';

const PARANOIA_LABELS: Record<number, string> = {
  0: 'No restrictions — profile fully visible',
  1: 'Hide email and last login time',
  2: 'Also hide upload/download stats',
  3: 'Hide most activity'
};

const NOTIFICATION_OPTIONS = [
  { value: 'disabled', label: 'Disabled' },
  { value: 'popup', label: 'Popup' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'push', label: 'Push' },
  { value: 'combined', label: 'Combined' }
];

const toProfileForm = (profile: MyProfileResponse): ProfileForm => ({
  avatar: profile.profile.avatar ?? profile.avatar ?? '',
  avatarMouseoverText: profile.profile.avatarMouseoverText ?? '',
  profileTitle: profile.profile.profileTitle ?? '',
  profileInfo: profile.profile.profileInfo ?? '',
  siteAppearance: profile.userSettings.siteAppearance,
  externalStylesheet: profile.userSettings.externalStylesheet ?? '',
  styledTooltips: profile.userSettings.styledTooltips,
  paranoia: profile.userSettings.paranoia,
  notificationMethod: profile.userSettings.notificationMethod,
  showEmail: profile.userSettings.showEmail,
  showLastSeen: profile.userSettings.showLastSeen,
  showContributedStats: profile.userSettings.showContributedStats,
  showConsumedStats: profile.userSettings.showConsumedStats,
  showRatioStats: profile.userSettings.showRatioStats
});

const Settings = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const dispatch = useDispatch();

  const { data: profile, isLoading } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const { register, handleSubmit, reset, watch } = useForm<ProfileForm>();

  useEffect(() => {
    if (profile) reset(toProfileForm(profile));
  }, [profile, reset]);

  const paranoiaValue = watch('paranoia') ?? 0;

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data).unwrap();
      dispatch(addAlert('Profile settings saved.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to save profile settings.',
          'danger'
        )
      );
    }
  };

  // Password change
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePassword, { isLoading: isChangingPw }] =
    useChangePasswordMutation();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      dispatch(addAlert('New passwords do not match.', 'danger'));
      return;
    }
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      }).unwrap();
      dispatch(addAlert('Password changed successfully.', 'success'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to change password.',
          'danger'
        )
      );
    }
  };

  // Email change
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [changeEmail, { isLoading: isChangingEmail }] =
    useChangeEmailMutation();

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changeEmail(emailForm).unwrap();
      dispatch(addAlert('Email changed successfully.', 'success'));
      setEmailForm({ newEmail: '', password: '' });
    } catch (err) {
      dispatch(
        addAlert(getApiErrorMessage(err) ?? 'Failed to change email.', 'danger')
      );
    }
  };

  // Sessions
  const { data: sessions, isLoading: sessionsLoading } = useGetSessionsQuery(
    undefined,
    { skip: activeTab !== 'security' }
  );
  const [revokeSession] = useRevokeSessionMutation();

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSession(id).unwrap();
      dispatch(addAlert('Session revoked.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to revoke session.',
          'danger'
        )
      );
    }
  };

  if (isLoading) return <Spinner />;

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-indigo-500 text-white'
        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <Link
          to={`/private/user/${currentUser?.id}`}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6 flex">
        <button
          className={tabClass('appearance')}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
        <button
          className={tabClass('privacy')}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy
        </button>
        <button
          className={tabClass('security')}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {/* Appearance tab */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Appearance
            </h3>

            <div>
              <label
                htmlFor="settings-avatar"
                className="block text-sm text-gray-300 mb-1"
              >
                Avatar URL
              </label>
              <input
                id="settings-avatar"
                type="text"
                {...register('avatar')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="settings-avatar-mouseover"
                className="block text-sm text-gray-300 mb-1"
              >
                Avatar mouseover text
              </label>
              <input
                id="settings-avatar-mouseover"
                type="text"
                {...register('avatarMouseoverText')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="settings-profile-title"
                className="block text-sm text-gray-300 mb-1"
              >
                Profile title
              </label>
              <input
                id="settings-profile-title"
                type="text"
                {...register('profileTitle')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="settings-profile-info"
                className="block text-sm text-gray-300 mb-1"
              >
                Profile bio
              </label>
              <textarea
                id="settings-profile-info"
                rows={8}
                {...register('profileInfo')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="settings-site-appearance"
                className="block text-sm text-gray-300 mb-1"
              >
                Site appearance
              </label>
              <input
                id="settings-site-appearance"
                type="text"
                {...register('siteAppearance')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="settings-stylesheet"
                className="block text-sm text-gray-300 mb-1"
              >
                Custom stylesheet URL
              </label>
              <input
                id="settings-stylesheet"
                type="text"
                {...register('externalStylesheet')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="styledTooltips"
                {...register('styledTooltips')}
                className="accent-indigo-500"
              />
              <label htmlFor="styledTooltips" className="text-sm text-gray-300">
                Styled tooltips
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}

      {/* Privacy tab */}
      {activeTab === 'privacy' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Privacy
            </h3>

            <div>
              <p className="block text-sm text-gray-300 mb-2">Paranoia level</p>
              <div className="space-y-2">
                {([0, 1, 2, 3] as const).map((level) => (
                  <label
                    key={level}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={level}
                      {...register('paranoia', { valueAsNumber: true })}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <span className="text-sm text-gray-300">
                      <span className="font-medium text-white mr-1">
                        Level {level}:
                      </span>
                      {PARANOIA_LABELS[level]}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current: Level {paranoiaValue} —{' '}
                {PARANOIA_LABELS[paranoiaValue] ?? ''}
              </p>
            </div>

            <div>
              <label
                htmlFor="notificationMethod"
                className="block text-sm text-gray-300 mb-1"
              >
                Notification method
              </label>
              <select
                id="notificationMethod"
                {...register('notificationMethod')}
                className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {NOTIFICATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Controls how account notifications are delivered.
              </p>
            </div>

            <div className="space-y-3">
              <p className="block text-sm text-gray-300">Visible to others</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showEmail')}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-gray-300">Email address</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showLastSeen')}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-gray-300">Last seen time</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showContributedStats')}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-gray-300">Contributed stats</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showConsumedStats')}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-gray-300">Consumed stats</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showRatioStats')}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-gray-300">Ratio and buffer</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change password */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label
                  htmlFor="pw-current"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Current password
                </label>
                <input
                  id="pw-current"
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      currentPassword: e.target.value
                    }))
                  }
                  required
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="pw-new"
                  className="block text-sm text-gray-300 mb-1"
                >
                  New password
                </label>
                <input
                  id="pw-new"
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="pw-confirm"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Confirm new password
                </label>
                <input
                  id="pw-confirm"
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      confirmPassword: e.target.value
                    }))
                  }
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPw}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {isChangingPw ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Change email */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              Change Email
            </h3>
            <form onSubmit={handleEmailChange} className="space-y-3">
              <div>
                <label
                  htmlFor="email-new"
                  className="block text-sm text-gray-300 mb-1"
                >
                  New email address
                </label>
                <input
                  id="email-new"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, newEmail: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="email-pw-confirm"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Current password (to confirm)
                </label>
                <input
                  id="email-pw-confirm"
                  type="password"
                  value={emailForm.password}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingEmail}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {isChangingEmail ? 'Saving…' : 'Change Email'}
              </button>
            </form>
          </div>

          {/* Active sessions */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              Active Sessions
            </h3>
            {sessionsLoading ? (
              <Spinner />
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start justify-between gap-4 p-3 bg-gray-900 rounded-lg border border-gray-700"
                  >
                    <div className="text-xs text-gray-300 space-y-0.5 min-w-0">
                      <div className="font-medium text-gray-200 truncate">
                        {session.userAgent}
                        {session.isCurrent && (
                          <span className="ml-2 text-green-400 font-semibold">
                            (this session)
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500">
                        IP: {session.ipAddress} · Last active:{' '}
                        {new Date(session.lastActiveAt).toLocaleString()}
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="shrink-0 text-xs text-red-500 hover:text-red-400 border border-red-800 hover:border-red-600 px-2 py-1 rounded transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No active sessions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
