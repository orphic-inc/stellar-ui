import React, { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChipPicker, {
  MIN_QUERY_LENGTH,
  SEARCH_DELAY_MS
} from '../../components/ui/ChipPicker';

type HarnessProps = {
  initial?: string[];
  suggestions?: string[];
  freeText?: boolean;
  max?: number;
  isSearching?: boolean;
  onSearch?: (query: string) => void;
  unavailable?: string[];
};

/** Holds the value, as a form would, so each test sees the picker's result. */
const Harness = ({
  initial = [],
  suggestions = [],
  freeText = false,
  max,
  isSearching = false,
  onSearch = () => undefined,
  unavailable = []
}: HarnessProps) => {
  const [value, setValue] = useState(initial);
  return (
    <ChipPicker<string>
      id="picker"
      label="Tags"
      selected={value}
      onChange={setValue}
      suggestions={suggestions}
      isSearching={isSearching}
      onSearch={onSearch}
      itemKey={(s) => s.toLowerCase()}
      itemLabel={(s) => s}
      isUnavailable={(s) => unavailable.includes(s)}
      createFromText={freeText ? (text) => text : undefined}
      max={max}
    />
  );
};

const chips = () =>
  Array.from(document.querySelectorAll('[data-st="chip"]')).map(
    (chip) => chip.firstChild?.textContent
  );
const input = () => screen.getByRole('combobox', { name: 'Tags' });

describe('ChipPicker — search', () => {
  afterEach(() => jest.useRealTimers());

  it('searches the trimmed query once typing pauses, and not before', async () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Harness onSearch={onSearch} />);
    onSearch.mockClear(); // the mount reports the empty query

    await user.type(input(), ' ja ');
    expect(onSearch).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenLastCalledWith('ja');
  });

  it(`reports an empty query below ${MIN_QUERY_LENGTH} characters`, async () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Harness onSearch={onSearch} suggestions={['jazz']} />);

    await user.type(input(), 'j');
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    expect(onSearch).toHaveBeenLastCalledWith('');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('says it is searching, then that nothing matched', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness isSearching />);
    await user.type(input(), 'zz');
    expect(screen.getByRole('status')).toHaveTextContent('Searching…');

    rerender(<Harness isSearching={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
  });
});

describe('ChipPicker — picking', () => {
  it('adds a clicked suggestion and clears the input', async () => {
    const user = userEvent.setup();
    render(<Harness suggestions={['jazz', 'jazz.fusion']} />);
    await user.type(input(), 'ja');
    await user.click(screen.getByRole('option', { name: 'jazz.fusion' }));
    expect(chips()).toEqual(['jazz.fusion']);
    expect(input()).toHaveValue('');
  });

  it('adds a suggestion by arrow key and Enter', async () => {
    const user = userEvent.setup();
    render(<Harness suggestions={['jazz', 'jazz.fusion']} />);
    await user.type(input(), 'ja');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(chips()).toEqual(['jazz.fusion']);
  });

  it('highlights nothing by default, so Enter adds the typed text', async () => {
    const user = userEvent.setup();
    render(<Harness freeText suggestions={['shoegaze']} />);
    await user.type(input(), 'shoegaz{Enter}');
    expect(chips()).toEqual(['shoegaz']);
  });

  it('highlights a suggestion equal to the input, ignoring case', async () => {
    const user = userEvent.setup();
    render(<Harness freeText suggestions={['shoegaze.revival', 'shoegaze']} />);
    await user.type(input(), 'Shoegaze');
    expect(screen.getByRole('option', { name: 'shoegaze' })).toHaveAttribute(
      'data-st-open'
    );
    await user.keyboard('{Enter}');
    expect(chips()).toEqual(['shoegaze']);
  });

  it('adds nothing when focus leaves, even with a match highlighted', async () => {
    const user = userEvent.setup();
    render(<Harness freeText suggestions={['shoegaze']} />);
    await user.type(input(), 'shoegaze');
    await user.tab();
    expect(chips()).toEqual([]);
  });

  it('adds nothing on Enter without free text or a highlight', async () => {
    const user = userEvent.setup();
    render(<Harness suggestions={['jazz']} />);
    await user.type(input(), 'jaz{Enter}');
    expect(chips()).toEqual([]);
  });

  // downshift cancels Enter while the list is open, so the case this guards is
  // Enter after Escape has closed it.
  it('never submits the surrounding form on Enter, even with the list closed', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness freeText />
        {/* Implicit submission needs a submit button, as a real form has. */}
        <button type="submit">Save</button>
      </form>
    );
    await user.type(input(), 'drone{Escape}{Enter}');
    expect(chips()).toEqual(['drone']);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ChipPicker — removing, duplicates and the cap', () => {
  it('removes the last chip on Backspace in an empty input', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['jazz', 'blues']} />);
    await user.click(input());
    await user.keyboard('{Backspace}');
    expect(chips()).toEqual(['jazz']);
  });

  it('removes a chip by its named button', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['jazz', 'blues']} />);
    await user.click(screen.getByRole('button', { name: 'Remove jazz' }));
    expect(chips()).toEqual(['blues']);
  });

  it('offers no suggestion already chosen, and ignores a duplicate typed', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        freeText
        initial={['jazz']}
        suggestions={['jazz', 'jazz.rock']}
      />
    );
    await user.type(input(), 'ja');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'jazz.rock'
    ]);
    await user.clear(input());
    await user.type(input(), 'JAZZ{Enter}');
    expect(chips()).toEqual(['jazz']);
  });

  it('disables the input at the cap', () => {
    render(<Harness initial={['a', 'b']} max={2} />);
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('placeholder', 'Limit of 2 reached');
  });
});

describe('ChipPicker — data-st contract', () => {
  it('carries field, chip, list and row hooks', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={['gone']}
        unavailable={['gone']}
        suggestions={['jazz']}
      />
    );
    await user.type(input(), 'ja');
    await user.keyboard('{ArrowDown}');

    expect(input().closest('[data-st="field"]')).not.toBeNull();
    const chip = document.querySelector('[data-st="chip"]');
    expect(chip).toHaveAttribute('data-st-warning');
    expect(screen.getByRole('listbox')).toHaveAttribute('data-st', 'list');
    const option = screen.getByRole('option', { name: 'jazz' });
    expect(option).toHaveAttribute('data-st', 'row');
    expect(option).toHaveAttribute('data-st-open');
  });
});
