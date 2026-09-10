import { Link } from 'react-router-dom';
import type { CollageEntry } from '../../store/services/collageApi';
import { releaseCover } from '../../utils/releaseCover';
import AbsorbedCopies from './AbsorbedCopies';

/**
 * The row thumbnail, or a placeholder tile at the same size so the list does
 * not reflow around entries with no art. `src` is already resolved by
 * `releaseCover`, which prefers the release group's cover (#318).
 */
const EntryCover = ({ src }: { src: string | null }) =>
  src ? (
    <img src={src} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
  ) : (
    <div className="w-8 h-8 bg-gray-800 rounded shrink-0" />
  );

import EntryEditions from './EntryEditions';

/**
 * One row of a collage's entry list.
 *
 * A row is not always one entry: where the api collapsed entries sharing a
 * release group (#319), this row stands for every copy in `groupedWith` too.
 * That shows up three ways — a copy-count chip, the copies listed inside the
 * disclosure, and a remove button that means "the album" rather than "this row"
 * (the parent owns that, since permission is per copy).
 *
 * The disclosure is no longer gated on the release's `communityId` alone: a
 * collapsed row must be openable to reach its copies even where the
 * representative has no community.
 */
/**
 * The right-hand cluster of a row: the copy-count chip a collapsed row carries
 * (#319), who added the representative, and the remove control.
 *
 * `onRemove` is null rather than the button being conditionally rendered by the
 * caller, so the one place that decides whether a viewer may remove ANY copy
 * stays in `CollageEntryRow`.
 */
const EntryActions = ({
  copyCount,
  addedBy,
  onRemove
}: {
  copyCount: number | null;
  addedBy: string;
  onRemove: (() => void) | null;
}) => (
  <>
    {copyCount != null && (
      <span data-st="chip" className="shrink-0 text-xs">
        {copyCount} copies
      </span>
    )}
    <span className="text-xs text-gray-600 shrink-0">added by {addedBy}</span>
    {onRemove && (
      <button
        onClick={onRemove}
        className="text-xs text-red-600 hover:text-red-400 shrink-0"
      >
        [X]
      </button>
    )}
  </>
);

/**
 * What the row's RELEASE contributes.
 *
 * Every chain here is load-bearing against this repo's own tests, not the
 * contract. `CollageEntry` marks `release` required and non-nullable, but two
 * pre-existing tests contradict it — one whose entries carry no `release` at
 * all, one named for rendering "with null user" — so the guards stay.
 * `communityId` and `artist` need theirs on the contract's own terms anyway:
 * the first is absent from the required set, the second is nullable.
 */
const describeRelease = (entry: CollageEntry) => {
  // ONE guard, at the boundary, rather than a chain per field.
  //
  // `CollageEntry` marks `release` required and non-nullable, but two
  // pre-existing tests contradict the contract — one whose entries carry no
  // `release` at all, one named for rendering "with null user" — so a missing
  // release has to render. Naming that case once says so; five scattered `?.`
  // reads only imply it, and imply it about fields that are not in doubt.
  const release = entry.release;
  if (!release) {
    return {
      communityId: null,
      title: `Release #${entry.releaseId}`,
      artist: null
    };
  }
  // Past the guard, only the contract's own optionality remains: `communityId`
  // is absent from the required set, `artist` is nullable, `title` is neither.
  return {
    communityId: release.communityId ?? null,
    title: release.title,
    artist: release.artist?.name ?? null
  };
};

/**
 * What the row DISPLAYS — the release's contribution, plus the fields that
 * come off the entry itself.
 */
const describeDisplay = (entry: CollageEntry) => {
  const release = describeRelease(entry);
  return {
    ...release,
    cover: releaseCover(entry.group, entry.release),
    href: `/communities/${release.communityId ?? 0}/releases/${entry.releaseId}`,
    addedBy: entry.user?.username ?? '—'
  };
};

/**
 * What the row STANDS FOR. A row is not always one entry: where the api
 * collapsed entries sharing a release group (#319) it stands for every copy in
 * `groupedWith` too, and these three are the decisions that follow from it.
 */
const describeCollapse = (
  entry: CollageEntry,
  hasCommunity: boolean,
  canRemoveRow: (addedByUserId: number) => boolean
) => {
  const absorbed = entry.groupedWith ?? [];
  return {
    absorbed,
    // null rather than 0, so the render never asks "is this a collapsed row?"
    copyCount: absorbed.length > 0 ? absorbed.length + 1 : null,
    // Something to disclose: editions (which need a community) or absorbed
    // copies (which do not), so a collapsed row opens either way.
    hasDisclosure: hasCommunity || absorbed.length > 0,
    // The viewer may remove ANY copy, not only the representative: two
    // collapsed entries can have two adders, and "remove the album" is still
    // meaningful when only one of them is yours.
    canRemoveAny:
      canRemoveRow(entry.userId) || absorbed.some((m) => canRemoveRow(m.userId))
  };
};

const describeEntry = (
  entry: CollageEntry,
  canRemoveRow: (addedByUserId: number) => boolean
) => {
  const display = describeDisplay(entry);
  return {
    ...display,
    ...describeCollapse(entry, display.communityId !== null, canRemoveRow)
  };
};

/**
 * The +/- disclosure. Present whenever the row has something to disclose:
 * editions (which need a community) or absorbed copies (which do not) — so a
 * collapsed row is openable even where the representative has no community.
 */
const EntryDisclosure = ({
  isExpanded,
  onToggle
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-expanded={isExpanded}
    aria-label={`${isExpanded ? 'Hide' : 'Show'} editions`}
    onClick={onToggle}
    className="text-xs text-gray-500 hover:text-gray-300 shrink-0 w-4"
  >
    {isExpanded ? '−' : '+'}
  </button>
);

/** The release link and its artist line. */
const EntryTitle = ({
  href,
  title,
  artist
}: {
  href: string;
  title: string;
  artist: string | null;
}) => (
  <div className="flex-1 min-w-0">
    <Link to={href} data-st="title" className="block truncate">
      {title}
    </Link>
    {artist && (
      <div data-st="meta" data-st-em className="text-xs">
        {artist}
      </div>
    )}
  </div>
);

const CollageEntryRow = ({
  entry,
  index,
  isExpanded,
  isHighlighted,
  onToggleExpand,
  canRemoveRow,
  onRemove
}: {
  entry: CollageEntry;
  index: number;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggleExpand: () => void;
  canRemoveRow: (addedByUserId: number) => boolean;
  onRemove: () => void;
}) => {
  const view = describeEntry(entry, canRemoveRow);

  return (
    <div>
      <div
        id={`entry-${entry.releaseId}`}
        data-st="row"
        className={isHighlighted ? 'bg-indigo-900/30' : undefined}
      >
        <span className="text-xs text-gray-600 w-6 shrink-0 text-right">
          {index + 1}
        </span>
        {view.hasDisclosure && (
          <EntryDisclosure isExpanded={isExpanded} onToggle={onToggleExpand} />
        )}
        <EntryCover src={view.cover} />
        <EntryTitle href={view.href} title={view.title} artist={view.artist} />
        <EntryActions
          copyCount={view.copyCount}
          addedBy={view.addedBy}
          onRemove={view.canRemoveAny ? onRemove : null}
        />
      </div>
      {isExpanded && view.copyCount !== null && (
        <AbsorbedCopies absorbed={view.absorbed} canRemoveRow={canRemoveRow} />
      )}
      {isExpanded && view.communityId !== null && (
        <EntryEditions
          communityId={view.communityId}
          releaseId={entry.releaseId}
        />
      )}
    </div>
  );
};

export default CollageEntryRow;
