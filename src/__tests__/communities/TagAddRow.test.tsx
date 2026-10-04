import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TagAddRow from '../../components/communities/TagAddRow';

// The release tag editor's add row (#365): official tags are suggested
// through a datalist, and any name can still be typed (ADR-0045 §1).

jest.mock('../../store/services/tagApi', () => ({
  useGetOfficialTagsQuery: () => ({
    data: [
      { id: 1, name: 'jazz', occurrences: 12, isOfficial: true },
      { id: 2, name: 'shoegaze', occurrences: 9, isOfficial: true }
    ]
  })
}));

const onAdd = jest.fn();

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <TagAddRow value={value} onChange={setValue} onAdd={onAdd} adding={false} />
  );
};

beforeEach(() => onAdd.mockReset());

it('suggests every official tag on the field', () => {
  renderWithProviders(<Harness />);
  const input = screen.getByPlaceholderText(/add tag/i);
  const list = document.getElementById(input.getAttribute('list') ?? '');
  const names = Array.from(list?.querySelectorAll('option') ?? []).map((o) =>
    o.getAttribute('value')
  );
  expect(names).toEqual(['jazz', 'shoegaze']);
});

it('still takes a name that is not official', async () => {
  renderWithProviders(<Harness />);
  await userEvent.type(screen.getByPlaceholderText(/add tag/i), 'krautrock');
  await userEvent.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByPlaceholderText(/add tag/i)).toHaveValue('krautrock');
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it('adds on Enter', async () => {
  renderWithProviders(<Harness />);
  await userEvent.type(screen.getByPlaceholderText(/add tag/i), 'jazz{Enter}');
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it('keeps the button disabled for a blank name', async () => {
  renderWithProviders(<Harness />);
  await userEvent.type(screen.getByPlaceholderText(/add tag/i), '   ');
  expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
});
