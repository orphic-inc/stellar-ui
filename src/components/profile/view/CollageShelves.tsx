import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { COLLAGE_CATEGORY_LABELS, type ProfileView } from './profileView';

type Shelves = ProfileView['collageShelves'];
type FeaturedCollage = Shelves['featuredPersonalCollages'][number];
type PublicCollage = Shelves['publicCollages'][number];

/** Up to four covers, or an empty tile of `emptyClass` when there are none. */
const CoverGrid = ({
  collageId,
  covers,
  keyPrefix,
  imageClass,
  emptyClass
}: {
  collageId: number;
  covers: string[];
  keyPrefix: string;
  imageClass: string;
  emptyClass: string;
}) =>
  covers.length > 0 ? (
    <>
      {covers.slice(0, 4).map((image, index) => (
        <img
          key={`${collageId}${keyPrefix}-${index}`}
          src={image}
          alt=""
          className={imageClass}
        />
      ))}
    </>
  ) : (
    <div className={emptyClass} />
  );

const FeaturedCard = ({ collage }: { collage: FeaturedCollage }) => (
  <Link
    to={`/collages/${collage.id}`}
    className="rounded border border-[var(--st-border)] bg-[var(--st-base)] hover:border-[var(--st-accent-ring)] transition-colors overflow-hidden"
  >
    <div className="grid grid-cols-2 gap-px bg-[var(--st-border)]">
      <CoverGrid
        collageId={collage.id}
        covers={collage.coverImagesSrc}
        keyPrefix=""
        imageClass="aspect-square w-full object-cover"
        emptyClass="col-span-2 aspect-[2/1] bg-[var(--st-base)]"
      />
    </div>
    <div className="p-3">
      <div className="text-sm font-medium text-[var(--st-text-strong)]">
        {collage.name}
      </div>
      <div className="mt-1 text-xs text-[var(--st-text-muted)]">
        {collage.numEntries} entries
      </div>
    </div>
  </Link>
);

const PublicRow = ({ collage }: { collage: PublicCollage }) => (
  <Link
    to={`/collages/${collage.id}`}
    className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--st-border)]/30 transition-colors"
  >
    <div className="grid h-16 w-20 shrink-0 grid-cols-2 gap-px overflow-hidden rounded bg-[var(--st-border)]">
      <CoverGrid
        collageId={collage.id}
        covers={collage.coverImagesSrc}
        keyPrefix="-public"
        imageClass="h-full w-full object-cover"
        emptyClass="col-span-2 h-full w-full bg-[var(--st-base)]"
      />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-[var(--st-text-strong)]">
        {collage.name}
      </div>
      <div className="mt-1 text-xs text-[var(--st-text-muted)]">
        {COLLAGE_CATEGORY_LABELS[collage.categoryId] ?? 'Collage'} ·{' '}
        {collage.numEntries} entries
      </div>
    </div>
    <div className="shrink-0 text-xs text-[var(--st-text-muted)]">
      {new Date(collage.updatedAt).toLocaleDateString()}
    </div>
  </Link>
);

const ShelfPanel = ({
  title,
  bodyClass,
  children
}: {
  title: string;
  bodyClass: string;
  children: ReactNode;
}) => (
  <div data-st="panel">
    <div data-st="colhead" data-st-title>
      <span>{title}</span>
    </div>
    <div className={bodyClass}>{children}</div>
  </div>
);

const CollageShelves = ({ shelves }: { shelves: Shelves }) => {
  const featured = shelves.featuredPersonalCollages;
  const published = shelves.publicCollages;
  if (featured.length === 0 && published.length === 0) return null;
  return (
    <div className="space-y-4">
      {featured.length > 0 && (
        <ShelfPanel
          title="Featured Shelves"
          bodyClass="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {featured.map((collage) => (
            <FeaturedCard key={collage.id} collage={collage} />
          ))}
        </ShelfPanel>
      )}
      {published.length > 0 && (
        <ShelfPanel
          title="Public Collages"
          bodyClass="divide-y divide-[var(--st-border-subtle)]"
        >
          {published.map((collage) => (
            <PublicRow key={collage.id} collage={collage} />
          ))}
        </ShelfPanel>
      )}
    </div>
  );
};

export default CollageShelves;
