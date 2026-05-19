import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import CollageDetail from '../../components/collages/CollageDetail';

const mockUseGetCollageQuery = jest.fn();
const mockDeleteCollage = jest.fn();
const mockSubscribeCollage = jest.fn();
const mockBookmarkCollage = jest.fn();
const mockAddCollageEntry = jest.fn();
const mockRemoveCollageEntry = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../components/layout/CommentsSection', () => {
  const MockCommentsSection = () => <div>CommentsSection</div>;
  MockCommentsSection.displayName = 'MockCommentsSection';
  return MockCommentsSection;
});

jest.mock('../../store/services/collageApi', () => ({
  useGetCollageQuery: (...args: unknown[]) => mockUseGetCollageQuery(...args),
  useDeleteCollageMutation: () => [mockDeleteCollage],
  useSubscribeCollageMutation: () => [mockSubscribeCollage],
  useBookmarkCollageMutation: () => [mockBookmarkCollage],
  useAddCollageEntryMutation: () => [mockAddCollageEntry],
  useRemoveCollageEntryMutation: () => [mockRemoveCollageEntry]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '8' }),
  useNavigate: () => mockNavigate
}));

describe('CollageDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        name: 'Synth Pop',
        categoryId: 1,
        isLocked: false,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 1,
        numSubscribers: 4,
        description: 'A collage',
        tags: ['electronic'],
        user: { username: 'alice' },
        entries: [
          {
            id: 1,
            releaseId: 55,
            userId: 7,
            user: { username: 'alice' },
            release: {
              title: 'Release',
              image: null,
              communityId: 2,
              artist: { name: 'Artist' }
            }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    mockDeleteCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockSubscribeCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockBookmarkCollage.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockAddCollageEntry.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
    mockRemoveCollageEntry.mockReturnValue({
      unwrap: () => Promise.resolve(undefined)
    });
  });

  it('shows spinner while loading', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when collage not found', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderWithProviders(<CollageDetail />);
    expect(screen.getByText(/collage not found/i)).toBeInTheDocument();
  });

  it('alerts on subscribe, bookmark, and delete failures', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockSubscribeCollage.mockReturnValue({
      unwrap: () => Promise.reject(new Error('sub fail'))
    });
    mockBookmarkCollage.mockReturnValue({
      unwrap: () => Promise.reject(new Error('bm fail'))
    });
    mockDeleteCollage.mockReturnValue({
      unwrap: () => Promise.reject(new Error('del fail'))
    });

    renderWithProviders(<CollageDetail />, { store });

    await user.click(screen.getByRole('button', { name: /^subscribe$/i }));
    await user.click(screen.getByRole('button', { name: /^bookmark$/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update subscription.');
      expect(window.alert).toHaveBeenCalledWith('Failed to update bookmark.');
      expect(window.alert).toHaveBeenCalledWith('Failed to delete collage.');
    });
  });

  it('shows addError for empty release ID and failure message on API error', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockAddCollageEntry.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Already in collage' } })
    });

    renderWithProviders(<CollageDetail />, { store });

    // Submit with empty input → shows validation error
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(await screen.findByText('Enter a valid release ID.')).toBeInTheDocument();

    // Type a valid ID and submit → API error message shown
    await user.type(screen.getByPlaceholderText(/release id/i), '99');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(await screen.findByText('Already in collage')).toBeInTheDocument();
  });

  it('alerts on remove entry failure', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockRemoveCollageEntry.mockReturnValue({
      unwrap: () => Promise.reject(new Error('remove fail'))
    });

    renderWithProviders(<CollageDetail />, { store });

    await user.click(screen.getByRole('button', { name: /\[x\]/i }));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to remove entry.');
    });
  });

  it('renders cover art mosaic when entries have images', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        name: 'With Images',
        categoryId: 1,
        isLocked: false,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 1,
        numSubscribers: 0,
        description: '',
        tags: [],
        user: { username: 'alice' },
        entries: [
          {
            id: 2,
            releaseId: 10,
            userId: 7,
            user: { username: 'alice' },
            release: {
              title: 'Image Release',
              image: 'https://example.com/cover.jpg',
              communityId: 1,
              artist: { name: 'Band' }
            }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);
    const images = document.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('shows isLocked and isDeleted badges, subscribed/bookmarked states, no edit for non-owner', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 99,
        name: 'Locked Collage',
        categoryId: 1,
        isLocked: true,
        isDeleted: true,
        isSubscribed: true,
        isBookmarked: true,
        numEntries: 0,
        numSubscribers: 0,
        description: '',
        tags: [],
        user: null,
        entries: []
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^subscribed$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^bookmarked$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    expect(screen.getByText('No entries yet.')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses personal delete message for categoryId=0 and hides add form when locked non-staff', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        name: 'Personal',
        categoryId: 0,
        isLocked: true,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 0,
        numSubscribers: 0,
        description: '',
        tags: [],
        user: { username: 'alice' },
        entries: []
      },
      isLoading: false,
      error: undefined
    });

    renderWithProviders(<CollageDetail />, { store });

    // personal category → no Add form (locked owner, categoryId=0 → canManageEntries=false)
    expect(screen.queryByPlaceholderText(/release id/i)).not.toBeInTheDocument();

    // click delete: confirm is called with the personal message
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(window.confirm).toHaveBeenCalledWith(
      'Delete this personal collage permanently?'
    );
  });

  it('renders entry without image, without artist, and with null user', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 99,
        name: 'Sparse',
        categoryId: 2,
        isLocked: false,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 1,
        numSubscribers: 0,
        description: undefined,
        tags: [],
        user: undefined,
        entries: [
          {
            id: 3,
            releaseId: 20,
            userId: null,
            user: null,
            release: {
              title: 'Untitled',
              image: null,
              communityId: 0,
              artist: null
            }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\[x\]/i })).not.toBeInTheDocument();
  });

  it('lets the owner subscribe, bookmark, add, remove, and delete', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );

    renderWithProviders(<CollageDetail />, { store });

    await user.click(screen.getByRole('button', { name: /^subscribe$/i }));
    await user.click(screen.getByRole('button', { name: /^bookmark$/i }));
    await user.type(screen.getByPlaceholderText(/release id/i), '77');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.click(screen.getByRole('button', { name: /\[x\]/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockSubscribeCollage).toHaveBeenCalledWith(8);
      expect(mockBookmarkCollage).toHaveBeenCalledWith(8);
      expect(mockAddCollageEntry).toHaveBeenCalledWith({
        id: 8,
        releaseId: 77
      });
      expect(mockRemoveCollageEntry).toHaveBeenCalledWith({
        id: 8,
        releaseId: 55
      });
      expect(mockDeleteCollage).toHaveBeenCalledWith(8);
      expect(mockNavigate).toHaveBeenCalledWith('/private/collages');
    });
  });
});
