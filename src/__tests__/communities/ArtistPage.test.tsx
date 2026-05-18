import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ArtistPage from '../../components/communities/ArtistPage';

const mockUseGetArtistByIdQuery = jest.fn();
const mockUseToggleArtistBookmarkMutation = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../store/services/artistApi', () => ({
  useGetArtistByIdQuery: (...args: unknown[]) =>
    mockUseGetArtistByIdQuery(...args)
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleArtistBookmarkMutation: () => mockUseToggleArtistBookmarkMutation()
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
    expect(screen.getByRole('link', { name: 'Kind of Blue' })).toBeInTheDocument();
    expect(screen.getByText('Jazz Vault')).toBeInTheDocument();
    expect(screen.getByText('1959')).toBeInTheDocument();
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

  it('shows no releases message when discography is empty', () => {
    mockUseGetArtistByIdQuery.mockReturnValue({
      data: makeArtist({ releases: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ArtistPage />);
    expect(screen.getByText(/no accessible releases/i)).toBeInTheDocument();
  });

  it('dispatches success alert on bookmark toggle', async () => {
    const toggleFn = jest.fn().mockResolvedValue({ bookmarked: true });
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
    expect(mockDispatch).toHaveBeenCalled();
  });
});
