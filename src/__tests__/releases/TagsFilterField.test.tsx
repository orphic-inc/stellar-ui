import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TagsFilterField, {
  toggleTag
} from '../../components/releases/TagsFilterField';

// The release browse's tags filter (#365): official tags as chips that toggle
// a name in or out of the free-text, comma-separated field.

let mockOfficial = [
  { id: 1, name: 'jazz', occurrences: 12, isOfficial: true },
  { id: 2, name: 'shoegaze', occurrences: 9, isOfficial: true }
];

jest.mock('../../store/services/tagApi', () => ({
  useGetOfficialTagsQuery: () => ({ data: mockOfficial })
}));

const renderField = (defaultValue?: string) =>
  renderWithProviders(
    <form aria-label="filters">
      <TagsFilterField
        defaultValue={defaultValue}
        labelClassName=""
        inputClassName=""
      />
    </form>
  );

const field = () => screen.getByLabelText(/comma-separated/i);
const chip = (name: string) => screen.getByRole('button', { name });

describe('toggleTag', () => {
  it('appends a tag the list lacks', () => {
    expect(toggleTag('blues', 'jazz')).toBe('blues, jazz');
  });

  it('removes a tag the list has, keeping the rest', () => {
    expect(toggleTag('blues, jazz , funk', 'jazz')).toBe('blues, funk');
  });

  it('starts a list from an empty field', () => {
    expect(toggleTag('  ', 'jazz')).toBe('jazz');
  });
});

describe('TagsFilterField', () => {
  it('toggles an official tag into the field, keeping typed tags', async () => {
    renderField('krautrock');

    await userEvent.click(chip('jazz'));
    expect(field()).toHaveValue('krautrock, jazz');
    expect(chip('jazz')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(chip('jazz'));
    expect(field()).toHaveValue('krautrock');
    expect(chip('jazz')).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks official tags already in the filter', () => {
    renderField('shoegaze');
    expect(chip('shoegaze')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('jazz')).toHaveAttribute('aria-pressed', 'false');
  });

  it('is the field the form submits', async () => {
    renderField();
    await userEvent.click(chip('jazz'));
    const form = screen.getByRole('form', {
      name: 'filters'
    }) as HTMLFormElement;
    expect(new FormData(form).get('tags')).toBe('jazz');
  });

  it('shows no chips when there is no curated set', () => {
    mockOfficial = [];
    renderField();
    expect(screen.queryByRole('group', { name: /official tags/i })).toBeNull();
  });
});
