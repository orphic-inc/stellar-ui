import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useCombobox, useMultipleSelection } from 'downshift';
import cn from 'classnames';

/** Wait this long after the last keystroke before searching. */
export const SEARCH_DELAY_MS = 250;
/** Shorter queries do not search: a one-letter substring match is noise. */
export const MIN_QUERY_LENGTH = 2;

export type ChipPickerProps<T> = {
  id: string;
  label: ReactNode;
  /** Muted line under the picker, e.g. how free text is saved. */
  hint?: ReactNode;
  selected: T[];
  onChange: (next: T[]) => void;
  /** Results for the last query passed to `onSearch`. */
  suggestions: T[];
  isSearching: boolean;
  /**
   * Called with the settled query once it has `MIN_QUERY_LENGTH` characters,
   * and with `''` when it drops below, so the caller can skip the request.
   */
  onSearch: (query: string) => void;
  /** Identity, for duplicates and React keys. */
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  /** A chip's text when it differs from its suggestion text. */
  chipLabel?: (item: T) => string;
  /** Marks a chip whose item no longer resolves, such as a removed artist. */
  isUnavailable?: (item: T) => boolean;
  /** Present when free text is allowed: turns typed text into an item. */
  createFromText?: (text: string) => T;
  /** Disables the input once this many items are chosen. */
  max?: number;
  placeholder?: string;
};

/**
 * A multi-select combobox that shows its choices as chips (ui#375). The kit
 * primitive under `ArtistPicker` and `TagPicker`: it owns the keyboard, ARIA
 * and `data-st` hooks, and the wrappers supply the search.
 *
 * `downshift` supplies the behaviour and renders nothing, so every hook here is
 * ours (ADR-0005): `field` on the input box, a `chip` per choice (`-warning`
 * for an unavailable one), and a `list` of `row`s for the suggestions, the
 * highlighted row taking the `-open` accent wash.
 *
 * Nothing is highlighted by default, so Enter adds free text rather than a
 * suggestion that merely contains it. The exception is a suggestion whose label
 * equals the input, ignoring case: that one is highlighted, so Enter picks it.
 */
/** Report the settled query, or `''` while it is too short to search. */
const useSettledSearch = (
  query: string,
  searchable: boolean,
  onSearch: (query: string) => void
) => {
  useEffect(() => {
    const timer = setTimeout(
      () => onSearch(searchable ? query : ''),
      SEARCH_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [query, searchable, onSearch]);
};

/** The line under the list: searching, or nothing found. */
const searchStatus = (
  query: string,
  resultCount: number,
  isSearching: boolean,
  freeText: boolean
): string | null => {
  if (query.length < MIN_QUERY_LENGTH || resultCount > 0) return null;
  if (isSearching) return 'Searching…';
  return freeText ? `No matches. Press Enter to add “${query}”.` : 'No matches';
};

type SuggestionBoxArgs<T> = {
  id: string;
  items: T[];
  inputValue: string;
  exactIndex: number;
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  onType: (next: string) => void;
  onPick: (item: T) => void;
};

/**
 * The combobox half. Picking keeps the list open and the input as typed (the
 * caller clears it), and only Enter or a click picks: downshift would otherwise
 * select the highlighted row on blur, and a tab away is not a choice.
 */
const useSuggestionBox = <T,>({
  id,
  items,
  inputValue,
  exactIndex,
  itemKey,
  itemLabel,
  onType,
  onPick
}: SuggestionBoxArgs<T>) => {
  const { InputKeyDownEnter, ItemClick, InputChange } =
    useCombobox.stateChangeTypes;
  const box = useCombobox<T>({
    id,
    items,
    inputValue,
    selectedItem: null,
    itemToString: (item) => (item === null ? '' : itemLabel(item)),
    itemToKey: (item) => (item === null ? null : itemKey(item)),
    defaultHighlightedIndex: exactIndex,
    stateReducer: (_state, { changes, type }) =>
      type === InputKeyDownEnter || type === ItemClick
        ? { ...changes, isOpen: true, inputValue }
        : changes,
    onStateChange: ({ type, selectedItem, inputValue: next }) => {
      if ((type === InputKeyDownEnter || type === ItemClick) && selectedItem)
        onPick(selectedItem);
      else if (type === InputChange) onType(next ?? '');
    }
  });

  // Results arrive after the keystroke that asked for them, so re-apply the
  // exact-match rule to each new set rather than only when the input changes.
  // Keyed on the items' identities, not the array, which is new each render.
  const { setHighlightedIndex } = box;
  const itemKeys = items.map(itemKey).join('\n');
  useEffect(() => {
    setHighlightedIndex(exactIndex);
  }, [exactIndex, itemKeys, setHighlightedIndex]);

  return box;
};

type ChipProps = {
  text: string;
  unavailable: boolean;
  onRemove: () => void;
} & Record<string, unknown>;

/** One choice: a `chip`, `-warning` when it no longer resolves. */
const Chip = ({
  text,
  unavailable,
  onRemove,
  ...downshiftProps
}: ChipProps) => (
  <span
    data-st="chip"
    {...(unavailable ? { 'data-st-warning': '' } : {})}
    className="inline-flex items-center gap-1"
    {...downshiftProps}
  >
    {text}
    <button
      type="button"
      aria-label={`Remove ${text}`}
      className="leading-none"
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
    >
      ×
    </button>
  </span>
);

/** The chips half: removal by button, Backspace, or arrow keys then Delete. */
const useChipSelection = <T,>(
  selected: T[],
  itemKey: (item: T) => string,
  onChange: (next: T[]) => void
) =>
  useMultipleSelection<T>({
    selectedItems: selected,
    itemToKey: (item) => (item === null ? null : itemKey(item)),
    onSelectedItemsChange: ({ selectedItems }) => onChange(selectedItems ?? []),
    // Chips read left to right, so the arrow keys follow them.
    keyNavigationNext: 'ArrowRight',
    keyNavigationPrevious: 'ArrowLeft'
  });

type Box<T> = ReturnType<typeof useSuggestionBox<T>>;
type Selection<T> = ReturnType<typeof useMultipleSelection<T>>;

type ChipRowProps<T> = {
  picker: ChipPickerProps<T>;
  box: Box<T>;
  selection: Selection<T>;
  inputProps: object;
  atMax: boolean;
};

/** The `field`: the chips, then the input they grow in front of. */
const ChipRow = <T,>({
  picker,
  box,
  selection,
  inputProps,
  atMax
}: ChipRowProps<T>) => {
  const chipLabel = picker.chipLabel ?? picker.itemLabel;
  return (
    <div data-st="field" className="flex flex-wrap items-center gap-1 w-full">
      {picker.selected.map((item, index) => (
        <Chip
          key={picker.itemKey(item)}
          text={chipLabel(item)}
          unavailable={picker.isUnavailable?.(item) ?? false}
          onRemove={() => selection.removeSelectedItem(item)}
          {...selection.getSelectedItemProps({ selectedItem: item, index })}
        />
      ))}
      <input
        {...box.getInputProps(inputProps)}
        disabled={atMax}
        placeholder={
          atMax ? `Limit of ${picker.max} reached` : picker.placeholder
        }
        className="flex-1 min-w-[8rem] bg-transparent outline-none"
      />
    </div>
  );
};

type SuggestionsProps<T> = {
  picker: ChipPickerProps<T>;
  box: Box<T>;
  items: T[];
  visible: boolean;
  query: string;
};

/** The `list` of `row`s (the highlighted one takes the `-open` wash), then the
 * status line and the hint. */
const Suggestions = <T,>({
  picker,
  box,
  items,
  visible,
  query
}: SuggestionsProps<T>) => (
  <>
    <ul
      {...box.getMenuProps()}
      data-st="list"
      className={cn('mt-1', !visible && 'hidden')}
    >
      {visible &&
        items.map((item, index) => (
          <li
            key={picker.itemKey(item)}
            data-st="row"
            {...(box.highlightedIndex === index ? { 'data-st-open': '' } : {})}
            className="cursor-pointer"
            {...box.getItemProps({ item, index })}
          >
            {picker.itemLabel(item)}
          </li>
        ))}
    </ul>
    {/* Outside the listbox, whose children must all be options; a polite
        live region, so the lack of a match is announced. */}
    <p role="status" className="text-xs mt-1 text-[var(--st-text-faint)]">
      {box.isOpen
        ? searchStatus(
            query,
            items.length,
            picker.isSearching,
            !!picker.createFromText
          )
        : null}
    </p>
    {picker.hint && (
      <p className="text-xs mt-1 text-[var(--st-text-faint)]">{picker.hint}</p>
    )}
  </>
);

type InputKeysArgs<T> = {
  selection: Selection<T>;
  box: Box<T>;
  hasItems: boolean;
  /** Enter with text typed; downshift has already handled a highlighted row. */
  onEnter: () => void;
  query: string;
};

/**
 * The input's key handling, composed with both downshift hooks. Chip keys
 * (Backspace, arrows) step aside only while there are suggestions to navigate.
 * `preventKeyAction` makes getDropdownProps drop our handler along with its
 * own, so it is passed again for that case; a spread `onKeyDown` alone would
 * replace downshift's instead of chaining.
 */
const useInputKeys = <T,>({
  selection,
  box,
  hasItems,
  onEnter,
  query
}: InputKeysArgs<T>) => {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || query === '') return;
    // An Enter in the picker never submits the form around it. downshift
    // cancels it while the list is open; this covers a closed one (Escape).
    event.preventDefault();
    onEnter();
  };
  const chipKeysOff = box.isOpen && hasItems;
  return {
    ...selection.getDropdownProps({ preventKeyAction: chipKeysOff, onKeyDown }),
    ...(chipKeysOff ? { onKeyDown } : {})
  };
};

const ChipPicker = <T,>(picker: ChipPickerProps<T>) => {
  const { selected, onChange, itemKey, createFromText, max } = picker;
  const [inputValue, setInputValue] = useState('');
  const query = inputValue.trim();
  const searchable = query.length >= MIN_QUERY_LENGTH;
  const atMax = max !== undefined && selected.length >= max;
  useSettledSearch(query, searchable, picker.onSearch);

  const chosen = new Set(selected.map(itemKey));
  const items = searchable
    ? picker.suggestions.filter((item) => !chosen.has(itemKey(item)))
    : [];

  const add = (item: T) => {
    setInputValue('');
    if (atMax || chosen.has(itemKey(item))) return;
    onChange([...selected, item]);
  };

  const selection = useChipSelection(selected, itemKey, onChange);

  const box = useSuggestionBox({
    id: picker.id,
    items,
    inputValue,
    exactIndex: items.findIndex(
      (item) => picker.itemLabel(item).toLowerCase() === query.toLowerCase()
    ),
    itemKey,
    itemLabel: picker.itemLabel,
    onType: setInputValue,
    onPick: add
  });

  const inputProps = useInputKeys({
    selection,
    box,
    hasItems: items.length > 0,
    onEnter: () => {
      if (box.highlightedIndex < 0 && createFromText)
        add(createFromText(query));
    },
    query
  });

  return (
    <div>
      <label
        {...box.getLabelProps()}
        data-st="meta"
        className="block text-xs mb-1"
      >
        {picker.label}
      </label>
      <ChipRow {...{ picker, box, selection, inputProps, atMax }} />
      <Suggestions
        {...{ picker, box, items, query }}
        visible={box.isOpen && searchable}
      />
    </div>
  );
};

export default ChipPicker;
