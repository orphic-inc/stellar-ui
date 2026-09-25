import React, { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArtistPicker, { type ArtistRef } from '../../components/ui/ArtistPicker';
import TagPicker from '../../components/ui/TagPicker';
import { SEARCH_DELAY_MS } from '../../components/ui/ChipPicker';

const mockUseSearchArtistsQuery = jest.fn();
const mockUseSearchTagsQuery = jest.fn();

jest.mock('../../store/services/searchApi', () => ({
  useSearchArtistsQuery: (...args: unknown[]) =>
    mockUseSearchArtistsQuery(...args)
}));
jest.mock('../../store/services/tagApi', () => ({
  useSearchTagsQuery: (...args: unknown[]) => mockUseSearchTagsQuery(...args)
}));

const ArtistHarness = ({ initial = [] }: { initial?: ArtistRef[] }) => {
  const [value, setValue] = useState(initial);
  return (
    <>
      <ArtistPicker
        id="artists"
        label="Artists"
        value={value}
        onChange={setValue}
      />
      <output>{JSON.stringify(value)}</output>
    </>
  );
};

const TagHarness = () => {
  const [value, setValue] = useState<string[]>([]);
  return (
    <>
      <TagPicker id="tags" label="Tags" value={value} onChange={setValue} />
      <output>{JSON.stringify(value)}</output>
    </>
  );
};

beforeEach(() => {
  mockUseSearchArtistsQuery.mockReturnValue({
    data: undefined,
    isFetching: false
  });
  mockUseSearchTagsQuery.mockReturnValue({
    data: undefined,
    isFetching: false
  });
});
afterEach(() => jest.useRealTimers());

describe('ArtistPicker', () => {
  it('skips the search until a query settles, then asks for 10', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ArtistHarness />);
    expect(mockUseSearchArtistsQuery).toHaveBeenLastCalledWith(
      { q: '', limit: 10 },
      { skip: true }
    );

    await user.type(screen.getByRole('combobox', { name: 'Artists' }), 'slow');
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    expect(mockUseSearchArtistsQuery).toHaveBeenLastCalledWith(
      { q: 'slow', limit: 10 },
      { skip: false }
    );
  });

  it('picks an artist as { id, name }', async () => {
    mockUseSearchArtistsQuery.mockReturnValue({
      data: {
        data: [{ id: 4, name: 'Slowdive', vanityHouse: false, tags: [] }]
      },
      isFetching: false
    });
    const user = userEvent.setup();
    render(<ArtistHarness />);
    await user.type(screen.getByRole('combobox', { name: 'Artists' }), 'sl');
    await user.click(screen.getByRole('option', { name: 'Slowdive' }));
    expect(
      screen.getByText('[{"id":4,"name":"Slowdive"}]')
    ).toBeInTheDocument();
  });

  it('shows a removed artist, marked, and lets it be taken out', async () => {
    const user = userEvent.setup();
    render(<ArtistHarness initial={[{ id: 7, name: null }]} />);
    const chip = screen.getByText('Removed artist #7');
    expect(chip).toHaveAttribute('data-st-warning');
    await user.click(
      screen.getByRole('button', { name: 'Remove Removed artist #7' })
    );
    expect(screen.getByText('[]')).toBeInTheDocument();
  });
});

describe('TagPicker', () => {
  it('asks /tags for 10 suggestions once a query settles', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TagHarness />);
    await user.type(
      screen.getByRole('combobox', { name: 'Tags' }),
      'Post Rock'
    );
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    // The raw query: the api normalizes it, not the browser (ui#369).
    expect(mockUseSearchTagsQuery).toHaveBeenLastCalledWith(
      { q: 'Post Rock', limit: '10' },
      { skip: false }
    );
  });

  it('adds free text as typed, and says how it will be saved', async () => {
    const user = userEvent.setup();
    render(<TagHarness />);
    await user.type(
      screen.getByRole('combobox', { name: 'Tags' }),
      'Post Rock{Enter}'
    );
    expect(screen.getByText('["Post Rock"]')).toBeInTheDocument();
    expect(
      screen.getByText('Tags are saved in their canonical form.')
    ).toBeInTheDocument();
  });

  it('picks the suggestion that equals the input', async () => {
    mockUseSearchTagsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: 'shoegaze.revival',
            occurrences: 3,
            isOfficial: false
          },
          { id: 2, name: 'shoegaze', occurrences: 9, isOfficial: true }
        ]
      },
      isFetching: false
    });
    const user = userEvent.setup();
    render(<TagHarness />);
    await user.type(
      screen.getByRole('combobox', { name: 'Tags' }),
      'Shoegaze{Enter}'
    );
    expect(screen.getByText('["shoegaze"]')).toBeInTheDocument();
  });
});
