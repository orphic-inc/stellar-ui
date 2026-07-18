import { Link } from 'react-router-dom';
import { useGetMyRatioStatsQuery } from '../../store/services/profileApi';
import { formatBytes } from '../../utils';
import Spinner from '../layout/Spinner';

const RatioStats = () => {
  const { data: stats, isLoading } = useGetMyRatioStatsQuery();

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const ratioColor = stats.meetsRequirement
    ? 'text-[var(--st-success)]'
    : 'text-[var(--st-danger)]';

  return (
    <div data-st="panel" className="mt-4">
      <div data-st="colhead">Upload / Download</div>

      {stats.policy?.status === 'LEECH_DISABLED' && (
        <div className="border-b border-[color-mix(in_oklch,var(--st-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-danger)_12%,transparent)] px-4 py-3 text-sm text-[var(--st-danger)]">
          <strong>Downloads disabled.</strong> Your ratio fell below the
          required threshold and your download access has been suspended.
          Contact staff to appeal.
        </div>
      )}

      {stats.policy?.status === 'WATCH' && (
        <div className="border-b border-[color-mix(in_oklch,var(--st-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-warning)_12%,transparent)] px-4 py-3 text-sm text-[var(--st-warning)]">
          <strong>Ratio watch active.</strong> Your ratio is below the required
          minimum. Improve your ratio to avoid download suspension.
        </div>
      )}

      <ul className="divide-y divide-[var(--st-border-subtle)] text-sm">
        <li data-st="meta" className="flex justify-between px-4 py-2">
          <span>Uploaded</span>
          <span className="font-medium text-[var(--st-success)]">
            {formatBytes(Number(stats.contributed))}
          </span>
        </li>
        <li data-st="meta" className="flex justify-between px-4 py-2">
          <span>Downloaded</span>
          <span data-st="prose" data-st-strong>
            {formatBytes(Number(stats.consumed))}
          </span>
        </li>
        <li data-st="meta" className="flex justify-between px-4 py-2">
          <span>Ratio</span>
          <span className={ratioColor + ' font-medium'}>
            {stats.ratio.toFixed(3)}
            {stats.requiredRatio > 0 && (
              <span data-st="meta" className="text-xs ml-1">
                (req. {stats.requiredRatio.toFixed(3)})
              </span>
            )}
          </span>
        </li>
        <li data-st="meta" className="flex justify-between px-4 py-2">
          <span>Bracket</span>
          <span data-st="prose" data-st-strong className="text-xs">
            {stats.bracket.label}
          </span>
        </li>
        <li data-st="meta" className="flex justify-between px-4 py-2">
          <span>Contribution coverage</span>
          <span
            className={
              stats.contributionCoverage >= 1
                ? 'text-[var(--st-success)]'
                : 'text-[var(--st-warning)]'
            }
          >
            {(stats.contributionCoverage * 100).toFixed(0)}%
          </span>
        </li>
        <li data-st="meta" className="flex justify-between px-4 py-2">
          <span>Eligible contributions</span>
          <span data-st="prose" data-st-strong>
            {formatBytes(Number(stats.eligibleContributionBytes))}
          </span>
        </li>
      </ul>

      <div className="px-4 py-2 border-t border-[var(--st-border)] text-xs">
        <Link to="/ratio" data-st="control">
          Ratio rules →
        </Link>
      </div>
    </div>
  );
};

export default RatioStats;
