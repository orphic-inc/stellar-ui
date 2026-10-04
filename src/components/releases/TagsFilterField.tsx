import { useState } from 'react';
import { useGetOfficialTagsQuery } from '../../store/services/tagApi';

const parseTags = (value: string) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

/** Add `name` to a comma-separated tag list, or take it out if it is there. */
export const toggleTag = (value: string, name: string) => {
  const tags = parseTags(value);
  const next = tags.includes(name)
    ? tags.filter((t) => t !== name)
    : [...tags, name];
  return next.join(', ');
};

/**
 * The release browse's tags filter: a free-text, comma-separated field, with
 * the curated vocabulary as chips that toggle a name in or out of it (#365,
 * stellar-api#298, ADR-0045). The form still reads the field by its name.
 */
const TagsFilterField = ({
  defaultValue,
  labelClassName,
  inputClassName
}: {
  defaultValue: string | undefined;
  labelClassName: string;
  inputClassName: string;
}) => {
  const [value, setValue] = useState(defaultValue ?? '');
  const { data: officialTags = [] } = useGetOfficialTagsQuery();
  const selected = parseTags(value);

  return (
    <div>
      <label htmlFor="release-tags" data-st="meta" className={labelClassName}>
        Tags (comma-separated)
      </label>
      <input
        id="release-tags"
        name="tags"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        data-st="field"
        className={inputClassName}
        placeholder="e.g. jazz, blues"
      />
      {officialTags.length > 0 && (
        <div
          role="group"
          aria-label="Official tags"
          className="flex flex-wrap gap-1 mt-1"
        >
          {officialTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              data-st="chip"
              aria-pressed={selected.includes(tag.name)}
              onClick={() => setValue(toggleTag(value, tag.name))}
              className="text-xs"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagsFilterField;
