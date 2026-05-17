import { Link } from 'react-router-dom';
import { useGetMyRatioStatsQuery } from '../../store/services/profileApi';
import { formatBytes } from '../../utils';
import Spinner from '../layout/Spinner';

const RatioStats = () => {
  const { data: stats, isLoading } = useGetMyRatioStatsQuery();

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const ratioColor = stats.meetsRequirement ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mt-4">
      <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-300">
        Upload / Download
      </div>

      {stats.policy?.status === 'LEECH_DISABLED' && (
        <div className="bg-red-950/40 border-b border-red-900/40 px-4 py-3 text-sm text-red-300">
          <strong>Downloads disabled.</strong> Your ratio fell below the
          required threshold and your download access has been suspended.
          Contact staff to appeal.
        </div>
      )}

      {stats.policy?.status === 'WATCH' && (
        <div className="bg-yellow-950/40 border-b border-yellow-900/40 px-4 py-3 text-sm text-yellow-300">
          <strong>Ratio watch active.</strong> Your ratio is below the required
          minimum. Improve your ratio to avoid download suspension.
        </div>
      )}

      <ul className="divide-y divide-gray-700/50 text-sm">
        <li className="flex justify-between px-4 py-2 text-gray-400">
          <span>Uploaded</span>
          <span className="text-green-400 font-medium">
            {formatBytes(Number(stats.totalEarned))}
          </span>
        </li>
        <li className="flex justify-between px-4 py-2 text-gray-400">
          <span>Downloaded</span>
          <span className="text-gray-200">
            {formatBytes(Number(stats.consumed))}
          </span>
        </li>
        <li className="flex justify-between px-4 py-2 text-gray-400">
          <span>Ratio</span>
          <span className={ratioColor + ' font-medium'}>
            {stats.ratio.toFixed(3)}
            {stats.requiredRatio > 0 && (
              <span className="text-gray-500 text-xs ml-1">
                (req. {stats.requiredRatio.toFixed(3)})
              </span>
            )}
          </span>
        </li>
        <li className="flex justify-between px-4 py-2 text-gray-400">
          <span>Bracket</span>
          <span className="text-gray-200 text-xs">{stats.bracket.label}</span>
        </li>
        <li className="flex justify-between px-4 py-2 text-gray-400">
          <span>Contribution coverage</span>
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
        <li className="flex justify-between px-4 py-2 text-gray-400">
          <span>Eligible contributions</span>
          <span className="text-gray-200">
            {formatBytes(Number(stats.eligibleContributionBytes))}
          </span>
        </li>
      </ul>

      <div className="px-4 py-2 border-t border-gray-700 text-xs">
        <Link
          to="/private/ratio"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Ratio rules →
        </Link>
      </div>
    </div>
  );
};

export default RatioStats;
