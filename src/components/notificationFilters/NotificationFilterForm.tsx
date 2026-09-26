import { useId } from 'react';
import {
  Controller,
  useForm,
  type Control,
  type UseFormRegister
} from 'react-hook-form';
import type {
  NotificationFilter,
  NotificationFilterInput
} from '../../store/services/notificationFilterApi';
import { useGetCommunitiesQuery } from '../../store/services/communityApi';
import ArtistPicker, { type ArtistRef } from '../ui/ArtistPicker';
import TagPicker from '../ui/TagPicker';
import Button from '../ui/Button';
import Panel from '../ui/Panel';
import {
  BITRATE_OPTIONS,
  FILE_TYPE_OPTIONS,
  MEDIA_OPTIONS,
  RELEASE_CATEGORY_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  type Bitrate,
  type FileType,
  type Media,
  type Option,
  type ReleaseCategory,
  type ReleaseType
} from './filterOptions';

/** The api caps every list at 100 entries (stellar-api#263). */
const MAX_ENTRIES = 100;

type FormValues = {
  label: string;
  artists: ArtistRef[];
  tags: string[];
  notTags: string[];
  communityIds: number[];
  releaseTypes: ReleaseType[];
  releaseCategories: ReleaseCategory[];
  fileTypes: FileType[];
  bitrates: Bitrate[];
  media: Media[];
  fromYear: string;
  toYear: string;
  newReleasesOnly: boolean;
  excludeCompilations: boolean;
  mainCreditsOnly: boolean;
};

type FormProps = { control: Control<FormValues> };

const EMPTY_VALUES: FormValues = {
  label: '',
  artists: [],
  tags: [],
  notTags: [],
  communityIds: [],
  releaseTypes: [],
  releaseCategories: [],
  fileTypes: [],
  bitrates: [],
  media: [],
  fromYear: '',
  toYear: '',
  newReleasesOnly: false,
  excludeCompilations: false,
  mainCreditsOnly: false
};

const yearText = (year: number | null) => (year === null ? '' : String(year));

// The picker takes names for display; the api is written ids. An artist the
// response no longer names has been removed, and its chip says so.
const fromFilter = (filter: NotificationFilter): FormValues => ({
  label: filter.label,
  artists: filter.artistIds.map((id) => ({
    id,
    name: filter.artists.find((a) => a.id === id)?.name ?? null
  })),
  tags: filter.tags,
  notTags: filter.notTags,
  communityIds: filter.communityIds,
  releaseTypes: filter.releaseTypes,
  releaseCategories: filter.releaseCategories,
  fileTypes: filter.fileTypes,
  bitrates: filter.bitrates,
  media: filter.media,
  fromYear: yearText(filter.fromYear),
  toYear: yearText(filter.toYear),
  newReleasesOnly: filter.newReleasesOnly,
  excludeCompilations: filter.excludeCompilations,
  mainCreditsOnly: filter.mainCreditsOnly
});

const toYear = (value: string) => (value === '' ? null : Number(value));

const toInput = ({
  artists,
  fromYear,
  toYear: to,
  ...rest
}: FormValues): NotificationFilterInput => ({
  ...rest,
  label: rest.label.trim(),
  artistIds: artists.map((artist) => artist.id),
  fromYear: toYear(fromYear),
  toYear: toYear(to)
});

type CheckboxGroupProps<T extends string | number> = {
  legend: string;
  options: Option<T>[];
  value: T[];
  onChange: (next: T[]) => void;
};

const CheckboxGroup = <T extends string | number>({
  legend,
  options,
  value,
  onChange
}: CheckboxGroupProps<T>) => {
  const toggle = (option: T) =>
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option]
    );

  return (
    <fieldset>
      <legend data-st="meta" className="text-xs mb-1">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-1.5 text-sm"
          >
            <input
              type="checkbox"
              data-st="field"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <span data-st="prose">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

type ListName =
  'releaseTypes' | 'releaseCategories' | 'fileTypes' | 'bitrates' | 'media';

const EnumGroup = <T extends string>({
  control,
  name,
  legend,
  options
}: FormProps & { name: ListName; legend: string; options: Option<T>[] }) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <CheckboxGroup<T>
        legend={legend}
        options={options}
        value={field.value as T[]}
        onChange={field.onChange}
      />
    )}
  />
);

const ArtistAndTagFields = ({ control }: FormProps) => {
  const id = useId();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Controller
        control={control}
        name="artists"
        render={({ field }) => (
          <ArtistPicker
            id={`${id}-artists`}
            label="Artists"
            value={field.value}
            onChange={field.onChange}
            max={MAX_ENTRIES}
          />
        )}
      />
      <Controller
        control={control}
        name="tags"
        render={({ field }) => (
          <TagPicker
            id={`${id}-tags`}
            label="Tags"
            value={field.value}
            onChange={field.onChange}
            max={MAX_ENTRIES}
          />
        )}
      />
      <Controller
        control={control}
        name="notTags"
        render={({ field }) => (
          <TagPicker
            id={`${id}-not-tags`}
            label="Excluded tags"
            value={field.value}
            onChange={field.onChange}
            max={MAX_ENTRIES}
          />
        )}
      />
    </div>
  );
};

/**
 * Communities come from the member's communities list. A saved id the list
 * does not resolve stays selected and reads as unavailable, so it can still be
 * taken out.
 */
const CommunityField = ({ control }: FormProps) => {
  const { data } = useGetCommunitiesQuery(1);
  const known = (data?.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <Controller
      control={control}
      name="communityIds"
      render={({ field }) => (
        <CheckboxGroup<number>
          legend="Communities"
          options={[
            ...known,
            ...field.value
              .filter((id) => !known.some((c) => c.value === id))
              .map((id) => ({
                value: id,
                label: `Unavailable community #${id}`
              }))
          ]}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
};

const ReleaseFields = ({ control }: FormProps) => (
  <div className="space-y-3">
    <CommunityField control={control} />
    <EnumGroup
      control={control}
      name="releaseTypes"
      legend="Release types"
      options={RELEASE_TYPE_OPTIONS}
    />
    <EnumGroup
      control={control}
      name="releaseCategories"
      legend="Categories"
      options={RELEASE_CATEGORY_OPTIONS}
    />
    <EnumGroup
      control={control}
      name="fileTypes"
      legend="Formats"
      options={FILE_TYPE_OPTIONS}
    />
    <EnumGroup
      control={control}
      name="bitrates"
      legend="Bitrates"
      options={BITRATE_OPTIONS}
    />
    <EnumGroup
      control={control}
      name="media"
      legend="Media"
      options={MEDIA_OPTIONS}
    />
  </div>
);

const FLAGS = [
  { name: 'newReleasesOnly', label: 'New releases only' },
  { name: 'excludeCompilations', label: 'Exclude compilations' },
  { name: 'mainCreditsOnly', label: 'Main credits only' }
] as const;

const YearAndFlagFields = ({
  register,
  id
}: {
  register: UseFormRegister<FormValues>;
  id: string;
}) => (
  <div className="flex flex-wrap items-end gap-4">
    {(['fromYear', 'toYear'] as const).map((name) => (
      <div key={name}>
        <label
          htmlFor={`${id}-${name}`}
          data-st="meta"
          className="block text-xs mb-1"
        >
          {name === 'fromYear' ? 'From year' : 'To year'}
        </label>
        <input
          id={`${id}-${name}`}
          type="number"
          min={1000}
          max={9999}
          data-st="field"
          className="w-28"
          {...register(name)}
        />
      </div>
    ))}
    {FLAGS.map(({ name, label }) => (
      <label key={name} className="flex items-center gap-1.5 text-sm pb-2">
        <input type="checkbox" data-st="field" {...register(name)} />
        <span data-st="prose">{label}</span>
      </label>
    ))}
  </div>
);

type Props = {
  /** The filter being edited; omitted, the form creates one. */
  filter?: NotificationFilter;
  isSaving: boolean;
  onSubmit: (input: NotificationFilterInput) => void;
  onCancel: () => void;
};

/**
 * Create or edit one notification filter (#370). The api decides whether the
 * filter sets anything and normalizes tag names (#689); its message is shown
 * by the caller.
 */
const NotificationFilterForm = ({
  filter,
  isSaving,
  onSubmit,
  onCancel
}: Props) => {
  const id = useId();
  const { register, control, handleSubmit } = useForm<FormValues>({
    defaultValues: filter ? fromFilter(filter) : EMPTY_VALUES
  });

  return (
    <Panel
      as="form"
      aria-label={filter ? `Edit ${filter.label}` : 'New filter'}
      className="p-4 space-y-4"
      onSubmit={handleSubmit((values) => onSubmit(toInput(values)))}
    >
      {/* `Field` does not forward refs, so a registered input takes the
          `field` Role directly. */}
      <div>
        <label
          htmlFor={`${id}-label`}
          data-st="meta"
          className="block text-xs mb-1"
        >
          Label<span className="text-[var(--st-danger)]"> *</span>
        </label>
        <input
          id={`${id}-label`}
          data-st="field"
          className="w-full"
          maxLength={100}
          {...register('label', { required: true })}
        />
      </div>
      <ArtistAndTagFields control={control} />
      <ReleaseFields control={control} />
      <YearAndFlagFields register={register} id={id} />
      <div className="flex justify-end gap-3">
        <Button variant="link" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : filter ? 'Save filter' : 'Create filter'}
        </Button>
      </div>
    </Panel>
  );
};

export default NotificationFilterForm;
