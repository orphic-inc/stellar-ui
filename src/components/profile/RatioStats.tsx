import { useGetMyRatioStatsQuery } from '../../store/services/profileApi';
import Spinner from '../layout/Spinner';

const formatBytes = (bytesStr: string): string => {
  const bytes = Number(bytesStr);
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${bytes} B`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const RatioStats = () => {
  const { data: stats, isLoading } = useGetMyRatioStatsQuery();

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const ratioColor = stats.meetsRequirement ? 'text-green-400' : 'text-red-400';
  const { policy } = stats;

  return (
    <div className="box box_info mt-4">
      <div className="head colhead_dark">Upload / Download</div>

      {policy.status === 'LEECH_DISABLED' && (
        <div className="box_warning p-3 text-sm">
          <strong>Downloads disabled.</strong> Your ratio fell below the
          required threshold and your download access has been suspended.
          Contact staff to appeal.
          {policy.leechDisabledAt && (
            <span className="text-gray-400 ml-1">
              (since {formatDate(policy.leechDisabledAt)})
            </span>
          )}
        </div>
      )}

      {policy.status === 'WATCH' && (
        <div className="box_warning p-3 text-sm">
          <strong>Ratio watch active.</strong> Your ratio is below the required
          minimum. Improve your ratio before{' '}
          {policy.watchExpiresAt
            ? formatDate(policy.watchExpiresAt)
            : 'the deadline'}{' '}
          to avoid download suspension.
        </div>
      )}

      <ul className="stats nobullet">
        <li>
          Uploaded:{' '}
          <span className="text-green-400">
            {formatBytes(stats.totalEarned)}
          </span>
        </li>
        <li>
          Downloaded: <span>{formatBytes(stats.downloaded)}</span>
        </li>
        <li>
          Ratio: <span className={ratioColor}>{stats.ratio.toFixed(3)}</span>
          {stats.requiredRatio > 0 && (
            <span className="text-gray-500 text-xs ml-1">
              (req. {stats.requiredRatio.toFixed(3)})
            </span>
          )}
        </li>
        <li>
          Bracket:{' '}
          <span className="text-gray-400 text-xs">{stats.bracket.label}</span>
        </li>
        <li>
          Contribution coverage:{' '}
          <span
            className={
              stats.contributionCoverage >= 1
                ? 'text-green-400'
                : 'text-yellow-400'
            }
          >
            {(stats.contributionCoverage * 100).toFixed(0)}%
          </span>
        </li>
        <li>
          Eligible contributions:{' '}
          <span>{formatBytes(stats.eligibleContributionBytes)}</span>
        </li>
      </ul>
    </div>
  );
};

export default RatioStats;
