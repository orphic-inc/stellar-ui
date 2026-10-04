import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import TagCuration from '../../components/staff/TagCuration';

// Staff curation of the official tag vocabulary (#365). Triggers return
// `{ unwrap }`, as RTK's do.

const mockPromote = jest.fn();
const mockDemote = jest.fn();
let mockOfficial = [
  { id: 2, name: 'shoegaze', occurrences: 9, isOfficial: true }
];

jest.mock('../../store/services/tagApi', () => ({
  useGetOfficialTagsQuery: () => ({ data: mockOfficial }),
  usePromoteTagMutation: () => [mockPromote, { isLoading: false }],
  useDemoteTagMutation: () => [mockDemote]
}));

const resolved = <T,>(data: T) => ({ unwrap: () => Promise.resolve(data) });
const rejected = (msg: string) => ({
  unwrap: () => Promise.reject({ status: 400, data: { msg } })
});
const tagItem = (id: number, name: string) => ({
  id,
  name,
  occurrences: 0,
  isOfficial: true
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOfficial = [
    { id: 2, name: 'shoegaze', occurrences: 9, isOfficial: true }
  ];
});

it('promotes by name and names the tag it landed on', async () => {
  mockPromote.mockReturnValue(resolved(tagItem(7, 'hip.hop')));
  const { store } = renderWithProviders(<TagCuration />);

  await userEvent.type(screen.getByLabelText(/promote a tag/i), '  Hip Hop ');
  await userEvent.click(screen.getByRole('button', { name: 'Promote' }));

  expect(mockPromote).toHaveBeenCalledWith('Hip Hop');
  await waitFor(() =>
    expect(store.getState().alert[0]).toMatchObject({
      alertType: 'success',
      msg: '"hip.hop" is now an official tag.'
    })
  );
  expect(screen.getByLabelText(/promote a tag/i)).toHaveValue('');
});

it('keeps Promote disabled for a blank name', async () => {
  renderWithProviders(<TagCuration />);
  await userEvent.type(screen.getByLabelText(/promote a tag/i), '   ');
  expect(screen.getByRole('button', { name: 'Promote' })).toBeDisabled();
});

it("alerts with the api's message when a promote is refused", async () => {
  mockPromote.mockReturnValue(rejected('Tag name has no usable characters'));
  const { store } = renderWithProviders(<TagCuration />);

  await userEvent.type(screen.getByLabelText(/promote a tag/i), '!!!');
  await userEvent.click(screen.getByRole('button', { name: 'Promote' }));

  await waitFor(() =>
    expect(store.getState().alert[0]).toMatchObject({
      alertType: 'danger',
      msg: 'Tag name has no usable characters'
    })
  );
  expect(screen.getByLabelText(/promote a tag/i)).toHaveValue('!!!');
});

it('lists the official set and demotes from it', async () => {
  mockDemote.mockReturnValue(resolved(tagItem(2, 'shoegaze')));
  const { store } = renderWithProviders(<TagCuration />);

  await userEvent.click(
    screen.getByRole('button', { name: 'Demote shoegaze' })
  );

  expect(mockDemote).toHaveBeenCalledWith(2);
  await waitFor(() =>
    expect(store.getState().alert[0]).toMatchObject({
      alertType: 'success',
      msg: '"shoegaze" is no longer an official tag.'
    })
  );
});

it("alerts with the api's message when a demote is refused", async () => {
  mockDemote.mockReturnValue(rejected('Tag not found'));
  const { store } = renderWithProviders(<TagCuration />);

  await userEvent.click(
    screen.getByRole('button', { name: 'Demote shoegaze' })
  );
  await waitFor(() =>
    expect(store.getState().alert[0]).toMatchObject({
      alertType: 'danger',
      msg: 'Tag not found'
    })
  );
});

it('says when there are no official tags', () => {
  mockOfficial = [];
  renderWithProviders(<TagCuration />);
  expect(screen.getByText('No official tags yet.')).toBeInTheDocument();
});
