import type { LinkHealthStatus, ReleaseContributionDetail } from '../../types';
import DownloadButton from './DownloadButton';
import LinkStatusBadge from './LinkStatusBadge';
import RatioExemptControl from './RatioExemptControl';

type Props = {
  contribution: ReleaseContributionDetail;
  canDownload: boolean;
  onReport: (contributionId: number) => void;
};

/**
 * The release page's actions on one edition row: link health, download,
 * report, and for staff the ratio exemption (#392). Collage entries render
 * the same stack without any of these.
 */
const EditionRowActions = ({ contribution, canDownload, onReport }: Props) => (
  <span className="flex gap-2 items-center text-xs">
    <LinkStatusBadge
      status={(contribution.linkStatus ?? 'UNKNOWN') as LinkHealthStatus}
    />
    <RatioExemptControl contribution={contribution} />
    <DownloadButton
      contributionId={contribution.id}
      canDownload={canDownload}
    />
    <button
      type="button"
      data-st="control"
      title="Report dead or misleading link"
      onClick={() => onReport(contribution.id)}
    >
      [Report]
    </button>
  </span>
);

export default EditionRowActions;
