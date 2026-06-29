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

// Layout-only now; the paint comes from `data-st="field"` / `data-st="meta"` on
// each site. Locked variants just dim + flag not-allowed; the token color stays.
const inputClass = 'w-full';
const labelClass = 'block text-sm mb-1';
const lockedClass = 'block text-sm mb-1 cursor-not-allowed opacity-50';

const LockedNote = () => (
  <p data-st="meta" className="text-xs mt-1">
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
        data-st="panel"
        className="p-5 space-y-5"
      >
        <h3
          data-st="prose"
          data-st-strong
          className="text-sm uppercase tracking-wider"
        >
          Donor Rewards
        </h3>

        {/* Icons */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="donor-custom-icon"
              data-st="meta"
              className={perks.customIcon ? labelClass : lockedClass}
            >
              Custom icon URL
            </label>
            <input
              id="donor-custom-icon"
              type="text"
              data-st="field"
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
              data-st="meta"
              className={perks.customIconLink ? labelClass : lockedClass}
            >
              Custom icon link URL
            </label>
            <input
              id="donor-custom-icon-link"
              type="text"
              data-st="field"
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
              data-st="meta"
              className={perks.iconMouseOverText ? labelClass : lockedClass}
            >
              Icon mouseover text
            </label>
            <input
              id="donor-icon-mouseover"
              type="text"
              data-st="field"
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
            data-st="meta"
            className={perks.secondAvatar ? labelClass : lockedClass}
          >
            Second (donor) avatar URL
          </label>
          <input
            id="donor-second-avatar"
            type="text"
            data-st="field"
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
            data-st="meta"
            className={perks.avatarMouseOverText ? labelClass : lockedClass}
          >
            Avatar mouseover text
          </label>
          <input
            id="donor-avatar-mouseover"
            type="text"
            data-st="field"
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
                data-st="meta"
                className={locked ? 'text-sm opacity-50' : 'text-sm'}
              >
                Profile info block {n}
                {locked && (
                  <span className="ml-2 text-xs">(not in your rank)</span>
                )}
              </p>
              <input
                type="text"
                value={titleState}
                onChange={(e) => setTitle(e.target.value)}
                disabled={locked}
                placeholder="Title (optional)"
                maxLength={128}
                data-st="field"
                className={inputClass + (locked ? ' opacity-40' : '')}
              />
              <textarea
                value={bodyState}
                onChange={(e) => setBody(e.target.value)}
                disabled={locked}
                placeholder="Body…"
                maxLength={5000}
                rows={3}
                data-st="field"
                className={inputClass + (locked ? ' opacity-40' : '')}
              />
            </div>
          );
        })}

        <button
          type="submit"
          disabled={isSavingRewards}
          data-st="control"
          data-st-primary
          className="w-full text-sm"
        >
          {isSavingRewards ? 'Saving…' : 'Save donor settings'}
        </button>
      </form>

      {/* Forum title */}
      <form
        onSubmit={handleSaveTitle}
        data-st="panel"
        className="p-5 space-y-4"
      >
        <h3
          data-st="prose"
          data-st-strong
          className="text-sm uppercase tracking-wider"
        >
          Forum Title
          {!perks.forumTitle && (
            <span
              data-st="meta"
              className="ml-2 text-xs font-normal normal-case"
            >
              — not in your current rank
            </span>
          )}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="donor-title-prefix"
              data-st="meta"
              className={perks.forumTitle ? labelClass : lockedClass}
            >
              Prefix
            </label>
            <input
              id="donor-title-prefix"
              type="text"
              data-st="field"
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
              data-st="meta"
              className={perks.forumTitle ? labelClass : lockedClass}
            >
              Suffix
            </label>
            <input
              id="donor-title-suffix"
              type="text"
              data-st="field"
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
            data-st="field"
            className="disabled:opacity-40"
          />
          <span
            data-st="meta"
            className={`text-sm ${perks.forumTitle ? '' : 'opacity-50'}`}
          >
            Separate prefix/suffix with comma
          </span>
        </label>

        <button
          type="submit"
          disabled={isSavingTitle || !perks.forumTitle}
          data-st="control"
          data-st-primary
          className="w-full text-sm"
        >
          {isSavingTitle ? 'Saving…' : 'Save forum title'}
        </button>
      </form>
    </div>
  );
};

export default DonorSettingsTab;
