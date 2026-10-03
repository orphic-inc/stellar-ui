import type { Community, RegistrationStatus } from '../../types';

export type AnnounceVisibility = NonNullable<Community['announceVisibility']>;

type Option<T extends string> = { value: T; label: string };

type FieldProps<T extends string> = {
  id: string;
  value: T;
  onChange: (next: T) => void;
  /** Each form styles its labels its own way. */
  labelClassName: string;
  /** Marks the label with the form's required asterisk. */
  required?: boolean;
};

const REGISTRATION_STATUSES: Option<RegistrationStatus>[] = [
  { value: 'open', label: 'Open' },
  { value: 'invite', label: 'Invite only' },
  { value: 'closed', label: 'Closed' }
];

const ANNOUNCE_VISIBILITIES: Option<AnnounceVisibility>[] = [
  { value: 'PUBLIC', label: 'Public (#announce)' },
  { value: 'PRIVATE', label: "Private (members' channel)" }
];

const SettingSelect = <T extends string>({
  label,
  options,
  id,
  value,
  onChange,
  labelClassName,
  required,
  describedBy
}: FieldProps<T> & {
  label: string;
  options: Option<T>[];
  describedBy?: string;
}) => (
  <>
    <label htmlFor={id} data-st="meta" className={labelClassName}>
      {label}
      {required && <span className="text-[var(--st-danger)]"> *</span>}
    </label>
    <select
      id={id}
      data-st="field"
      value={value}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </>
);

export const RegistrationStatusField = (
  props: FieldProps<RegistrationStatus>
) => (
  <div>
    <SettingSelect
      {...props}
      label="Registration"
      options={REGISTRATION_STATUSES}
    />
  </div>
);

/**
 * Where a community's new releases are announced on IRC (ADR-0030,
 * stellar-api#328): public `#announce`, or a channel only its verified
 * members can join. It is easy to read as a privacy switch, which it is not,
 * so the help text says what it does and does not do.
 */
export const AnnounceVisibilityField = (
  props: FieldProps<AnnounceVisibility>
) => {
  const helpId = `${props.id}-help`;
  return (
    <div className="max-w-xs">
      <SettingSelect
        {...props}
        label="Release announcements"
        options={ANNOUNCE_VISIBILITIES}
        describedBy={helpId}
      />
      <p id={helpId} data-st="meta" className="text-xs mt-1">
        Routes IRC announcements only: it never hides releases or limits
        downloads. Only members with a verified IRC nick can join the private
        channel. Switching back to public is not retroactive.
      </p>
    </div>
  );
};
