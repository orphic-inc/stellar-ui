import { useState } from 'react';
import { useSearchArtistsQuery } from '../../store/services/searchApi';
import ChipPicker from './ChipPicker';

/** An artist by id; `name` is null when the id no longer resolves. */
export type ArtistRef = { id: number; name: string | null };

type ArtistPickerProps = {
  id: string;
  label: string;
  value: ArtistRef[];
  onChange: (next: ArtistRef[]) => void;
  max?: number;
};

const SUGGESTION_LIMIT = 10;

/**
 * Artists as chips (ui#375), searching `GET /search/artists`. Fully controlled:
 * the caller builds `value` from what it saved (a filter's `artistIds`, named by
 * its `artists`) and writes back the ids. An artist with no name has been
 * removed; its chip says so and can still be taken out.
 */
const ArtistPicker = ({
  id,
  label,
  value,
  onChange,
  max
}: ArtistPickerProps) => {
  const [query, setQuery] = useState('');
  const { data, isFetching } = useSearchArtistsQuery(
    { q: query, limit: SUGGESTION_LIMIT },
    { skip: query === '' }
  );

  return (
    <ChipPicker<ArtistRef>
      id={id}
      label={label}
      selected={value}
      onChange={onChange}
      suggestions={(data?.data ?? []).map((a) => ({ id: a.id, name: a.name }))}
      isSearching={isFetching}
      onSearch={setQuery}
      itemKey={(artist) => String(artist.id)}
      itemLabel={(artist) => artist.name ?? `Removed artist #${artist.id}`}
      isUnavailable={(artist) => artist.name === null}
      max={max}
      placeholder="Search artists"
    />
  );
};

export default ArtistPicker;
