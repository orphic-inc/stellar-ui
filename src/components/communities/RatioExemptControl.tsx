import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSetContributionRatioExemptMutation } from '../../store/services/ratioExemptApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { hasPermission } from '../../utils/permissions';
import type { RatioExempt, ReleaseContributionDetail } from '../../types';

const OPTIONS: { value: RatioExempt; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'FREEPASS', label: 'Freepass' },
  { value: 'NEUTRALPASS', label: 'Neutralpass' }
];

type Props = { contribution: ReleaseContributionDetail };

/**
 * Staff set or clear a file's Freepass / Neutralpass from its edition row
 * (#392). Renders nothing without `contributions_manage`, the permission the
 * api's PUT requires (`admin` implies it on both sides).
 *
 * Applies on change, with no confirmation: a change is reversible, affects
 * only later downloads, and is audited. The chosen value shows while the
 * request is in flight; a failure alerts and returns to the saved value.
 */
/**
 * The select's state and its request. The chosen value is kept with the saved
 * value it replaced, and shows only while that is still the saved value, so
 * the refetched row supersedes it without an effect.
 */
const useRatioExemptChange = (contribution: ReleaseContributionDetail) => {
  const dispatch = useDispatch();
  const [setRatioExempt, { isLoading }] =
    useSetContributionRatioExemptMutation();
  const saved = contribution.ratioExempt;
  const [pending, setPending] = useState<{
    value: RatioExempt;
    over: RatioExempt;
  } | null>(null);

  const change = async (ratioExempt: RatioExempt) => {
    setPending({ value: ratioExempt, over: saved });
    try {
      await setRatioExempt({
        contributionId: contribution.id,
        releaseId: contribution.releaseId,
        ratioExempt
      }).unwrap();
    } catch (err) {
      setPending(null);
      const msg = getApiErrorMessage(err);
      dispatch(
        addAlert(msg ?? 'Could not change the ratio exemption', 'danger')
      );
    }
  };

  const shown = pending?.over === saved ? pending.value : saved;
  return { shown, isLoading, change };
};

const RatioExemptControl = ({ contribution }: Props) => {
  const user = useSelector(selectCurrentUser);
  const { shown, isLoading, change } = useRatioExemptChange(contribution);
  if (!hasPermission(user, 'contributions_manage')) return null;

  return (
    <select
      data-st="field"
      data-st-compact
      className="shrink-0"
      aria-label={`Ratio exemption for ${contribution.type.toUpperCase()}`}
      value={shown}
      disabled={isLoading}
      onChange={(e) => void change(e.target.value as RatioExempt)}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};

export default RatioExemptControl;
