import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ReleaseCredits from '../../components/communities/ReleaseCredits';
import type { ReleaseCredit } from '../../store/services/releaseCreditsApi';
import type { AuthUser } from '../../types';

const mockAddCredit = jest.fn();
const mockChangeRole = jest.fn();
const mockRemoveCredit = jest.fn();
const mockCreateArtist = jest.fn();
const mockSearchArtists = jest.fn();
const mockDispatch = jest.fn();

/** An RTK mutation trigger resolving (or rejecting) with `result`. */
const trigger = (result: unknown, fails = false) => ({
  unwrap: () => (fails ? Promise.reject(result) : Promise.resolve(result))
});

jest.mock('../../store/services/releaseCreditsApi', () => ({
  useAddReleaseCreditMutation: () => [mockAddCredit, { isLoading: false }],
  useChangeReleaseCreditRoleMutation: () => [
    mockChangeRole,
    { isLoading: false }
  ],
  useRemoveReleaseCreditMutation: () => [mockRemoveCredit, { isLoading: false }]
}));
jest.mock('../../store/services/artistApi', () => ({
  useCreateArtistMutation: () => [mockCreateArtist, { isLoading: false }]
}));
jest.mock('../../store/services/searchApi', () => ({
  useSearchArtistsQuery: (...args: unknown[]) => mockSearchArtists(...args)
}));
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

const ME = 7;

const userWith = (permissions: Record<string, boolean> = {}) =>
  ({
    id: ME,
    username: 'me',
    userRank: { level: 100, name: 'User', color: '', permissions }
  }) as unknown as AuthUser;

const credit = (
  id: number,
  role: ReleaseCredit['role'],
  name: string,
  addedById: number | null = 1
): ReleaseCredit => ({
  id,
  role,
  addedById,
  artist: { id: id + 100, name }
});

const CREDITS = [
  credit(1, 'Remixer', 'Aphex Twin'),
  credit(2, 'Main', 'Miles Davis'),
  credit(3, 'Guest', 'John Coltrane', ME)
];

const renderCredits = (
  user: AuthUser | null = userWith(),
  credits: ReleaseCredit[] = CREDITS
) =>
  renderWithProviders(
    <ReleaseCredits
      communityId={1}
      releaseId={5}
      credits={credits}
      user={user}
    />
  );

beforeEach(() => {
  mockSearchArtists.mockReturnValue({ data: undefined, isFetching: false });
  mockAddCredit.mockReturnValue(trigger({}));
  mockChangeRole.mockReturnValue(trigger({}));
  mockRemoveCredit.mockReturnValue(trigger(undefined));
});

describe('ReleaseCredits (#388)', () => {
  it('groups credits under role headings in role order', () => {
    renderCredits();

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(['Main', 'Guest', 'Remixer']);
    expect(
      within(screen.getByRole('region', { name: 'Main' })).getByRole('link', {
        name: 'Miles Davis'
      })
    ).toHaveAttribute('href', '/artists/102');
  });

  it('offers no Edit to a member who added none of the credits', () => {
    renderCredits(userWith(), [credit(1, 'Main', 'Miles Davis')]);

    expect(
      screen.queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument();
  });

  it('gives a member controls only on the credit they added', async () => {
    const user = userEvent.setup();
    renderCredits();

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(
      screen.getByRole('combobox', { name: 'Role for John Coltrane' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Role for Miles Davis' })
    ).not.toBeInTheDocument();
  });

  it('gives a moderator controls on every credit, and changes a role', async () => {
    const user = userEvent.setup();
    renderCredits(userWith({ communities_manage: true }));

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Role for Miles Davis' }),
      'Producer'
    );

    expect(mockChangeRole).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      creditId: 2,
      role: 'Producer'
    });
  });

  it('removes a credit', async () => {
    const user = userEvent.setup();
    renderCredits(userWith({ admin: true }));

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Remove Aphex Twin' }));

    expect(mockRemoveCredit).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      creditId: 1
    });
  });

  it('disables removing the last credit and says why', async () => {
    const user = userEvent.setup();
    renderCredits(userWith({ admin: true }), [credit(1, 'Main', 'Solo')]);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const remove = screen.getByRole('button', { name: 'Remove Solo' });

    expect(remove).toBeDisabled();
    expect(remove).toHaveAttribute(
      'title',
      'A release keeps at least one artist credit'
    );
  });

  it('adds an existing artist as Guest by default', async () => {
    mockSearchArtists.mockReturnValue({
      data: { data: [{ id: 9, name: 'Bill Evans' }] },
      isFetching: false
    });
    const user = userEvent.setup();
    renderCredits();

    await user.type(
      screen.getByRole('combobox', { name: 'Add artist' }),
      'Bill'
    );
    await user.click(await screen.findByRole('option', { name: 'Bill Evans' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockCreateArtist).not.toHaveBeenCalled();
    expect(mockAddCredit).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      artistId: 9,
      role: 'Guest'
    });
  });

  it('creates a new artist on Add, then credits it', async () => {
    mockCreateArtist.mockReturnValue(trigger({ id: 42, name: 'New Band' }));
    const user = userEvent.setup();
    renderCredits();

    await user.type(
      screen.getByRole('combobox', { name: 'Add artist' }),
      'New Band{Enter}'
    );
    // Enter keeps the name; nothing is created until Add.
    expect(screen.getByText('New: New Band')).toBeInTheDocument();
    expect(mockCreateArtist).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Role' }),
      'Producer'
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockCreateArtist).toHaveBeenCalledWith({ name: 'New Band' });
    expect(mockAddCredit).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      artistId: 42,
      role: 'Producer'
    });
  });

  it("alerts with the api's message when a credit is refused", async () => {
    mockSearchArtists.mockReturnValue({
      data: { data: [{ id: 102, name: 'Miles Davis' }] },
      isFetching: false
    });
    mockAddCredit.mockReturnValue(
      trigger(
        {
          status: 409,
          data: { msg: 'That artist already holds this role on the release' }
        },
        true
      )
    );
    const user = userEvent.setup();
    renderCredits();

    await user.type(
      screen.getByRole('combobox', { name: 'Add artist' }),
      'Miles'
    );
    await user.click(
      await screen.findByRole('option', { name: 'Miles Davis' })
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'That artist already holds this role on the release'
        })
      })
    );
  });
});
