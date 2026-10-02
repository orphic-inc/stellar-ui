import {
  Controller,
  useWatch,
  type Control,
  type UseFormRegister
} from 'react-hook-form';
import NullableLimitField from './NullableLimitField';

export interface RankFormValues {
  level: number;
  name: string;
  color: string;
  badge: string;
  permissions: Record<string, boolean>;
  secondary: boolean;
  permittedForumIds: number[];
  personalCollageLimit: number | null;
  authorStylesheetLimit: number | null;
  assetLimit: number | null;
  notificationFilterLimit: number | null;
  inviteGrantPerPeriod: number;
  inviteCap: number;
  displayStaff: boolean;
  staffGroupId: number | '';
}

type LimitName =
  | 'personalCollageLimit'
  | 'authorStylesheetLimit'
  | 'assetLimit'
  | 'notificationFilterLimit';

/**
 * The rank limits that can be unlimited (stellar-api#881). Every one reads the
 * same way: `0` is none, a number is the cap, and only the Unlimited checkbox
 * sends `null`. The invite rate and cap are plain counts and live elsewhere.
 */
export const RANK_LIMITS: { name: LimitName; id: string; label: string }[] = [
  {
    name: 'personalCollageLimit',
    id: 'perm-collage-limit',
    label: 'Personal Collages'
  },
  {
    name: 'authorStylesheetLimit',
    id: 'perm-stylesheet-limit',
    label: 'Author Stylesheets'
  },
  { name: 'assetLimit', id: 'perm-asset-limit', label: 'Image Uploads' },
  {
    name: 'notificationFilterLimit',
    id: 'perm-notification-filter-limit',
    label: 'Notification Filters'
  }
];

/** What a new rank starts with: every limit at `0`, none (#342). */
export const RANK_FORM_DEFAULTS: RankFormValues = {
  level: 0,
  name: '',
  color: '',
  badge: '',
  permissions: {},
  secondary: false,
  permittedForumIds: [],
  personalCollageLimit: 0,
  authorStylesheetLimit: 0,
  assetLimit: 0,
  notificationFilterLimit: 0,
  inviteGrantPerPeriod: 0,
  inviteCap: 0,
  displayStaff: false,
  staffGroupId: ''
};

const LIMIT_NAMES = new Set<string>(RANK_LIMITS.map((limit) => limit.name));

/**
 * A saved rank as form values. A field the rank lacks takes its create default.
 * `null` is kept only for the limits, where it is unlimited; an absent limit
 * reads as none, so it can never become a grant on save.
 */
export const toRankFormValues = (
  saved: Partial<Record<keyof RankFormValues, unknown>>
): RankFormValues => {
  const values: Record<string, unknown> = { ...RANK_FORM_DEFAULTS };
  for (const key of Object.keys(RANK_FORM_DEFAULTS)) {
    const value = saved[key as keyof RankFormValues];
    if (value === undefined) continue;
    if (value !== null || LIMIT_NAMES.has(key)) values[key] = value;
  }
  return values as unknown as RankFormValues;
};

/** The four nullable limits, each as a number plus an Unlimited checkbox (#342). */
export const RankLimitFields = ({
  control
}: {
  control: Control<RankFormValues>;
}) => (
  <>
    {RANK_LIMITS.map(({ name, id, label }) => (
      <Controller
        key={name}
        control={control}
        name={name}
        render={({ field }) => (
          <NullableLimitField
            id={id}
            label={label}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    ))}
  </>
);

const TEXT_INPUT_CLASS =
  'w-full rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

interface IdentityProps {
  register: UseFormRegister<RankFormValues>;
  control: Control<RankFormValues>;
}

/**
 * The rank's colour and badge, as the profile sidebar shows them (#342). An
 * emptied field is sent as `''`, which clears it.
 */
export const RankIdentityFields = ({ register, control }: IdentityProps) => {
  const [name, color, badge] = useWatch({
    control,
    name: ['name', 'color', 'badge']
  });
  return (
    <>
      <div>
        <label
          htmlFor="perm-color"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Color
        </label>
        <input
          id="perm-color"
          type="text"
          placeholder="#a0d468"
          {...register('color')}
          className={TEXT_INPUT_CLASS}
        />
      </div>
      <div>
        <label
          htmlFor="perm-badge"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Badge
        </label>
        <input
          id="perm-badge"
          type="text"
          {...register('badge')}
          className={TEXT_INPUT_CLASS}
        />
        <p className="text-xs text-gray-500 mt-1">
          Shown as{' '}
          <span
            data-testid="rank-preview"
            style={{ color: color || undefined }}
          >
            {badge ? `${badge} ` : ''}
            {name || 'the rank name'}
          </span>
        </p>
      </div>
    </>
  );
};
