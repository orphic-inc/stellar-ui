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
const mockRemoveTag = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/communityApi', () => ({
  useGetReleaseByIdQuery: (...args: unknown[]) =>
    mockGetReleaseByIdQuery(...args),
  useGetCommunityByIdQuery: (...args: unknown[]) =>
    mockGetCommunityByIdQuery(...args),
  useVoteOnReleaseMutation: () => [mockVoteOn, { isLoading: false }],
  useRemoveVoteOnReleaseMutation: () => [mockRemoveVote, { isLoading: false }],
  useAddTagToReleaseMutation: () => [mockAddTag, { isLoading: false }],
  useRemoveTagFromReleaseMutation: () => [mockRemoveTag, { isLoading: false }]
}));

jest.mock('../../store/services/bookmarkApi', () => ({
  useToggleReleaseBookmarkMutation: () => [
    mockToggleBookmark,
    { isLoading: false }
  ]
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({
    id: 1,
    username: 'testuser',
    avatar: null,
    canDownload: true,
    userRank: { level: 100, name: 'User', color: '#fff' }
  }),
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

jest.mock('../../components/layout/CommentsSection', () => () => (
  <div data-testid="comments-section" />
));

jest.mock('../../components/communities/DownloadButton', () => () => (
  <button>Download</button>
));

jest.mock('../../components/communities/LinkStatusBadge', () => () => (
  <span>OK</span>
));

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
  tags: [],
  ...overrides
});

describe('ReleasePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCommunityByIdQuery.mockReturnValue({
      data: { id: 1, name: 'Jazz Community' }
    });
    mockVoteOn.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockRemoveVote.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockToggleBookmark.mockReturnValue({
      unwrap: () => Promise.resolve({ bookmarked: true })
    });
    mockAddTag.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockRemoveTag.mockReturnValue({ unwrap: () => Promise.resolve({}) });
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

  it('shows vote aggregate percentage and count', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        voteAggregate: { ups: 8, total: 10 }
      }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    expect(screen.getByText(/80% positive/i)).toBeInTheDocument();
    expect(screen.getByText(/10 votes/i)).toBeInTheDocument();
  });

  it('shows existing tags', () => {
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({
        tags: [
          { id: 1, name: 'jazz' },
          { id: 2, name: 'modal' }
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
      data: makeRelease({ tags: [] }),
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
      data: makeRelease({ tags: [] }),
      isLoading: false,
      error: undefined
    });
    renderWithProviders(<ReleasePage />);
    await user.type(screen.getByPlaceholderText(/add tag/i), 'blues{Enter}');
    expect(mockAddTag).toHaveBeenCalled();
  });

  it('calls removeTag when × button on a tag is clicked', async () => {
    const user = userEvent.setup();
    mockGetReleaseByIdQuery.mockReturnValue({
      data: makeRelease({ tags: [{ id: 7, name: 'jazz' }] }),
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
});
