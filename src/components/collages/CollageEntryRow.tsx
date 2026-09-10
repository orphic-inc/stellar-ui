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
  const communityId = entry.release?.communityId ?? null;
  const cover = releaseCover(entry.group, entry.release);
  const absorbed = entry.groupedWith ?? [];
  // Shown when the viewer may remove ANY copy, not only the representative:
  // two collapsed entries can have two adders, and "remove the album" is still
  // meaningful when only one of them is yours.
  const canRemoveAny =
    canRemoveRow(entry.userId) || absorbed.some((m) => canRemoveRow(m.userId));

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
        {(communityId != null || absorbed.length > 0) && (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} editions`}
            onClick={onToggleExpand}
            className="text-xs text-gray-500 hover:text-gray-300 shrink-0 w-4"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        <EntryCover src={cover} />
        <div className="flex-1 min-w-0">
          <Link
            to={`/communities/${communityId ?? 0}/releases/${entry.releaseId}`}
            data-st="title"
            className="block truncate"
          >
            {entry.release?.title ?? `Release #${entry.releaseId}`}
          </Link>
          {entry.release?.artist?.name && (
            <div data-st="meta" data-st-em className="text-xs">
              {entry.release.artist.name}
            </div>
          )}
        </div>
        <EntryActions
          copyCount={absorbed.length > 0 ? absorbed.length + 1 : null}
          addedBy={entry.user?.username ?? '—'}
          onRemove={canRemoveAny ? onRemove : null}
        />
      </div>
      {isExpanded && absorbed.length > 0 && (
        <AbsorbedCopies absorbed={absorbed} canRemoveRow={canRemoveRow} />
      )}
      {isExpanded && communityId != null && (
        <EntryEditions communityId={communityId} releaseId={entry.releaseId} />
      )}
    </div>
  );
};

export default CollageEntryRow;
