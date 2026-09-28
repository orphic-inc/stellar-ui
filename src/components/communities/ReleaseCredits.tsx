import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtistPicker, type ArtistChoice } from '../ui';
import type {
  ArtistRole,
  ReleaseCredit
} from '../../store/services/releaseCreditsApi';
import type { AuthUser } from '../../types';
import {
  ARTIST_ROLES,
  groupCreditsByRole,
  useReleaseCredits
} from './useReleaseCredits';

const LAST_CREDIT = 'A release keeps at least one artist credit';

type Credits = ReturnType<typeof useReleaseCredits>;

const RoleSelect = ({
  value,
  onChange,
  label,
  disabled
}: {
  value: ArtistRole;
  onChange: (role: ArtistRole) => void;
  label: string;
  disabled?: boolean;
}) => (
  <select
    data-st="field"
    data-st-compact
    className="shrink-0"
    aria-label={label}
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value as ArtistRole)}
  >
    {ARTIST_ROLES.map((role) => (
      <option key={role} value={role}>
        {role}
      </option>
    ))}
  </select>
);

/** One credit: a link, plus its role and × controls in edit mode. */
const CreditRow = ({
  credit,
  manageable,
  credits
}: {
  credit: ReleaseCredit;
  manageable: boolean;
  credits: Credits;
}) => (
  <li className="flex items-center gap-2">
    <Link
      to={`/artists/${credit.artist.id}`}
      data-st="control"
      className="min-w-0 truncate"
    >
      {credit.artist.name}
    </Link>
    {credits.editing && manageable && (
      <span className="ml-auto flex items-center gap-1">
        <RoleSelect
          label={`Role for ${credit.artist.name}`}
          value={credit.role}
          disabled={credits.busy}
          onChange={(role) => credits.handleChangeRole(credit.id, role)}
        />
        <button
          type="button"
          aria-label={`Remove ${credit.artist.name}`}
          title={credits.isLastCredit ? LAST_CREDIT : 'Remove credit'}
          disabled={credits.isLastCredit || credits.busy}
          onClick={() => credits.handleRemove(credit.id)}
          data-st="control"
          data-st-danger
          className="disabled:opacity-50"
        >
          ×
        </button>
      </span>
    )}
  </li>
);

/** Artist search (creating on Add, never on Enter), a role, and Add. */
const AddCreditForm = ({ credits }: { credits: Credits }) => {
  const [choice, setChoice] = useState<ArtistChoice[]>([]);
  const [role, setRole] = useState<ArtistRole>('Guest');

  const submit = async () => {
    if (choice.length === 0) return;
    if (await credits.handleAdd(choice[0], role)) setChoice([]);
  };

  return (
    <div className="space-y-1 pt-2">
      <ArtistPicker
        id="release-credit-artist"
        label="Add artist"
        allowCreate
        max={1}
        value={choice}
        onChange={setChoice}
      />
      <div className="flex gap-1">
        <RoleSelect label="Role" value={role} onChange={setRole} />
        <button
          type="button"
          disabled={choice.length === 0 || credits.busy}
          onClick={submit}
          data-st="control"
          data-st-primary
          className="text-xs disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

/**
 * The release's artist credits (#388), grouped under role headings in role
 * order as the legacy implementation's artist box was. Edit reveals the role
 * and × controls on the credits this viewer may manage; the add form is open
 * to every viewer, as the api's add is.
 */
const ReleaseCredits = ({
  communityId,
  releaseId,
  credits: creditList,
  user
}: {
  communityId: number;
  releaseId: number;
  credits: ReleaseCredit[];
  user: AuthUser | null;
}) => {
  const credits = useReleaseCredits({
    communityId,
    releaseId,
    credits: creditList,
    user
  });

  return (
    <div data-st="panel" className="overflow-hidden">
      <div
        data-st="colhead"
        className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
      >
        <span>Artists</span>
        {credits.canEditAny && (
          <button
            type="button"
            aria-pressed={credits.editing}
            onClick={() => credits.setEditing(!credits.editing)}
            data-st="control"
            className="normal-case tracking-normal font-normal"
          >
            {credits.editing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>
      <div className="px-3 py-2 text-sm space-y-2">
        {groupCreditsByRole(creditList).map((group) => (
          <section key={group.role} aria-label={group.role}>
            <h3 data-st="meta" className="text-xs uppercase tracking-wide">
              {group.role}
            </h3>
            <ul className="space-y-0.5">
              {group.credits.map((credit) => (
                <CreditRow
                  key={credit.id}
                  credit={credit}
                  manageable={credits.canManage(credit)}
                  credits={credits}
                />
              ))}
            </ul>
          </section>
        ))}
        <AddCreditForm credits={credits} />
      </div>
    </div>
  );
};

export default ReleaseCredits;
