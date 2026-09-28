import type { RatioExempt } from '../../types';
import { Badge, type BadgeVariant } from '../ui';

interface Props {
  value: RatioExempt;
}

type Exemption = Exclude<RatioExempt, 'NONE'>;

// Labels use PRD-06's terms. The legacy implementation's "Freeleech!" and
// "Neutral Leech!" named the same two exemptions (ui#181).
const BADGES: Record<
  Exemption,
  { label: string; variant: BadgeVariant; title: string }
> = {
  FREEPASS: {
    label: 'Freepass',
    variant: 'success',
    title:
      "Downloading this doesn't count against your ratio. The contributor is still credited."
  },
  NEUTRALPASS: {
    label: 'Neutralpass',
    variant: 'info',
    title:
      "Ratio-neutral: counts toward nobody's ratio, downloader or contributor."
  }
};

/**
 * A contribution's ratio exemption. Renders nothing for the ordinary `NONE`,
 * and nothing for a value it does not know either: a badge is not worth
 * failing the whole row over an api that is newer or older than this build.
 */
const RatioExemptBadge = ({ value }: Props) => {
  if (!Object.hasOwn(BADGES, value)) return null;
  const { label, variant, title } = BADGES[value as Exemption];
  return (
    <Badge variant={variant} title={title}>
      {label}
    </Badge>
  );
};

export default RatioExemptBadge;
