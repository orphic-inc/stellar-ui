import { useState } from 'react';
import { useSearchTagsQuery } from '../../store/services/tagApi';
import ChipPicker from './ChipPicker';

type TagPickerProps = {
  id: string;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

const SUGGESTION_LIMIT = 10;

/**
 * Tag names as chips (ui#375), suggesting from `GET /tags` and accepting free
 * text: a filter may name a tag no release carries yet. A chip shows what was
 * typed; the api stores the canonical form (#689), so the browser applies no
 * tag name rule of its own (ui#369).
 */
const TagPicker = ({ id, label, value, onChange, max }: TagPickerProps) => {
  const [query, setQuery] = useState('');
  const { data, isFetching } = useSearchTagsQuery(
    { q: query, limit: String(SUGGESTION_LIMIT) },
    { skip: query === '' }
  );

  return (
    <ChipPicker<string>
      id={id}
      label={label}
      hint="Tags are saved in their canonical form."
      selected={value}
      onChange={onChange}
      suggestions={(data?.data ?? []).map((tag) => tag.name)}
      isSearching={isFetching}
      onSearch={setQuery}
      itemKey={(name) => name.toLowerCase()}
      itemLabel={(name) => name}
      createFromText={(text) => text}
      max={max}
      placeholder="Add a tag"
    />
  );
};

export default TagPicker;
