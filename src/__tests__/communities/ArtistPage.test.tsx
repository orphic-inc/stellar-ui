import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ArtistPage from '../../components/communities/ArtistPage';

const mockUseGetArtistByIdQuery = jest.fn();
const mockUseToggleArtistBookmarkMutation = jest.fn();
const mockSubscribeArtist = jest.fn();
const mockUnsubscribeArtist = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/artistApi', () => ({
  useGetArtistByIdQuery: (...args: unknown[]) =>
    mockUseGetArtistByIdQuery(...args)
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleArtistBookmarkMutation: () => mockUseToggleArtistBookmarkMutation()
}));

jest.mock('../../store/services/subscriptionApi', () => ({
  useSubscribeArtistMutation: () => [mockSubscribeArtist, { isLoading: false }],
  useUnsubscribeArtistMutation: () => [
    mockUnsubscribeArtist,
    { isLoading: false }
  ]
}));

jest.mock('../../components/layout/CommentsSection', () => ({
  __esModule: true,
  default: ({ context, pageId }: { context: string; pageId: number }) => (
    <div data-testid="artist-comments">{`${context}:${pageId}`}</div>
  )
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '42' })
}));

jest.mock('../../store/slices/authSlice', () => ({
  selectCurrentUser: (state: unknown) => state
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({ id: 7, username: 'testuser', canDownload: true }),
  useDispatch: () => mockDispatch
}));

const makeArtist = (overrides = {}) => ({
  id: 42,
  name: 'Miles Davis',
  description: 'Jazz legend',
  vanityHouse: false,
  isSubscribed: false,
  tags: [{ tag: { id: 1, name: 'jazz' } }],
  similarTo: [{ similarArtist: { id: 10, name: 'John Coltrane' } }],
  aliases: [],
  releases: [
    {
      id: 5,
      title: 'Kind of Blue',
      year: 1959,
      type: 'Album',
      communityId: 1,
      community: { id: 1, name: 'Jazz Vault' }
    }
  ],
  ...overrides
});

describe('ArtistPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToggleArtistBookmarkMutation.mockReturnValue([
      jest.fn().mockResolvedValue({ bookmarked: true }),
      { isLoading: false }
    ]);
    mockSubscribeArtist.mockReturnValue({
      unwrap: () => Promise.resolve({ subscribed: true })
    });
    mockUnsubscribeArtist.mockReturnValue({
      unwrap: () => Promise.resolve({ subscribed: false })
    });
  });

  it('shows spinner while loading', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error when artist not found', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText(/artist not found/i)).toBeInTheDocument();
  });

  it('renders artist name, description, tags, similar artists, and releases', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getAllByText('Miles Davis').length).toBeGreaterThan(0);
    expect(screen.getByText('Jazz legend')).toBeInTheDocument();
    expect(screen.getByText('jazz')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'John Coltrane' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Kind of Blue' })
    ).toBeInTheDocument();
    expect(screen.getByText('Jazz Vault')).toBeInTheDocument();
    expect(screen.getByText('1959')).toBeInTheDocument();
    expect(screen.getByTestId('artist-comments')).toHaveTextContent(
      'artist:42'
    );
  });

  it('shows vanity house badge when applicable', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ vanityHouse: true }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText(/vanity house/i)).toBeInTheDocument();
  });

  it('carries the data-st theming hooks (grid discography + vanity chip)', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ vanityHouse: true }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(document.querySelector('table[data-st="grid"]')).toBeInTheDocument();
    // The Vanity House pill paints from the chip Role via the kit Badge.
    expect(screen.getByText(/vanity house/i)).toHaveAttribute(
      'data-st',
      'chip'
    );
  });

  it('shows no releases message when discography is empty', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ releases: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText(/no accessible releases/i)).toBeInTheDocument();
  });

  it('dispatches "Artist bookmarked." alert when bookmarked is true', async () => {
    const toggleFn = jest.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: true })
    });
    mockUseToggleArtistBookmarkMutation.mockReturnValue([
      toggleFn,
      { isLoading: false }
    ]);
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist(),
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<ArtistPage />);
    await user.click(screen.getByTitle(/bookmark artist/i));
    expect(toggleFn).toHaveBeenCalledWith(42);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ msg: 'Artist bookmarked.' })
      })
    );
  });

  it('dispatches "Bookmark removed." alert when bookmarked is false', async () => {
    const toggleFn = jest.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: false })
    });
    mockUseToggleArtistBookmarkMutation.mockReturnValue([
      toggleFn,
      { isLoading: false }
    ]);
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist(),
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<ArtistPage />);
    await user.click(screen.getByTitle(/bookmark artist/i));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ msg: 'Bookmark removed.' })
      })
    );
  });

  it('dispatches danger alert when bookmark toggle fails', async () => {
    const toggleFn = jest.fn().mockReturnValue({
      unwrap: () => Promise.reject(new Error('network'))
    });
    mockUseToggleArtistBookmarkMutation.mockReturnValue([
      toggleFn,
      { isLoading: false }
    ]);
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist(),
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<ArtistPage />);
    await user.click(screen.getByTitle(/bookmark artist/i));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ msg: 'Failed to update bookmark.' })
      })
    );
  });

  it('renders aliases section when artist has aliases', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({
        aliases: [
          { redirect: { id: 20, name: 'Miles' } },
          { redirect: { id: 21, name: 'M. Davis' } }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText(/also known as/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Miles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'M. Davis' })).toBeInTheDocument();
  });

  it('shows "No tags." when artist has no tags', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ tags: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText('No tags.')).toBeInTheDocument();
  });

  it('renders multiple tags with separators', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({
        tags: [
          { tag: { id: 1, name: 'jazz' } },
          { tag: { id: 2, name: 'blues' } }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText('jazz')).toBeInTheDocument();
    expect(screen.getByText('blues')).toBeInTheDocument();
  });

  it('shows "No similar artists." when similar list is empty', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ similarTo: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText(/no similar artists/i)).toBeInTheDocument();
  });

  it('renders multiple similar artists with separators', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({
        similarTo: [
          { similarArtist: { id: 10, name: 'John Coltrane' } },
          { similarArtist: { id: 11, name: 'Bill Evans' } }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(
      screen.getByRole('link', { name: 'John Coltrane' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Bill Evans' })
    ).toBeInTheDocument();
  });

  it('falls back to empty arrays when artist fields are null', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: {
        id: 42,
        name: 'Sparse Artist',
        description: null,
        vanityHouse: false,
        tags: null,
        similarTo: null,
        aliases: null,
        releases: null
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText('No tags.')).toBeInTheDocument();
    expect(screen.getByText(/no accessible releases/i)).toBeInTheDocument();
  });

  it('renders releases with null communityId, community, year, and type', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({
        releases: [
          {
            id: 99,
            title: 'Orphaned Album',
            year: null,
            type: null,
            communityId: null,
            community: null
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText('Orphaned Album')).toBeInTheDocument();
  });

  it('groups releases by year — shows dash for duplicate year rows', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({
        releases: [
          {
            id: 1,
            title: 'First',
            year: 1959,
            type: 'Album',
            communityId: 1,
            community: { id: 1, name: 'Jazz Vault' }
          },
          {
            id: 2,
            title: 'Second',
            year: 1959,
            type: 'EP',
            communityId: 1,
            community: { id: 1, name: 'Jazz Vault' }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('1959')).toBeInTheDocument();
  });

  it('shows Subscribe button when not subscribed', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ isSubscribed: false }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(
      screen.getByRole('button', { name: 'Subscribe' })
    ).toBeInTheDocument();
  });

  it('shows Subscribed button when subscribed', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ isSubscribed: true }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(
      screen.getByRole('button', { name: 'Subscribed' })
    ).toBeInTheDocument();
  });

  it('calls subscribeArtist and dispatches success alert when subscribing', async () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist(),
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<ArtistPage />);
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(mockSubscribeArtist).toHaveBeenCalledWith(42);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ msg: 'Subscribed to artist.' })
      })
    );
  });

  it('calls unsubscribeArtist and dispatches success alert when unsubscribing', async () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ isSubscribed: true }),
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<ArtistPage />);
    await user.click(screen.getByRole('button', { name: 'Subscribed' }));
    expect(mockUnsubscribeArtist).toHaveBeenCalledWith(42);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ msg: 'Unsubscribed from artist.' })
      })
    );
  });

  it('dispatches danger alert when subscribe fails', async () => {
    mockSubscribeArtist.mockReturnValue({
      unwrap: () => Promise.reject(new Error('error'))
    });
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist(),
      isLoading: false,
      error: undefined
    });
    const user = userEvent.setup();
    renderWithProviders(<ArtistPage />);
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          msg: 'Failed to update subscription.'
        })
      })
    );
  });
});
