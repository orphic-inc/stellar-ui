import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import CollageDetail from '../../components/collages/CollageDetail';

const mockUseGetCollageQuery = jest.fn();
const mockGetReleaseContributionsQuery = jest.fn();
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

jest.mock('../../store/services/communityApi', () => ({
  useGetReleaseContributionsQuery: (...args: unknown[]) =>
    mockGetReleaseContributionsQuery(...args)
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '8' }),
  useNavigate: () => mockNavigate
}));

const makeContribution = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  userId: 2,
  releaseId: 55,
  contributorId: 3,
  releaseDescription: null,
  downloadUrl: 'https://example.com/f.torrent',
  sizeInBytes: 524288000,
  linkStatus: 'PASS',
  linkCheckedAt: null,
  type: 'flac',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  user: { id: 2, username: 'alice' },
  collaborators: [],
  releaseFile: {
    bitrate: 'Lossless',
    hasLog: true,
    hasCue: true,
    isScene: false
  },
  edition: {
    id: 10,
    media: 'CD',
    year: null,
    recordLabel: null,
    catalogueNumber: null,
    title: null,
    isRemaster: false,
    isUnknownEdition: false
  },
  ...overrides
});

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
        numVisibleEntries: 1,
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
    mockGetReleaseContributionsQuery.mockReturnValue({
      data: [makeContribution()],
      isFetching: false
    });
  });

  it('does not show an entry edition stack until it is expanded', () => {
    renderWithProviders(<CollageDetail />);
    expect(
      document.querySelector('[data-st="edition-stack"]')
    ).not.toBeInTheDocument();
  });

  it('lazy-loads and renders the edition stack when an entry is expanded', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageDetail />);
    await user.click(screen.getByRole('button', { name: /editions/i }));
    expect(
      await screen.findByText('Original Release / CD')
    ).toBeInTheDocument();
    expect(screen.getByText('FLAC / Lossless')).toBeInTheDocument();
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
      expect(window.alert).toHaveBeenCalledWith(
        'Failed to update subscription.'
      );
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
    expect(
      await screen.findByText('Enter a valid release ID.')
    ).toBeInTheDocument();

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
        numVisibleEntries: 1,
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
        numVisibleEntries: 0,
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
    expect(
      screen.getByRole('button', { name: /^subscribed$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^bookmarked$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^delete$/i })
    ).not.toBeInTheDocument();
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
        numVisibleEntries: 0,
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
    expect(
      screen.queryByPlaceholderText(/release id/i)
    ).not.toBeInTheDocument();

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
        numVisibleEntries: 1,
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
    expect(
      screen.queryByRole('button', { name: /\[x\]/i })
    ).not.toBeInTheDocument();
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
      expect(mockNavigate).toHaveBeenCalledWith('/collages');
    });
  });

  it('renders the Top Contributors power-law block with a highlighted leader', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        name: 'Pop',
        categoryId: 1,
        isLocked: false,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 3,
        numVisibleEntries: 3,
        numSubscribers: 0,
        description: '',
        tags: [],
        user: { username: 'alice' },
        entries: [
          {
            id: 1,
            releaseId: 11,
            userId: 7,
            user: { id: 7, username: 'alice' }
          },
          {
            id: 2,
            releaseId: 12,
            userId: 7,
            user: { id: 7, username: 'alice' }
          },
          { id: 3, releaseId: 13, userId: 9, user: { id: 9, username: 'bob' } }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);
    expect(screen.getByText('Top Contributors')).toBeInTheDocument();
    // one bar per distinct contributor; alice (2 of 3) leads
    expect(document.querySelectorAll('[data-st="bar"]').length).toBe(2);
    const leadBars = document.querySelectorAll('[data-st="bar"][data-st-lead]');
    expect(leadBars.length).toBe(1);
    expect((leadBars[0] as HTMLElement).style.getPropertyValue('--st-w')).toBe(
      '67'
    );
  });

  it('marks the first cover cell as the 2×2 mosaic lead', () => {
    mockUseGetCollageQuery.mockReturnValue({
      data: {
        id: 8,
        userId: 7,
        name: 'Imgs',
        categoryId: 1,
        isLocked: false,
        isDeleted: false,
        isSubscribed: false,
        isBookmarked: false,
        numEntries: 2,
        numVisibleEntries: 2,
        numSubscribers: 0,
        description: '',
        tags: [],
        user: { username: 'alice' },
        entries: [
          {
            id: 1,
            releaseId: 11,
            userId: 7,
            user: { id: 7, username: 'alice' },
            release: { title: 'A', image: 'https://e/1.jpg', communityId: 1 }
          },
          {
            id: 2,
            releaseId: 12,
            userId: 7,
            user: { id: 7, username: 'alice' },
            release: { title: 'B', image: 'https://e/2.jpg', communityId: 1 }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);
    const cells = document.querySelectorAll('[data-st="coverart-cell"]');
    expect(cells.length).toBe(2);
    expect(cells[0].hasAttribute('data-st-lead')).toBe(true);
    expect(cells[1].hasAttribute('data-st-lead')).toBe(false);
  });

  it('renders Collage surfaces from data-st Role/Part hooks', () => {
    renderWithProviders(<CollageDetail />);
    for (const hook of ['panel', 'colhead', 'list', 'row', 'title', 'chip']) {
      expect(document.querySelector(`[data-st="${hook}"]`)).toBeInTheDocument();
    }
  });
  // #316 — the two counts answer different questions and must not be swapped.
  // The api sends `numEntries` as the collage's true size and
  // `numVisibleEntries` as the length of the `entries` array this viewer
  // received; they diverge whenever an entry is hidden (ADR-0036) or collapsed
  // onto a group (ADR-0037). Fixture makes them disagree on purpose, because a
  // fixture where they match cannot tell the two reads apart.
  it('heads the entry list with numVisibleEntries and the Statistics panel with numEntries', () => {
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
        numEntries: 12,
        numVisibleEntries: 9,
        numSubscribers: 4,
        description: null,
        tags: [],
        user: { username: 'alice' },
        entries: [
          {
            id: 1,
            releaseId: 55,
            userId: 7,
            user: { id: 7, username: 'alice' },
            release: { title: 'Release', image: null, communityId: 2 }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);

    expect(screen.getByText('9 entries')).toBeInTheDocument();
    expect(screen.queryByText('12 entries')).not.toBeInTheDocument();

    const stats = screen.getByText('Statistics').closest('[data-st="panel"]');
    expect(stats).not.toBeNull();
    expect(stats).toHaveTextContent(/Entries\s*12/);
  });

  // #318 — the entry has NO release art and a group cover. The previous
  // `filter(e => e.release?.image)` dropped it from the mosaic before any
  // fallback could run, so resolving the cover before filtering is the
  // behaviour under test, not just the preference order.
  it('uses the group cover in the mosaic and the row, including where the release has none', () => {
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
        numEntries: 2,
        numVisibleEntries: 2,
        numSubscribers: 0,
        description: null,
        tags: [],
        user: { username: 'alice' },
        entries: [
          {
            id: 1,
            releaseId: 55,
            userId: 7,
            user: { id: 7, username: 'alice' },
            group: { id: 3, title: 'Kid A', image: 'https://e/group.jpg' },
            release: { title: 'Kid A', image: null, communityId: 2 }
          },
          {
            id: 2,
            releaseId: 56,
            userId: 7,
            user: { id: 7, username: 'alice' },
            group: { id: 4, title: 'Amnesiac', image: null },
            release: {
              title: 'Amnesiac',
              image: 'https://e/own.jpg',
              communityId: 2
            }
          }
        ]
      },
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />);

    // Scoped to the mosaic, NOT every <img> on the page: the row thumbnail
    // renders the same URL, so a document-wide query passes whether or not the
    // mosaic kept the entry — it cannot tell the two sites apart. Verified by
    // restoring the old filter-then-map order, which this catches and a
    // document-wide query did not.
    const mosaic = [
      ...document.querySelectorAll('[data-st="coverart-cell"] img')
    ].map((i) => i.getAttribute('src'));
    // The group cover survives an entry whose own release art is null...
    expect(mosaic).toContain('https://e/group.jpg');
    // ...and a group with no cover art falls through to the release's own.
    expect(mosaic).toContain('https://e/own.jpg');

    const rowThumbs = [...document.querySelectorAll('[data-st="row"] img')].map(
      (i) => i.getAttribute('src')
    );
    expect(rowThumbs).toContain('https://e/group.jpg');
    expect(rowThumbs).toContain('https://e/own.jpg');
  });
  // ── #319 — the release-group collapse ──────────────────────────────────────

  // A collapsed row: one visible entry standing for two, added by two different
  // members. `alice` (id 7) owns neither the collage nor the absorbed copy.
  const collapsedCollage = (overrides: Record<string, unknown> = {}) => ({
    id: 8,
    userId: 99,
    name: 'Synth Pop',
    categoryId: 1,
    isLocked: false,
    isDeleted: false,
    isSubscribed: false,
    isBookmarked: false,
    numEntries: 2,
    numVisibleEntries: 1,
    numSubscribers: 0,
    description: null,
    tags: [],
    user: { username: 'carol' },
    entries: [
      {
        id: 1,
        releaseId: 41,
        userId: 7,
        user: { id: 7, username: 'alice' },
        group: { id: 3, title: 'Kid A', image: null },
        release: { title: 'Kid A', image: null, communityId: 2 },
        groupedWith: [
          {
            id: 2,
            releaseId: 87,
            communityId: 7,
            title: 'Kid A',
            userId: 55,
            addedAt: '2024-01-01T00:00:00Z'
          }
        ]
      }
    ],
    ...overrides
  });

  const asAlice = () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    return store;
  };

  it('marks a collapsed row with its copy count and lists the copies on expand', async () => {
    const user = userEvent.setup();
    mockUseGetCollageQuery.mockReturnValue({
      data: collapsedCollage(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />, { store: asAlice() });

    expect(screen.getByText('2 copies')).toBeInTheDocument();
    expect(screen.queryByTestId('grouped-with')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /editions/i }));

    const list = screen.getByTestId('grouped-with');
    expect(list).toHaveTextContent('Other copies in this collage');
    // The absorbed copy links into ITS community, not the representative's.
    expect(list.querySelector('a')?.getAttribute('href')).toBe(
      '/communities/7/releases/87'
    );
    // Permission is per row: alice added the representative, not this one.
    expect(list).toHaveTextContent('not yours to remove');
  });

  it('removes only the copies the viewer may remove, and fires no request it knows will 403', async () => {
    const user = userEvent.setup();
    mockUseGetCollageQuery.mockReturnValue({
      data: collapsedCollage(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<CollageDetail />, { store: asAlice() });

    await user.click(screen.getByRole('button', { name: /\[x\]/i }));

    await waitFor(() => {
      expect(mockRemoveCollageEntry).toHaveBeenCalledWith({
        id: 8,
        releaseId: 41
      });
    });
    // THE ASSERTION THAT CARRIES THE DECISION. Removing this line leaves a test
    // that passes whether or not the doomed request was fired, and firing it is
    // precisely what the predicted-subset design exists to avoid.
    expect(mockRemoveCollageEntry).not.toHaveBeenCalledWith({
      id: 8,
      releaseId: 87
    });
    expect(mockRemoveCollageEntry).toHaveBeenCalledTimes(1);

    // The confirm has to say so, since the user consents to a partial result.
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('You can remove 1')
    );
  });

  it('removes every copy when the viewer may remove them all', async () => {
    const user = userEvent.setup();
    const data = collapsedCollage();
    // Staff, so both copies are removable regardless of who added them.
    mockUseGetCollageQuery.mockReturnValue({
      data,
      isLoading: false,
      error: undefined
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: { collages_moderate: true } }
      } as never)
    );
    renderWithProviders(<CollageDetail />, { store });

    await user.click(screen.getByRole('button', { name: /\[x\]/i }));

    await waitFor(() => {
      expect(mockRemoveCollageEntry).toHaveBeenCalledTimes(2);
    });
    expect(mockRemoveCollageEntry).toHaveBeenCalledWith({
      id: 8,
      releaseId: 41
    });
    expect(mockRemoveCollageEntry).toHaveBeenCalledWith({
      id: 8,
      releaseId: 87
    });
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('all 2 will be removed')
    );
  });

  it('stops on a 429 rather than firing the rest into the same rate limit', async () => {
    const user = userEvent.setup();
    mockUseGetCollageQuery.mockReturnValue({
      data: collapsedCollage(),
      isLoading: false,
      error: undefined
    });
    mockRemoveCollageEntry.mockReturnValue({
      unwrap: () => Promise.reject({ status: 429 })
    });
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: { collages_moderate: true } }
      } as never)
    );
    renderWithProviders(<CollageDetail />, { store });

    await user.click(screen.getByRole('button', { name: /\[x\]/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Too many requests')
      );
    });
    expect(mockRemoveCollageEntry).toHaveBeenCalledTimes(1);
  });

  it('leaves an uncollapsed row asking exactly one question and firing one request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageDetail />, { store: asAlice() });

    await user.click(screen.getByRole('button', { name: /\[x\]/i }));

    await waitFor(() => {
      expect(mockRemoveCollageEntry).toHaveBeenCalledTimes(1);
    });
    expect(window.confirm).toHaveBeenCalledWith(
      'Remove this release from the collage?'
    );
    expect(screen.queryByText(/copies$/)).not.toBeInTheDocument();
  });
});
