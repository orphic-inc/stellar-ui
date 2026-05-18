import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import BookmarksPage from '../../components/pages/private/bookmarks/BookmarksPage';

const mockGetArtistBookmarks = jest.fn();
const mockGetReleaseBookmarks = jest.fn();
const mockGetCommunityBookmarks = jest.fn();
const mockGetRequestBookmarks = jest.fn();

jest.mock('../../store/services/bookmarkApi', () => ({
  useGetArtistBookmarksQuery: () => mockGetArtistBookmarks(),
  useGetReleaseBookmarksQuery: () => mockGetReleaseBookmarks(),
  useGetCommunityBookmarksQuery: () => mockGetCommunityBookmarks(),
  useGetRequestBookmarksQuery: () => mockGetRequestBookmarks()
}));

describe('BookmarksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetArtistBookmarks.mockReturnValue({
      data: [
        {
          artistId: 5,
          createdAt: '2026-01-01T00:00:00Z',
          artist: { id: 5, name: 'Miles Davis' }
        }
      ],
      isLoading: false,
      error: undefined
    });
    mockGetReleaseBookmarks.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    mockGetCommunityBookmarks.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    mockGetRequestBookmarks.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
  });

  it('renders Artists tab by default with bookmark list', () => {
    renderWithProviders(<BookmarksPage />);
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
  });

  it('shows empty state when no artists bookmarked', () => {
    mockGetArtistBookmarks.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<BookmarksPage />);
    expect(screen.getByText(/no bookmarked artists yet/i)).toBeInTheDocument();
  });

  it('shows all four tabs', () => {
    renderWithProviders(<BookmarksPage />);
    expect(screen.getByRole('button', { name: 'Artists' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Releases' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Communities' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Requests' })
    ).toBeInTheDocument();
  });

  it('switches to Communities tab and shows community bookmarks', async () => {
    const user = userEvent.setup();
    mockGetCommunityBookmarks.mockReturnValue({
      data: [
        {
          communityId: 1,
          createdAt: '2026-02-01T00:00:00Z',
          community: { id: 1, name: 'Jazz Vault' }
        }
      ],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<BookmarksPage />);
    await user.click(screen.getByRole('button', { name: 'Communities' }));
    expect(screen.getByText('Jazz Vault')).toBeInTheDocument();
  });

  it('shows error state for a tab when query fails', () => {
    mockGetArtistBookmarks.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 }
    });
    renderWithProviders(<BookmarksPage />);
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('switches to Releases tab and shows release bookmarks', async () => {
    const user = userEvent.setup();
    mockGetReleaseBookmarks.mockReturnValue({
      data: [
        {
          releaseId: 10,
          createdAt: '2026-03-01T00:00:00Z',
          release: { id: 10, title: 'Kind of Blue', communityId: 1 }
        }
      ],
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<BookmarksPage />);
    await user.click(screen.getByRole('button', { name: 'Releases' }));
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
  });
});
