import { useState } from 'react';
import { useSearchArtistsQuery } from '../../store/services/searchApi';
import ChipPicker from './ChipPicker';

/** An artist by id; `name` is null when the id no longer resolves. */
export type ArtistRef = { id: number; name: string | null };

/** A typed name with no artist behind it yet (`allowCreate` only, #388). */
export type NewArtist = { id: null; name: string };

/** What an `allowCreate` picker holds: an existing artist, or one to create. */
export type ArtistChoice = ArtistRef | NewArtist;

type CommonProps = {
  id: string;
  label: string;
  max?: number;
};

/**
 * `allowCreate` is opt-in, so a picker without it (the notification filters,
 * #370) only ever sees existing artists and keeps its `ArtistRef[]` type.
 */
type ArtistPickerProps = CommonProps &
  (
    | {
        allowCreate?: false;
        value: ArtistRef[];
        onChange: (next: ArtistRef[]) => void;
      }
    | {
        allowCreate: true;
        value: ArtistChoice[];
        onChange: (next: ArtistChoice[]) => void;
      }
  );

const SUGGESTION_LIMIT = 10;

const choiceKey = (artist: ArtistChoice) =>
  artist.id === null ? `new:${artist.name.toLowerCase()}` : String(artist.id);

const choiceLabel = (artist: ArtistChoice) =>
  artist.name ?? `Removed artist #${artist.id}`;

const chipLabel = (artist: ArtistChoice) =>
  artist.id === null ? `New: ${artist.name}` : choiceLabel(artist);

/**
 * Artists as chips (ui#375), searching `GET /search/artists`. Fully controlled:
 * the caller builds `value` from what it saved (a filter's `artistIds`, named by
 * its `artists`) and writes back the ids. An artist with no name has been
 * removed; its chip says so and can still be taken out.
 *
 * With `allowCreate`, text that matches no artist can be kept as a `NewArtist`
 * chip ("New: …"). The picker creates nothing: the caller decides when, so a
 * typo never becomes a catalogue entry. A suggestion named exactly as typed is
 * still picked by Enter (ChipPicker highlights it), so this cannot shadow an
 * existing artist.
 */
const ArtistPicker = (props: ArtistPickerProps) => {
  const [query, setQuery] = useState('');
  const { data, isFetching } = useSearchArtistsQuery(
    { q: query, limit: SUGGESTION_LIMIT },
    { skip: query === '' }
  );

  return (
    <ChipPicker<ArtistChoice>
      id={props.id}
      label={props.label}
      selected={props.value}
      onChange={props.onChange as (next: ArtistChoice[]) => void}
      suggestions={(data?.data ?? []).map((a) => ({ id: a.id, name: a.name }))}
      isSearching={isFetching}
      onSearch={setQuery}
      itemKey={choiceKey}
      itemLabel={choiceLabel}
      chipLabel={chipLabel}
      isUnavailable={(artist) => artist.id !== null && artist.name === null}
      createFromText={
        props.allowCreate
          ? (text): NewArtist => ({ id: null, name: text.trim() })
          : undefined
      }
      max={props.max}
      placeholder="Search artists"
    />
  );
};

export default ArtistPicker;
