import { Link } from 'react-router-dom';
import { useGetMyRatioStatsQuery } from '../../store/services/profileApi';
import { formatBytes } from '../../utils';

const BRACKETS = [
  { range: '0–5 GiB', maxRequired: 0.0, minRequired: 0.0 },
  { range: '5–10 GiB', maxRequired: 0.15, minRequired: 0.0 },
  { range: '10–20 GiB', maxRequired: 0.2, minRequired: 0.0 },
  { range: '20–30 GiB', maxRequired: 0.3, minRequired: 0.05 },
  { range: '30–40 GiB', maxRequired: 0.4, minRequired: 0.1 },
  { range: '40–50 GiB', maxRequired: 0.5, minRequired: 0.2 },
  { range: '50–60 GiB', maxRequired: 0.6, minRequired: 0.3 },
  { range: '60–80 GiB', maxRequired: 0.6, minRequired: 0.4 },
  { range: '80–100 GiB', maxRequired: 0.6, minRequired: 0.5 },
  { range: '100+ GiB', maxRequired: 0.6, minRequired: 0.6 }
];

// Layout-only; the colhead/row table variant (ADR-0006) carries the paint.
const td = 'text-sm';

const RatioRulesPage = () => {
  const { data: stats } = useGetMyRatioStatsQuery();

  let ratioColor = 'text-[var(--st-text)]';
  if (stats != null) {
    ratioColor = stats.meetsRequirement
      ? 'text-[var(--st-success)]'
      : 'text-[var(--st-danger)]';
  }

  return (
    <div
      data-st="prose"
      className="max-w-3xl mx-auto px-4 py-8 space-y-8 text-sm leading-relaxed"
    >
      <div>
        <Link to="/private/" data-st="control" className="text-xs">
          ← Home
        </Link>
        <h1 data-st="prose" data-st-strong className="mt-2 text-2xl">
          Ratio Rules
        </h1>
      </div>

      {stats && (
        <div data-st="panel" className="p-4 flex flex-wrap gap-6 text-sm">
          <div>
            <span data-st="meta" className="text-xs uppercase tracking-wide">
              Your Ratio
            </span>
            <p className={`text-xl font-bold mt-0.5 ${ratioColor}`}>
              {stats.ratio.toFixed(3)}
            </p>
          </div>
          <div>
            <span data-st="meta" className="text-xs uppercase tracking-wide">
              Required
            </span>
            <p data-st="prose" data-st-strong className="text-xl mt-0.5">
              {stats.requiredRatio.toFixed(3)}
            </p>
          </div>
          <div>
            <span data-st="meta" className="text-xs uppercase tracking-wide">
              Uploaded
            </span>
            <p data-st="prose" data-st-strong className="text-base mt-0.5">
              {formatBytes(Number(stats.contributed))}
            </p>
          </div>
          <div>
            <span data-st="meta" className="text-xs uppercase tracking-wide">
              Downloaded
            </span>
            <p data-st="prose" data-st-strong className="text-base mt-0.5">
              {formatBytes(Number(stats.consumed))}
            </p>
          </div>
          <div>
            <span data-st="meta" className="text-xs uppercase tracking-wide">
              Bracket
            </span>
            <p data-st="prose" data-st-strong className="text-base mt-0.5">
              {stats.bracket.label}
            </p>
          </div>
          <div>
            <span data-st="meta" className="text-xs uppercase tracking-wide">
              Contribution Coverage
            </span>
            <p
              className={`text-base font-medium mt-0.5 ${
                stats.contributionCoverage >= 1
                  ? 'text-[var(--st-success)]'
                  : 'text-[var(--st-warning)]'
              }`}
            >
              {(stats.contributionCoverage * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <p>
          Your <strong className="text-[var(--st-text-strong)]">ratio</strong>{' '}
          is the amount you&apos;ve uploaded divided by the amount you&apos;ve
          downloaded. Every account starts with{' '}
          <strong className="text-[var(--st-text-strong)]">
            5 GiB of free upload credit
          </strong>{' '}
          so you can begin downloading immediately without needing to contribute
          first.
        </p>
        <p>
          To maintain downloading privileges we require that you keep your ratio
          above a minimum threshold called your{' '}
          <strong className="text-[var(--st-text-strong)]">
            required ratio
          </strong>
          . If your ratio falls below this threshold your account enters{' '}
          <strong className="text-[var(--st-text-strong)]">ratio watch</strong>.
          You will have{' '}
          <strong className="text-[var(--st-text-strong)]">two weeks</strong> to
          bring your ratio back above the required level — failing to do so will
          result in your downloading privileges being automatically suspended.
        </p>
        <p>
          Your required ratio is{' '}
          <strong className="text-[var(--st-text-strong)]">not</strong> a fixed
          number. It is unique to you and is calculated from how much you have
          downloaded and how much of that download volume is covered by your
          approved contributions to the community.
        </p>
      </section>

      <section className="space-y-3">
        <h2 data-st="prose" data-st-strong className="text-lg">
          How Required Ratio Is Calculated
        </h2>
        <p>
          The calculation is done in two steps. First, your{' '}
          <strong className="text-[var(--st-text-strong)]">
            download bracket
          </strong>{' '}
          is determined by how much you have downloaded in total:
        </p>

        <div data-st="panel" className="overflow-x-auto">
          <table data-st="grid" className="w-full">
            <thead data-st="colhead">
              <tr>
                <th>Amount Downloaded</th>
                <th>Required (0% coverage)</th>
                <th>Required (100% coverage)</th>
              </tr>
            </thead>
            <tbody>
              {BRACKETS.map((b) => (
                <tr
                  key={b.range}
                  data-st="row"
                  data-st-open={
                    stats?.bracket.label === b.range ? '' : undefined
                  }
                >
                  <td className={td + ' font-medium'}>
                    {b.range}
                    {stats?.bracket.label === b.range && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--st-accent)]">
                        ← your bracket
                      </span>
                    )}
                  </td>
                  <td className={td}>{b.maxRequired.toFixed(2)}</td>
                  <td className={td}>{b.minRequired.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Second, your{' '}
          <strong className="text-[var(--st-text-strong)]">
            contribution coverage
          </strong>{' '}
          is calculated: the ratio of your approved contribution bytes to your
          total downloaded bytes (capped at 100%). Your final required ratio
          falls between the two columns in your bracket depending on this
          coverage percentage.
        </p>

        <div data-st="panel" className="p-4 font-mono text-xs">
          required = max(minRequired, maxRequired × (1 − coverage))
        </div>

        <p>
          For example, if you have downloaded 25 GiB your bracket is{' '}
          <strong className="text-[var(--st-text-strong)]">20–30 GiB</strong>.
          If you have zero contribution coverage your required ratio is{' '}
          <strong className="text-[var(--st-text-strong)]">0.30</strong>. If you
          have contributed files covering 50% of your downloads your required
          ratio drops to{' '}
          <strong className="text-[var(--st-text-strong)]">0.175</strong> (max
          0.30 × 0.50 = 0.15, floored at min 0.05 → 0.175).
        </p>
      </section>

      <section className="space-y-3">
        <h2 data-st="prose" data-st-strong className="text-lg">
          Contribution Coverage
        </h2>
        <p>
          When you upload files to the community, those contributions are
          reviewed by staff. Once approved, the credited bytes count toward your
          contribution coverage. A contribution must be at least{' '}
          <strong className="text-[var(--st-text-strong)]">72 hours old</strong>{' '}
          before it becomes eligible for coverage credit, to prevent abuse.
        </p>
        <p>
          Increasing your contribution coverage is the most reliable way to
          lower your required ratio, because it directly represents your
          positive impact on the community&apos;s library.
        </p>
      </section>

      <section className="space-y-3">
        <h2 data-st="prose" data-st-strong className="text-lg">
          Important Information
        </h2>
        <ul className="space-y-2 list-disc list-inside marker:text-[var(--st-text-faint)]">
          <li>
            If your ratio drops below your required ratio, you will be placed on{' '}
            <strong className="text-[var(--st-text-strong)]">
              ratio watch
            </strong>
            . You have{' '}
            <strong className="text-[var(--st-text-strong)]">two weeks</strong>{' '}
            to fix it — failure to do so will result in downloading being
            automatically disabled.
          </li>
          <li>
            If you download more than 10 GiB while on ratio watch, your
            downloading will be{' '}
            <strong className="text-[var(--st-text-strong)]">
              instantly disabled
            </strong>
            .
          </li>
          <li>
            Everyone gets to download the first 5 GiB free before ratio watch
            can be triggered.
          </li>
          <li>
            To get off ratio watch, raise your ratio above the required level by
            uploading more credit or contributing approved files to the
            community.
          </li>
          <li>
            If your downloading has been disabled, contact staff to appeal or to
            have your ratio manually reviewed.
          </li>
          <li>
            The ratio watch system is automatic and cannot be manually bypassed
            by staff except through a formal ratio override.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default RatioRulesPage;
