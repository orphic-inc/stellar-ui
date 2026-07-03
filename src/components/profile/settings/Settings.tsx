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
import { useGetStylesheetsQuery } from '../../../store/services/siteApi';
import Spinner from '../../layout/Spinner';
import DonorSettingsTab from './DonorSettingsTab';
import IrcNickSettings from './IrcNickSettings';
import type { paths } from '../../../types/api';

type ProfileForm = NonNullable<
  paths['/profile/me']['put']['requestBody']
>['content']['application/json'];
type MyProfileResponse =
  paths['/profile/me']['get']['responses'][200]['content']['application/json'];

type Tab = 'appearance' | 'privacy' | 'security' | 'donor';

const PARANOIA_LABELS: Record<number, string> = {
  0: 'No restrictions — your profile is fully visible',
  1: 'Hide your email address and last-seen time',
  2: 'Also hide your contributed/consumed stats',
  3: 'Also hide your ratio and buffer — nearly all activity stats are hidden'
};

const NOTIFICATION_OPTIONS = [
  { value: 'Disabled', label: 'Disabled — no notifications' },
  { value: 'Traditional', label: 'Traditional — on-site notifications list' },
  { value: 'Popup', label: 'Popup — transient toast popups' },
  { value: 'Push', label: 'Push — browser push notifications' },
  { value: 'Combined', label: 'Combined — all of the above' }
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
  notificationMethod: profile.userSettings.notificationMethod
});

const Settings = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const dispatch = useDispatch();

  const { data: profile, isLoading } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const { data: stylesheets } = useGetStylesheetsQuery();
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<ProfileForm>();

  useEffect(() => {
    if (profile) reset(toProfileForm(profile));
  }, [profile, reset]);

  const paranoiaValue = watch('paranoia') ?? 0;

  // Site Stylesheet slot source (ADR-0024 §4) — Personal (external URL) XOR
  // Registry (an adopted author sheet). Mirrors the server invariant: the UI
  // never submits both; picking one nulls the other. `siteAppearance` above is a
  // separate axis (the built-in fallback), not one of these arms.
  const adoptedSheetId = profile?.userSettings.activeAuthorStylesheetId ?? null;
  const [siteSheetSource, setSiteSheetSource] = useState<
    'personal' | 'registry'
  >('personal');
  useEffect(() => {
    setSiteSheetSource(adoptedSheetId != null ? 'registry' : 'personal');
  }, [adoptedSheetId]);

  const onSubmit = async (data: ProfileForm) => {
    // Enforce the one-slot invariant client-side (the API enforces it too): send
    // only the chosen source, and null the other so the two never coexist.
    const payload: ProfileForm =
      siteSheetSource === 'registry'
        ? {
            ...data,
            externalStylesheet: '',
            activeAuthorStylesheetId: adoptedSheetId
          }
        : { ...data, activeAuthorStylesheetId: null };
    try {
      await updateProfile(payload).unwrap();
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
        ? 'border-[var(--st-accent)] text-[var(--st-text-strong)]'
        : 'border-transparent text-[var(--st-text-muted)] hover:text-[var(--st-text)] hover:border-[var(--st-border-strong)]'
    }`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 data-st="prose" data-st-strong className="text-xl">
          Settings
        </h2>
        <Link
          to={`/private/user/${currentUser?.id}`}
          data-st="control"
          className="text-sm"
        >
          View profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--st-border)] mb-6 flex">
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
        {currentUser?.isDonor && (
          <button
            className={tabClass('donor')}
            onClick={() => setActiveTab('donor')}
          >
            Donor
          </button>
        )}
      </div>

      {/* Appearance tab */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div data-st="panel" className="p-5 space-y-4">
            <h3
              data-st="prose"
              data-st-strong
              className="text-sm uppercase tracking-wider"
            >
              Appearance
            </h3>

            <div>
              <label
                htmlFor="settings-avatar"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Avatar URL
              </label>
              <input
                id="settings-avatar"
                type="text"
                {...register('avatar')}
                data-st="field"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="settings-avatar-mouseover"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Avatar mouseover text
              </label>
              <input
                id="settings-avatar-mouseover"
                type="text"
                {...register('avatarMouseoverText')}
                data-st="field"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="settings-profile-title"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Profile title
              </label>
              <input
                id="settings-profile-title"
                type="text"
                {...register('profileTitle')}
                data-st="field"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="settings-profile-info"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Profile bio
              </label>
              <textarea
                id="settings-profile-info"
                rows={8}
                {...register('profileInfo')}
                data-st="field"
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="settings-site-appearance"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Stylesheet
              </label>
              <select
                id="settings-site-appearance"
                {...register('siteAppearance')}
                data-st="field"
                className="w-full"
              >
                {stylesheets?.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <p data-st="meta" className="block text-sm">
                Site stylesheet source
              </p>

              {/* Personal — a self-hosted external URL */}
              <div className="space-y-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="siteSheetSource"
                    value="personal"
                    checked={siteSheetSource === 'personal'}
                    onChange={() => setSiteSheetSource('personal')}
                    data-st="field"
                  />
                  <span data-st="prose" data-st-strong className="text-sm">
                    Personal — a stylesheet you host yourself
                  </span>
                </label>
                <input
                  id="settings-stylesheet"
                  type="text"
                  placeholder="https://…/theme.css"
                  {...register('externalStylesheet')}
                  disabled={siteSheetSource !== 'personal'}
                  data-st="field"
                  className="w-full disabled:opacity-50"
                />
              </div>

              {/* Registry — a stylesheet adopted from the community */}
              <div className="space-y-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="siteSheetSource"
                    value="registry"
                    checked={siteSheetSource === 'registry'}
                    onChange={() => setSiteSheetSource('registry')}
                    data-st="field"
                  />
                  <span data-st="prose" data-st-strong className="text-sm">
                    Registry — a stylesheet adopted from the community
                  </span>
                </label>
                <p data-st="meta" className="text-xs pl-7">
                  {adoptedSheetId != null
                    ? `Using adopted stylesheet #${adoptedSheetId}. Adopt a different one from its page.`
                    : 'None adopted yet — adopt one from its page to use this option.'}
                </p>
              </div>

              <p data-st="meta" className="text-xs">
                One source at a time — choosing one clears the other. With
                neither set, the built-in stylesheet selected above is used.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="styledTooltips"
                {...register('styledTooltips')}
                data-st="field"
              />
              <label
                htmlFor="styledTooltips"
                data-st="meta"
                className="text-sm"
              >
                Styled tooltips
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            data-st="control"
            data-st-primary
            className="w-full text-sm"
          >
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}

      {/* Privacy tab */}
      {activeTab === 'privacy' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div data-st="panel" className="p-5 space-y-5">
            <h3
              data-st="prose"
              data-st-strong
              className="text-sm uppercase tracking-wider"
            >
              Privacy
            </h3>

            <div>
              <p data-st="meta" className="block text-sm mb-2">
                Paranoia level
              </p>
              <div className="space-y-2">
                {([0, 1, 2, 3] as const).map((level) => (
                  <label
                    key={level}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={String(level)}
                      checked={paranoiaValue === level}
                      onChange={() => setValue('paranoia', level)}
                      data-st="field"
                      className="mt-0.5"
                    />
                    <span data-st="prose" className="text-sm">
                      <span data-st="prose" data-st-strong className="mr-1">
                        Level {level}:
                      </span>
                      {PARANOIA_LABELS[level]}
                    </span>
                  </label>
                ))}
              </div>
              <p data-st="meta" className="text-xs mt-2">
                Current: Level {paranoiaValue} —{' '}
                {PARANOIA_LABELS[paranoiaValue] ?? ''}
              </p>
            </div>

            <div>
              <label
                htmlFor="notificationMethod"
                data-st="meta"
                className="block text-sm mb-1"
              >
                Notification method
              </label>
              <select
                id="notificationMethod"
                {...register('notificationMethod')}
                data-st="field"
                className="w-full"
              >
                {NOTIFICATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p data-st="meta" className="text-xs mt-1">
                Controls how account notifications are delivered. Defaults to
                Traditional (on-site notifications list).
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            data-st="control"
            data-st-primary
            className="w-full text-sm"
          >
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}

      {/* Donor tab */}
      {activeTab === 'donor' && currentUser?.isDonor && <DonorSettingsTab />}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {currentUser && <IrcNickSettings userId={currentUser.id} />}
          {/* Change password */}
          <div data-st="panel" className="p-5">
            <h3
              data-st="prose"
              data-st-strong
              className="text-sm uppercase tracking-wider mb-4"
            >
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label
                  htmlFor="pw-current"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="pw-new"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="pw-confirm"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPw}
                data-st="control"
                data-st-primary
                className="text-sm"
              >
                {isChangingPw ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Change email */}
          <div data-st="panel" className="p-5">
            <h3
              data-st="prose"
              data-st-strong
              className="text-sm uppercase tracking-wider mb-4"
            >
              Change Email
            </h3>
            <form onSubmit={handleEmailChange} className="space-y-3">
              <div>
                <label
                  htmlFor="email-new"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="email-pw-confirm"
                  data-st="meta"
                  className="block text-sm mb-1"
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
                  data-st="field"
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingEmail}
                data-st="control"
                data-st-primary
                className="text-sm"
              >
                {isChangingEmail ? 'Saving…' : 'Change Email'}
              </button>
            </form>
          </div>

          {/* Active sessions */}
          <div data-st="panel" className="p-5">
            <h3
              data-st="prose"
              data-st-strong
              className="text-sm uppercase tracking-wider mb-4"
            >
              Active Sessions
            </h3>
            {sessionsLoading ? (
              <Spinner />
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    data-st="panel"
                    className="flex items-start justify-between gap-4 p-3"
                  >
                    <div
                      data-st="prose"
                      className="text-xs space-y-0.5 min-w-0"
                    >
                      <div data-st="prose" data-st-strong className="truncate">
                        {session.userAgent}
                        {session.isCurrent && (
                          <span className="ml-2 font-semibold text-[var(--st-success)]">
                            (this session)
                          </span>
                        )}
                      </div>
                      <div data-st="meta">
                        IP: {session.ipAddress} · Last active:{' '}
                        {new Date(session.lastActiveAt).toLocaleString()}
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        data-st="control"
                        data-st-danger
                        className="shrink-0 text-xs"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p data-st="meta" className="text-sm">
                No active sessions found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
