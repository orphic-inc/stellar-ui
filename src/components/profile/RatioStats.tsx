import { useGetMyRatioStatsQuery } from '../../store/services/profileApi';
import Spinner from '../layout/Spinner';

const formatBytes = (bytesStr: string): string => {
  const bytes = Number(bytesStr);
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${bytes} B`;
};

const RatioStats = () => {
  const { data: stats, isLoading } = useGetMyRatioStatsQuery();

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const ratioColor = stats.meetsRequirement ? 'text-green-400' : 'text-red-400';

  return (
    <div className="box box_info mt-4">
      <div className="head colhead_dark">Upload / Download</div>
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
