import { formatBytes, ordinalSuffix } from '../../utils';
import type { components } from '../../types/api';

type Percentiles = components['schemas']['ProfilePercentiles'];
type DimensionKey = Exclude<keyof Percentiles, 'overall'>;

const formatCount = (value: number) => value.toLocaleString();

/**
 * Legacy order, bounty included (stellar-api#723). A dimension the member's
 * privacy flags hide arrives as `null` and has no tile.
 */
const DIMENSIONS: ReadonlyArray<{
  key: DimensionKey;
  label: string;
  formatRaw: (raw: number) => string;
}> = [
  { key: 'contributed', label: 'Contributed', formatRaw: formatBytes },
  { key: 'consumed', label: 'Consumed', formatRaw: formatBytes },
  { key: 'contributions', label: 'Contributions', formatRaw: formatCount },
  { key: 'requestsFilled', label: 'Requests Filled', formatRaw: formatCount },
  { key: 'bountySpent', label: 'Bounty Spent', formatRaw: formatBytes },
  { key: 'forumPosts', label: 'Forum Posts', formatRaw: formatCount },
  { key: 'artistsAdded', label: 'Artists Added', formatRaw: formatCount }
];

const Tile = ({
  tile
}: {
  tile: { label: string; value: string; meta: string };
}) => (
  <div className="bg-[var(--st-panel)] px-3 py-2">
    <div data-st="meta" className="text-xs uppercase tracking-wide">
      {tile.label}
    </div>
    <div
      data-st="prose"
      data-st-strong
      className="mt-0.5 text-sm font-semibold"
    >
      {tile.value}
    </div>
    <div data-st="meta" className="text-xs">
      {tile.meta}
    </div>
  </div>
);

/**
 * The profile's percentile tiles (#165). Each shows the percentile, the rank
 * among members, and the value behind it on a visible line rather than a hover
 * tooltip, so it reaches touch, keyboard and screen readers.
 *
 * Overall is a weighted score of the percentiles scaled by ratio, not a
 * percentile of anything, so it shows a bare number. The API sends it only when
 * contributed, consumed and ratio are all visible to the viewer.
 */
const PercentileRankings = ({ percentiles }: { percentiles: Percentiles }) => {
  const tiles = DIMENSIONS.flatMap(({ key, label, formatRaw }) => {
    const value = percentiles[key];
    if (!value) return [];
    return [
      {
        label,
        value: `${ordinalSuffix(value.percentile)} percentile`,
        meta: `#${value.rank} of ${value.total} · ${formatRaw(value.raw)}`
      }
    ];
  });
  if (percentiles.overall !== null) {
    tiles.push({
      label: 'Overall',
      value: String(percentiles.overall),
      meta: 'Weighted score · ratio-adjusted'
    });
  }

  return (
    <div data-st="panel">
      <div data-st="colhead">
        <span>Percentile Rankings</span>
      </div>
      <div className="grid gap-px bg-[var(--st-border)] grid-cols-1">
        {tiles.map((tile) => (
          <Tile key={tile.label} tile={tile} />
        ))}
      </div>
    </div>
  );
};

export default PercentileRankings;
