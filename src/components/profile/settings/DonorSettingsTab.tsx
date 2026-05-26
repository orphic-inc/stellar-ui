import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetDonorRewardsQuery,
  useUpdateDonorRewardsMutation,
  useUpdateDonorForumTitleMutation
} from '../../../store/services/profileApi';
import { addAlert } from '../../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../../utils/apiError';
import Spinner from '../../layout/Spinner';

const inputClass =
  'w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelClass = 'block text-sm text-gray-300 mb-1';
const lockedClass = 'block text-sm text-gray-600 mb-1 cursor-not-allowed';

const LockedNote = () => (
  <p className="text-xs text-gray-600 mt-1">
    Not included in your current donor rank.
  </p>
);

const DonorSettingsTab = () => {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetDonorRewardsQuery();
  const [updateRewards, { isLoading: isSavingRewards }] =
    useUpdateDonorRewardsMutation();
  const [updateTitle, { isLoading: isSavingTitle }] =
    useUpdateDonorForumTitleMutation();

  const perks = data?.perks ?? {};
  const rewards = data?.rewards;
  const forumTitle = data?.forumTitle;

  const [iconMouseOverText, setIconMouseOverText] = useState('');
  const [avatarMouseOverText, setAvatarMouseOverText] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [customIconLink, setCustomIconLink] = useState('');
  const [secondAvatar, setSecondAvatar] = useState('');
  const [profileInfoTitle1, setProfileInfoTitle1] = useState('');
  const [profileInfo1, setProfileInfo1] = useState('');
  const [profileInfoTitle2, setProfileInfoTitle2] = useState('');
  const [profileInfo2, setProfileInfo2] = useState('');
  const [profileInfoTitle3, setProfileInfoTitle3] = useState('');
  const [profileInfo3, setProfileInfo3] = useState('');
  const [profileInfoTitle4, setProfileInfoTitle4] = useState('');
  const [profileInfo4, setProfileInfo4] = useState('');
  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleSuffix, setTitleSuffix] = useState('');
  const [titleUseComma, setTitleUseComma] = useState(false);

  useEffect(() => {
    if (!rewards) return;
    setIconMouseOverText(rewards.iconMouseOverText ?? '');
    setAvatarMouseOverText(rewards.avatarMouseOverText ?? '');
    setCustomIcon(rewards.customIcon ?? '');
    setCustomIconLink(rewards.customIconLink ?? '');
    setSecondAvatar(rewards.secondAvatar ?? '');
    setProfileInfoTitle1(rewards.profileInfoTitle1 ?? '');
    setProfileInfo1(rewards.profileInfo1 ?? '');
    setProfileInfoTitle2(rewards.profileInfoTitle2 ?? '');
    setProfileInfo2(rewards.profileInfo2 ?? '');
    setProfileInfoTitle3(rewards.profileInfoTitle3 ?? '');
    setProfileInfo3(rewards.profileInfo3 ?? '');
    setProfileInfoTitle4(rewards.profileInfoTitle4 ?? '');
    setProfileInfo4(rewards.profileInfo4 ?? '');
    if (forumTitle) {
      setTitlePrefix(forumTitle.prefix ?? '');
      setTitleSuffix(forumTitle.suffix ?? '');
      setTitleUseComma(forumTitle.useComma ?? false);
    }
  }, [rewards, forumTitle]);

  const handleSaveRewards = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRewards({
        iconMouseOverText: iconMouseOverText || undefined,
        avatarMouseOverText: avatarMouseOverText || undefined,
        customIcon: customIcon || undefined,
        customIconLink: customIconLink || undefined,
        secondAvatar: secondAvatar || undefined,
        profileInfoTitle1: profileInfoTitle1 || undefined,
        profileInfo1: profileInfo1 || undefined,
        profileInfoTitle2: profileInfoTitle2 || undefined,
        profileInfo2: profileInfo2 || undefined,
        profileInfoTitle3: profileInfoTitle3 || undefined,
        profileInfo3: profileInfo3 || undefined,
        profileInfoTitle4: profileInfoTitle4 || undefined,
        profileInfo4: profileInfo4 || undefined
      }).unwrap();
      dispatch(addAlert('Donor settings saved.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to save donor settings.',
          'danger'
        )
      );
    }
  };

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTitle({
        prefix: titlePrefix || undefined,
        suffix: titleSuffix || undefined,
        useComma: titleUseComma
      }).unwrap();
      dispatch(addAlert('Forum title saved.', 'success'));
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to save forum title.',
          'danger'
        )
      );
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSaveRewards}
        className="bg-gray-800 rounded-lg border border-gray-700 p-5 space-y-5"
      >
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
          Donor Rewards
        </h3>

        {/* Icons */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="donor-custom-icon"
              className={perks.customIcon ? labelClass : lockedClass}
            >
              Custom icon URL
            </label>
            <input
              id="donor-custom-icon"
              type="text"
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              disabled={!perks.customIcon}
              placeholder="https://…"
              className={inputClass + (!perks.customIcon ? ' opacity-40' : '')}
            />
            {!perks.customIcon && <LockedNote />}
          </div>

          <div>
            <label
              htmlFor="donor-custom-icon-link"
              className={perks.customIconLink ? labelClass : lockedClass}
            >
              Custom icon link URL
            </label>
            <input
              id="donor-custom-icon-link"
              type="text"
              value={customIconLink}
              onChange={(e) => setCustomIconLink(e.target.value)}
              disabled={!perks.customIconLink}
              placeholder="https://…"
              className={
                inputClass + (!perks.customIconLink ? ' opacity-40' : '')
              }
            />
            {!perks.customIconLink && <LockedNote />}
          </div>

          <div>
            <label
              htmlFor="donor-icon-mouseover"
              className={perks.iconMouseOverText ? labelClass : lockedClass}
            >
              Icon mouseover text
            </label>
            <input
              id="donor-icon-mouseover"
              type="text"
              value={iconMouseOverText}
              onChange={(e) => setIconMouseOverText(e.target.value)}
              disabled={!perks.iconMouseOverText}
              maxLength={256}
              className={
                inputClass + (!perks.iconMouseOverText ? ' opacity-40' : '')
              }
            />
            {!perks.iconMouseOverText && <LockedNote />}
          </div>
        </div>

        {/* Second avatar */}
        <div>
          <label
            htmlFor="donor-second-avatar"
            className={perks.secondAvatar ? labelClass : lockedClass}
          >
            Second (donor) avatar URL
          </label>
          <input
            id="donor-second-avatar"
            type="text"
            value={secondAvatar}
            onChange={(e) => setSecondAvatar(e.target.value)}
            disabled={!perks.secondAvatar}
            placeholder="https://…"
            className={inputClass + (!perks.secondAvatar ? ' opacity-40' : '')}
          />
          {!perks.secondAvatar && <LockedNote />}
        </div>

        {/* Avatar mouseover text */}
        <div>
          <label
            htmlFor="donor-avatar-mouseover"
            className={perks.avatarMouseOverText ? labelClass : lockedClass}
          >
            Avatar mouseover text
          </label>
          <input
            id="donor-avatar-mouseover"
            type="text"
            value={avatarMouseOverText}
            onChange={(e) => setAvatarMouseOverText(e.target.value)}
            disabled={!perks.avatarMouseOverText}
            maxLength={256}
            className={
              inputClass + (!perks.avatarMouseOverText ? ' opacity-40' : '')
            }
          />
          {!perks.avatarMouseOverText && <LockedNote />}
        </div>

        {/* Profile info blocks */}
        {([1, 2, 3, 4] as const).map((n) => {
          const perkKey = `profileInfo${n}` as const;
          const locked = !perks[perkKey];
          const titleState = [
            profileInfoTitle1,
            profileInfoTitle2,
            profileInfoTitle3,
            profileInfoTitle4
          ][n - 1];
          const bodyState = [
            profileInfo1,
            profileInfo2,
            profileInfo3,
            profileInfo4
          ][n - 1];
          const setTitle = [
            setProfileInfoTitle1,
            setProfileInfoTitle2,
            setProfileInfoTitle3,
            setProfileInfoTitle4
          ][n - 1];
          const setBody = [
            setProfileInfo1,
            setProfileInfo2,
            setProfileInfo3,
            setProfileInfo4
          ][n - 1];
          return (
            <div key={n} className="space-y-2">
              <p
                className={
                  locked ? 'text-sm text-gray-600' : 'text-sm text-gray-300'
                }
              >
                Profile info block {n}
                {locked && (
                  <span className="ml-2 text-xs text-gray-600">
                    (not in your rank)
                  </span>
                )}
              </p>
              <input
                type="text"
                value={titleState}
                onChange={(e) => setTitle(e.target.value)}
                disabled={locked}
                placeholder="Title (optional)"
                maxLength={128}
                className={inputClass + (locked ? ' opacity-40' : '')}
              />
              <textarea
                value={bodyState}
                onChange={(e) => setBody(e.target.value)}
                disabled={locked}
                placeholder="Body…"
                maxLength={5000}
                rows={3}
                className={inputClass + (locked ? ' opacity-40' : '')}
              />
            </div>
          );
        })}

        <button
          type="submit"
          disabled={isSavingRewards}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isSavingRewards ? 'Saving…' : 'Save donor settings'}
        </button>
      </form>

      {/* Forum title */}
      <form
        onSubmit={handleSaveTitle}
        className="bg-gray-800 rounded-lg border border-gray-700 p-5 space-y-4"
      >
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
          Forum Title
          {!perks.forumTitle && (
            <span className="ml-2 text-xs text-gray-600 font-normal normal-case">
              — not in your current rank
            </span>
          )}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="donor-title-prefix"
              className={perks.forumTitle ? labelClass : lockedClass}
            >
              Prefix
            </label>
            <input
              id="donor-title-prefix"
              type="text"
              value={titlePrefix}
              onChange={(e) => setTitlePrefix(e.target.value)}
              disabled={!perks.forumTitle}
              maxLength={64}
              className={inputClass + (!perks.forumTitle ? ' opacity-40' : '')}
            />
          </div>
          <div>
            <label
              htmlFor="donor-title-suffix"
              className={perks.forumTitle ? labelClass : lockedClass}
            >
              Suffix
            </label>
            <input
              id="donor-title-suffix"
              type="text"
              value={titleSuffix}
              onChange={(e) => setTitleSuffix(e.target.value)}
              disabled={!perks.forumTitle}
              maxLength={64}
              className={inputClass + (!perks.forumTitle ? ' opacity-40' : '')}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={titleUseComma}
            onChange={(e) => setTitleUseComma(e.target.checked)}
            disabled={!perks.forumTitle}
            className="accent-indigo-500 disabled:opacity-40"
          />
          <span
            className={`text-sm ${
              perks.forumTitle ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Separate prefix/suffix with comma
          </span>
        </label>

        <button
          type="submit"
          disabled={isSavingTitle || !perks.forumTitle}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isSavingTitle ? 'Saving…' : 'Save forum title'}
        </button>
      </form>
    </div>
  );
};

export default DonorSettingsTab;
