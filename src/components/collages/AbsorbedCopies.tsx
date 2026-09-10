import { Link } from 'react-router-dom';
import type { CollageEntry } from '../../store/services/collageApi';

type Absorbed = NonNullable<CollageEntry['groupedWith']>[number];

/**
 * The entries the api folded into one row because they share a release group
 * (#319) — "the same album, catalogued in another community".
 *
 * Linked by community id and shown by title. The collage response carries no
 * community NAME, for the entry or its absorbed copies; `ReleaseGroupMember`
 * does, but joining it back would cost a request per expanded row for a label
 * the href already disambiguates.
 *
 * `canRemoveRow` is passed in rather than recomputed: delete permission is per
 * row — the collage owner, that row's own adder, or staff — and two entries
 * collapsed onto one line can have two different adders.
 */
const AbsorbedCopies = ({
  absorbed,
  canRemoveRow
}: {
  absorbed: Absorbed[];
  canRemoveRow: (addedByUserId: number) => boolean;
}) => (
  <div data-st="list" data-testid="grouped-with">
    <div data-st="meta" className="px-3 py-1 text-xs">
      Other copies in this collage
    </div>
    {absorbed.map((m) => (
      <div key={m.id} data-st="row" className="px-3 py-1 text-xs">
        <Link
          to={`/communities/${m.communityId ?? 0}/releases/${m.releaseId}`}
          data-st="title"
          className="flex-1 min-w-0 truncate"
        >
          {m.title}
        </Link>
        {!canRemoveRow(m.userId) && (
          <span data-st="meta" className="shrink-0">
            not yours to remove
          </span>
        )}
      </div>
    ))}
  </div>
);

export default AbsorbedCopies;
