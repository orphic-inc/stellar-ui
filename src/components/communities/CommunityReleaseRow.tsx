import { Link } from 'react-router-dom';
import type { CommunityReleasesResponse } from '../../store/services/communityApi';
import DownloadButton from './DownloadButton';
import LinkStatusBadge from './LinkStatusBadge';
import RatioExemptBadge from './RatioExemptBadge';
import { formatSize } from '../../utils';
import { releaseCover } from '../../utils/releaseCover';

type CommunityRelease = CommunityReleasesResponse['data'][number];
type Contribution = CommunityRelease['contributions'][number];
type ReleaseProps = { release: CommunityRelease; to: string };
type FormatRowProps = {
  contribution: Contribution;
  canDownload: boolean;
  onReport: (contributionId: number) => void;
};

const MusicNote = () => (
  <svg
    className="w-5 h-5 text-gray-600"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
  </svg>
);

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

// The group's canonical cover wins over this release's own (#318): this list
// is where two communities' copies of one album most visibly diverge.
const Cover = ({ release, to }: ReleaseProps) => {
  const cover = releaseCover(release.group, release);
  return (
    <Link to={to} className="shrink-0" tabIndex={-1}>
      {cover ? (
        <img
          src={cover}
          alt=""
          className="w-14 h-14 object-cover rounded border border-gray-700"
        />
      ) : (
        <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded flex items-center justify-center">
          <MusicNote />
        </div>
      )}
    </Link>
  );
};

const TitleLine = ({ release, to }: ReleaseProps) => {
  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      {release.artist && (
        <>
          <span data-st="meta" data-st-em className="text-sm">
            {release.artist.name}
          </span>
          <span data-st="meta" className="text-sm">
            —
          </span>
        </>
      )}
      <Link to={to} data-st="title" className="text-sm">
        {release.title}
      </Link>
      {release.year && (
        <span data-st="meta" data-st-num className="text-xs">
          [{release.year}]
        </span>
      )}
      {release.type && (
        <span data-st="meta" className="text-xs">
          [{release.type}]
        </span>
      )}
    </div>
  );
};

const Tags = ({ release }: { release: CommunityRelease }) => {
  const tags = (release as { tags?: { name: string }[] }).tags ?? [];
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {tags.map((t) => (
        <span key={t.name} data-st="chip">
          {t.name}
        </span>
      ))}
    </div>
  );
};

/** Release-level stats: distinct contributors, and snatches across formats. */
const Stats = ({ contributions }: { contributions: Contribution[] }) => {
  const contributorCount = new Set(contributions.map((c) => c.user.id)).size;
  const consumerCount = contributions.reduce(
    (sum, c) => sum + c._count.consumers,
    0
  );
  return (
    <div className="shrink-0 self-center text-right space-y-0.5 whitespace-nowrap">
      {contributorCount > 0 && (
        <div data-st="meta" data-st-num className="text-xs">
          {plural(contributorCount, 'contributor', 'contributors')}
        </div>
      )}
      {consumerCount > 0 && (
        <div data-st="meta" data-st-num className="text-xs">
          {plural(consumerCount, 'snatch', 'snatches')}
        </div>
      )}
    </div>
  );
};

/** One format of the release: a contribution, with its download and report. */
const FormatRow = ({
  contribution: c,
  canDownload,
  onReport
}: FormatRowProps) => {
  return (
    <div data-st="row">
      <span data-st="chip" data-st-mono className="shrink-0">
        {c.type}
      </span>
      <span data-st="meta" data-st-num className="text-xs w-20 shrink-0">
        {c.sizeInBytes ? formatSize(Number(c.sizeInBytes)) : '—'}
      </span>
      <Link
        to={`/user/${c.user.username}`}
        className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
      >
        {c.user.username}
      </Link>
      <span data-st="meta" data-st-num className="text-xs shrink-0">
        {plural(c._count.consumers, 'snatch', 'snatches')}
      </span>
      <LinkStatusBadge status={c.linkStatus} />
      <RatioExemptBadge value={c.ratioExempt} />
      <div className="flex gap-2 items-center ml-auto">
        <DownloadButton contributionId={c.id} canDownload={canDownload} />
        <button
          type="button"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          title="Report dead or misleading link"
          onClick={() => onReport(c.id)}
        >
          [Report]
        </button>
      </div>
    </div>
  );
};

/**
 * One release in a community's release list: its header row, then a row per
 * format. Split out of CommunityPage, whose list callback had grown past the
 * complexity limits (#475).
 */
const CommunityReleaseRow = ({
  release,
  communityId,
  canDownload,
  onReport
}: {
  release: CommunityRelease;
  communityId: string | number;
  canDownload: boolean;
  onReport: (contributionId: number) => void;
}) => {
  const to = `/communities/${communityId}/releases/${release.id}`;
  const { contributions } = release;
  return (
    <>
      <div data-st="row">
        <Cover release={release} to={to} />
        <div className="flex-1 min-w-0">
          <TitleLine release={release} to={to} />
          <Tags release={release} />
        </div>
        <Stats contributions={contributions} />
      </div>
      {contributions.length > 0 && (
        <div data-st="list" className="pl-[4.25rem]">
          {contributions.map((c) => (
            <FormatRow
              key={c.id}
              contribution={c}
              canDownload={canDownload}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default CommunityReleaseRow;
