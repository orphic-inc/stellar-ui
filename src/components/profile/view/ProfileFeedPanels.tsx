import { Link } from 'react-router-dom';
import { BBCodeContent } from '../../ui';
import Time from '../../layout/Time';
import type { ProfileView } from './profileView';

type Contribution = ProfileView['recentContributions'][number];
type Snatch = ProfileView['recentSnatches'][number];

const releasePath = (release: { communityId: number | null; id: number }) =>
  `/communities/${release.communityId}/releases/${release.id}`;

export const ProfileInfoPanel = ({ html }: { html?: string | null }) => {
  if (!html) return null;
  return (
    <div data-st="panel">
      <div data-st="colhead" data-st-title>
        <span>Profile</span>
      </div>
      {/* Was the one BBCode surface rendering WITHOUT `.bbcode-content`,
          so its quotes, code blocks and lists went unstyled. The shared
          component owns the wrapper, which is how that stops recurring. */}
      <BBCodeContent data-st="prose" className="p-4 text-sm" html={html} />
    </div>
  );
};

const ContributionCard = ({ item }: { item: Contribution }) => (
  <Link
    to={releasePath(item.release)}
    className="overflow-hidden rounded border border-[var(--st-border-subtle)] bg-[var(--st-base)] hover:border-[var(--st-accent-ring)] transition-colors"
  >
    <div className="aspect-square bg-[var(--st-base)]">
      {item.release.imageSrc ? (
        <img
          src={item.release.imageSrc}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
    <div className="p-3">
      <div className="truncate text-sm font-medium text-[var(--st-text-strong)]">
        {item.release.title}
      </div>
      {item.release.artist && (
        <div className="mt-1 truncate text-xs text-[var(--st-text-muted)]">
          {item.release.artist.name}
        </div>
      )}
      <div className="mt-2 text-xs text-[var(--st-text-muted)]">
        <Time date={item.createdAt} />
      </div>
    </div>
  </Link>
);

export const RecentContributionsPanel = ({
  items
}: {
  items: Contribution[];
}) => (
  <div data-st="panel">
    <div data-st="colhead" data-st-title>
      <span>Recent Contributions</span>
    </div>
    {items.length ? (
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <ContributionCard key={item.id} item={item} />
        ))}
      </div>
    ) : (
      <div className="px-4 py-3 text-sm text-[var(--st-text-muted)]">
        No recent contributions.
      </div>
    )}
  </div>
);

const SnatchRow = ({ item }: { item: Snatch }) => (
  <div className="px-4 py-3 flex items-center justify-between gap-4 text-sm">
    <div className="min-w-0">
      <Link to={releasePath(item.release)} data-st="control">
        {item.release.title}
      </Link>
      {item.artist && (
        <div className="text-xs text-[var(--st-text-muted)]">
          {item.artist.name}
        </div>
      )}
    </div>
    <span className="shrink-0 text-xs text-[var(--st-text-muted)]">
      <Time date={item.downloadedAt} />
    </span>
  </div>
);

export const RecentSnatchesPanel = ({ items }: { items: Snatch[] }) => {
  if (items.length === 0) return null;
  return (
    <div data-st="panel">
      <div data-st="colhead" data-st-title>
        <span>Recent Snatches</span>
      </div>
      <div className="divide-y divide-[var(--st-border-subtle)]">
        {items.map((item) => (
          <SnatchRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
