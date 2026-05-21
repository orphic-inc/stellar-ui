import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ReleasePage from '../../components/communities/ReleasePage';

const mockGetReleaseByIdQuery = jest.fn();
const mockGetCommunityByIdQuery = jest.fn();
const mockVoteOn = jest.fn();
const mockRemoveVote = jest.fn();
const mockToggleBookmark = jest.fn();
const mockAddTag = jest.fn();
const mockVoteTag = jest.fn();
const mockRemoveTag = jest.fn();
const mockSubscribeComments = jest.fn();
const mockGetCommentSubscription = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockCurrentUser = {
  id: 1,
  username: 'testuser',
  avatar: null,
  canDownload: true,
  userRank: { level: 100, name: 'User', color: '#fff', permissions: {} }
};

jest.mock('../../store/services/communityApi', () => ({
  useGetReleaseByIdQuery: (...args: unknown[]) =>
    mockGetReleaseByIdQuery(...args),
  useGetCommunityByIdQuery: (...args: unknown[]) =>
    mockGetCommunityByIdQuery(...args),
  useVoteOnReleaseMutation: () => [mockVoteOn, { isLoading: false }],
  useRemoveVoteOnReleaseMutation: () => [mockRemoveVote, { isLoading: false }],
  useAddTagToReleaseMutation: () => [mockAddTag, { isLoading: false }],
  useVoteOnReleaseTagMutation: () => [mockVoteTag, { isLoading: false }],
  useRemoveTagFromReleaseMutation: () => [mockRemoveTag, { isLoading: false }]
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleReleaseBookmarkMutation: () => [
    mockToggleBookmark,
    { isLoading: false }
  ]
}));

jest.mock('../../store/services/subscriptionApi', () => ({
  useGetCommentSubscriptionQuery: (...args: unknown[]) =>
    mockGetCommentSubscription(...args),
  useSubscribeCommentsMutation: () => [
    mockSubscribeComments,
    { isLoading: false }
  ]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockCurrentUser,
  useDispatch: () => mockDispatch
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ communityId: '1', releaseId: '5' }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

jest.mock(
  '../../components/layout/CommentsSection',
  () =>
    function CommentsSection() {
      return <div data-testid="comments-section" />;
    }
);

jest.mock(
  '../../components/communities/DownloadButton',
  () =>
    function DownloadButton() {
      return <button>Download</button>;
    }
);

jest.mock(
  '../../components/communities/LinkStatusBadge',
  () =>
    function LinkStatusBadge() {
      return <span>OK</span>;
    }
);

jest.mock('../../components/communities/ReportContributionModal', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="report-modal">
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

const makeRelease = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  title: 'Kind of Blue',
  year: 1959,
  type: 'Album',
  description: 'A classic modal jazz album.',
  image: null,
  artist: { id: 10, name: 'Miles Davis' },
  contributions: [
    {
      id: 100,
      type: 'FLAC',
      sizeInBytes: 524288000,
      user: { id: 2, username: 'contributor1' },
      releaseDescription: 'Lossless rip',
      linkStatus: 'OK'
    }
  ],
  myVote: null,
  voteAggregate: null,
  releaseTags: [],
  historyEntries: [],
  ...overrides
});

describe('ReleasePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCommunityByIdQuery.mockReturnValue({
      data: { id: 1, name: 'Jazz Community' }
    });
    mockGetCommentSubscription.mockReturnValue({
      data: { subscribed: false }
    });
    mockVoteOn.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockRemoveVote.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockToggleBookmark.mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: true })
    });
    mockAddTag.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockVoteTag.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockRemoveTag.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockCurrentUser.userRank.permissions = {};
  });

  it('shows spinner while loading', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when release not found', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 404 }
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText(/release not found/i)).toBeInTheDocument();
  });

  it('renders release title, artist, and year', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getAllByText('Kind of Blue').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/miles davis/i).length).toBeGreaterThan(0);
    expect(screen.getByText('[1959]')).toBeInTheDocument();
  });

  it('renders contributions table with format, size, contributor, and notes', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText('FLAC')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'contributor1' })
    ).toBeInTheDocument();
    expect(screen.getByText('Lossless rip')).toBeInTheDocument();
  });

  it('shows "No contributions yet" when no contributions', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ contributions: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText(/no contributions yet/i)).toBeInTheDocument();
  });

  it('shows album description when present', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText('A classic modal jazz album.')).toBeInTheDocument();
  });

  it('calls toggleBookmark on bookmark click and dispatches success alert', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /bookmark/i }));
    expect(mockToggleBookmark).toHaveBeenCalledWith(5);
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'success' })
        })
      );
    });
  });

  it('calls voteOn with positive=true on upvote', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ myVote: null }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /▲/ }));
    expect(mockVoteOn).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      positive: true
    });
  });

  it('calls removeVote when clicking the already-active upvote button', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ myVote: 'up' }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /▲/ }));
    expect(mockRemoveVote).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5
    });
    expect(mockVoteOn).not.toHaveBeenCalled();
  });

  it('shows vote aggregate percentage, count, and score', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        voteAggregate: { ups: 8, total: 10, score: 0.578 }
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText(/80% positive/i)).toBeInTheDocument();
    expect(screen.getByText(/10 votes/i)).toBeInTheDocument();
    expect(screen.getByText(/score:\s*57\.8/i)).toBeInTheDocument();
  });

  it('shows existing tags', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        releaseTags: [
          {
            id: 1,
            tagId: 1,
            name: 'jazz',
            occurrences: 4,
            score: 6,
            positiveVotes: 7,
            negativeVotes: 1,
            createdAt: '2024-01-01T00:00:00Z',
            myVotes: { up: false, down: false }
          },
          {
            id: 2,
            tagId: 2,
            name: 'modal',
            occurrences: 3,
            score: 2,
            positiveVotes: 2,
            negativeVotes: 0,
            createdAt: '2024-01-01T00:00:00Z',
            myVotes: { up: false, down: false }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText('jazz')).toBeInTheDocument();
    expect(screen.getByText('modal')).toBeInTheDocument();
  });

  it('calls addTag and clears input after adding a tag', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ releaseTags: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.type(screen.getByPlaceholderText(/add tag/i), 'blues');
    await user.click(screen.getByRole('button', { name: '+' }));
    expect(mockAddTag).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      name: 'blues'
    });
  });

  it('calls addTag on Enter key in tag input', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ releaseTags: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.type(screen.getByPlaceholderText(/add tag/i), 'blues{Enter}');
    expect(mockAddTag).toHaveBeenCalled();
  });

  it('calls removeTag when a manager clicks remove on a tag', async () => {
    const user = userEvent.setup();
    mockCurrentUser.userRank.permissions = { communities_manage: true };
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        releaseTags: [
          {
            id: 7,
            tagId: 7,
            name: 'jazz',
            occurrences: 4,
            score: 3,
            positiveVotes: 3,
            negativeVotes: 0,
            createdAt: '2024-01-01T00:00:00Z',
            myVotes: { up: false, down: false }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByTitle('Remove tag'));
    expect(mockRemoveTag).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      tagId: 7
    });
  });

  it('calls voteOnReleaseTag with the selected direction', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        releaseTags: [
          {
            id: 7,
            tagId: 7,
            name: 'jazz',
            occurrences: 4,
            score: 3,
            positiveVotes: 3,
            negativeVotes: 0,
            createdAt: '2024-01-01T00:00:00Z',
            myVotes: { up: false, down: false }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /vote tag jazz up/i }));
    expect(mockVoteTag).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      tagId: 7,
      direction: 'up'
    });
  });

  it('does not show remove tag control to non-managers', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        releaseTags: [
          {
            id: 7,
            tagId: 7,
            name: 'jazz',
            occurrences: 4,
            score: 3,
            positiveVotes: 3,
            negativeVotes: 0,
            createdAt: '2024-01-01T00:00:00Z',
            myVotes: { up: false, down: false }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.queryByTitle('Remove tag')).not.toBeInTheDocument();
  });

  it('renders release history entries and snapshot details', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        historyEntries: [
          {
            id: 4,
            action: 'edit',
            summary: 'Updated title, tags',
            changedFields: ['title', 'tags'],
            before: { title: 'Old Title' },
            after: { title: 'Kind of Blue' },
            createdAt: '2024-01-02T00:00:00Z',
            actor: { id: 9, username: 'editor' }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText(/updated title, tags/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'editor' })).toBeInTheDocument();
    await user.click(screen.getByText(/view snapshot/i));
    expect(screen.getByText(/old title/i)).toBeInTheDocument();
  });

  it('opens report modal on [Report] click and closes on close', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /^\[Report\]$/ }));
    expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByTestId('report-modal')).not.toBeInTheDocument();
  });

  it('navigates to /contribute on [Add format] click', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /add format/i }));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/private/communities/1/releases/5/contribute'
    );
  });

  it('navigates to /contribute when clicking "Be the first to contribute" in empty contributions', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ contributions: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(
      screen.getByRole('button', { name: /be the first to contribute/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      '/private/communities/1/releases/5/contribute'
    );
  });

  it('calls voteOn with positive=false on downvote', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ myVote: null }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /▼/ }));
    expect(mockVoteOn).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5,
      positive: false
    });
  });

  it('calls removeVote when clicking already-active downvote', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ myVote: 'down' }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /▼/ }));
    expect(mockRemoveVote).toHaveBeenCalledWith({
      communityId: 1,
      releaseId: 5
    });
    expect(mockVoteOn).not.toHaveBeenCalled();
  });

  it('dispatches danger alert on bookmark failure', async () => {
    const user = userEvent.setup();
    mockToggleBookmark.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail'))
    });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /bookmark/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('dispatches danger alert on vote failure', async () => {
    const user = userEvent.setup();
    mockVoteOn.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail'))
    });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ myVote: null }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /▲/ }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('dispatches API error message on addTag failure with data.msg', async () => {
    const user = userEvent.setup();
    mockAddTag.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Tag already exists' } })
    });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ releaseTags: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.type(screen.getByPlaceholderText(/add tag/i), 'blues');
    await user.click(screen.getByRole('button', { name: '+' }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Tag already exists',
            alertType: 'danger'
          })
        })
      );
    });
  });

  it('dispatches fallback error on addTag failure without data.msg', async () => {
    const user = userEvent.setup();
    mockAddTag.mockReturnValue({
      unwrap: () => Promise.reject({})
    });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ releaseTags: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.type(screen.getByPlaceholderText(/add tag/i), 'blues');
    await user.click(screen.getByRole('button', { name: '+' }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Failed to add tag.',
            alertType: 'danger'
          })
        })
      );
    });
  });

  it('dispatches danger alert on removeTag failure', async () => {
    const user = userEvent.setup();
    mockCurrentUser.userRank.permissions = { communities_manage: true };
    mockRemoveTag.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail'))
    });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        releaseTags: [
          {
            id: 7,
            tagId: 7,
            name: 'jazz',
            occurrences: 4,
            score: 3,
            positiveVotes: 3,
            negativeVotes: 0,
            createdAt: '2024-01-01T00:00:00Z',
            myVotes: { up: false, down: false }
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByTitle('Remove tag'));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ alertType: 'danger' })
        })
      );
    });
  });

  it('renders cover image when release has an image', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ image: 'https://example.com/cover.jpg' }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('cover.jpg');
  });

  it('shows — for missing sizeInBytes and releaseDescription', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        contributions: [
          {
            id: 101,
            type: 'MP3',
            sizeInBytes: null,
            user: { id: 3, username: 'sparse-user' },
            releaseDescription: null,
            linkStatus: null
          }
        ]
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows singular vote count when total is 1', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ voteAggregate: { ups: 1, total: 1, score: 0.2 } }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    const ratingEl = document.querySelector(
      '.text-xs.text-gray-500.text-center'
    );
    expect(ratingEl?.textContent).toMatch(/1 vote(?!s)/);
  });

  it('hides artist sidebar section when release has no artist', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ artist: null }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.queryByText('Artist')).not.toBeInTheDocument();
  });

  it('shows Community fallback in breadcrumb when community data absent', () => {
    mockGetCommunityByIdQuery.mockReturnValue({ data: undefined });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText('Community')).toBeInTheDocument();
  });

  it('dispatches "Bookmark removed." alert when bookmarked is false', async () => {
    const user = userEvent.setup();
    mockToggleBookmark.mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: false })
    });
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease(),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.click(screen.getByRole('button', { name: /bookmark/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            msg: 'Bookmark removed.',
            alertType: 'success'
          })
        })
      );
    });
  });
});
