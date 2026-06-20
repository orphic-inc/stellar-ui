import { useGetMyProgressionQuery } from '../../store/services/profileApi';
import { formatBytes } from '../../utils';
import Spinner from '../layout/Spinner';

const EXTRA_LABELS: Record<string, string> = {
  DISTINCT_RELEASES_500: '500 distinct releases',
  QUALITY_CONTRIB_500: '500 quality contributions (lossless or log+cue)'
};

const ProgressToNextClass = () => {
  const { data, isLoading } = useGetMyProgressionQuery();

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const { gap, currentRankName } = data;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mt-4">
      <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-300">
        Class Progress
      </div>

      {gap === null ? (
        <div className="px-4 py-3 text-sm text-gray-300">
          You&rsquo;ve reached the highest class
          {currentRankName ? (
            <>
              {' '}
              (
              <span className="text-indigo-300 font-medium">
                {currentRankName}
              </span>
              ).
            </>
          ) : (
            '.'
          )}
        </div>
      ) : (
        <>
          <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700/50">
            Toward{' '}
            <span className="text-indigo-300 font-medium">
              {gap.toRankName ?? 'the next class'}
            </span>
          </div>
          <ul className="divide-y divide-gray-700/50 text-sm">
            {Number(gap.contributedShortBytes) > 0 && (
              <li className="flex justify-between px-4 py-2 text-gray-400">
                <span>Upload more</span>
                <span className="text-gray-200 font-medium">
                  {formatBytes(Number(gap.contributedShortBytes))}
                </span>
              </li>
            )}
            {gap.ratioShort > 0 && (
              <li className="flex justify-between px-4 py-2 text-gray-400">
                <span>Raise ratio by</span>
                <span className="text-gray-200 font-medium">
                  {gap.ratioShort.toFixed(2)}
                </span>
              </li>
            )}
            {gap.contributionsShort > 0 && (
              <li className="flex justify-between px-4 py-2 text-gray-400">
                <span>More contributions</span>
                <span className="text-gray-200 font-medium">
                  {gap.contributionsShort}
                </span>
              </li>
            )}
            {gap.ageShortDays > 0 && (
              <li className="flex justify-between px-4 py-2 text-gray-400">
                <span>Account age</span>
                <span className="text-gray-200 font-medium">
                  {gap.ageShortDays} more day{gap.ageShortDays === 1 ? '' : 's'}
                </span>
              </li>
            )}
            {gap.extraUnmet && (
              <li className="flex justify-between px-4 py-2 text-gray-400">
                <span>Also needs</span>
                <span className="text-gray-200 font-medium text-right">
                  {EXTRA_LABELS[gap.extraUnmet] ?? gap.extraUnmet}
                </span>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default ProgressToNextClass;
