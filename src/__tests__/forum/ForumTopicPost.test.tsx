import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import ForumTopicPost from '../../components/forum/ForumTopicPost';

jest.mock('dompurify', () => ({
  sanitize: (html: string) => html
}));

jest.mock('../../utils/bbcode', () => ({
  parseBBCode: (s: string) => s,
  quotePost: (username: string, body: string) =>
    `[quote=${username}]${body}[/quote]`
}));

jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  )
}));

const mockUpdatePost = jest.fn();
const mockDeletePost = jest.fn();
const mockLoadEditHistory = jest.fn();

let mockIsSaving = false;
let mockEditHistoryData: { data: Array<Record<string, unknown>> } | undefined =
  undefined;
let mockEditHistoryLoading = false;

jest.mock('../../store/services/forumApi', () => ({
  useLazyGetPostEditHistoryQuery: () => [
    mockLoadEditHistory,
    { data: mockEditHistoryData, isFetching: mockEditHistoryLoading }
  ],
  useUpdatePostMutation: () => [mockUpdatePost, { isLoading: mockIsSaving }],
  useDeletePostMutation: () => [mockDeletePost]
}));

const mockPost = {
  id: 7,
  forumTopicId: 5,
  authorId: 10,
  author: { id: 10, username: 'alice', avatar: null },
  body: 'Hello forum world',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z'
};

const mockEditedPost = {
  ...mockPost,
  lastEdit: {
    id: 2,
    forumPostId: 7,
    editorId: 12,
    editedAt: '2024-03-03T00:00:00Z',
    editor: { id: 12, username: 'charlie' }
  }
};

const mockEditHistory = {
  data: [
    {
      id: 2,
      forumPostId: 7,
      editorId: 12,
      previousBody: 'Second draft',
      editedAt: '2024-03-03T00:00:00Z',
      editor: { id: 12, username: 'charlie' }
    },
    {
      id: 1,
      forumPostId: 7,
      editorId: 10,
      previousBody: 'Original body',
      editedAt: '2024-03-02T00:00:00Z',
      editor: { id: 10, username: 'alice' }
    }
  ]
};

describe('ForumTopicPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSaving = false;
    mockEditHistoryData = undefined;
    mockEditHistoryLoading = false;
    mockUpdatePost.mockResolvedValue({});
    mockDeletePost.mockResolvedValue({});
    mockLoadEditHistory.mockResolvedValue({});
    window.confirm = jest.fn(() => true);
  });

  it('renders author username link and body', () => {
    renderWithProviders(
      <ForumTopicPost post={mockPost} forumId={1} topicId={5} />
    );
    expect(screen.getByRole('link', { name: 'alice' })).toBeInTheDocument();
    expect(screen.getByText('Hello forum world')).toBeInTheDocument();
  });

  it('shows Quote button always', () => {
    renderWithProviders(
      <ForumTopicPost post={mockPost} forumId={1} topicId={5} />
    );
    expect(screen.getByRole('button', { name: /quote/i })).toBeInTheDocument();
  });

  it('shows Edit button when currentUserId matches author', () => {
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('hides Edit button when currentUserId does not match author', () => {
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={99}
      />
    );
    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
  });

  it('shows Edit button for moderator even without ownership', () => {
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={99}
        canModerate={true}
      />
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('shows Delete button for post owner', () => {
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows Delete button for moderator even without ownership', () => {
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={99}
        canModerate={true}
      />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onQuote with formatted quote text when Quote is clicked', async () => {
    const user = userEvent.setup();
    const mockOnQuote = jest.fn();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        onQuote={mockOnQuote}
      />
    );
    await user.click(screen.getByRole('button', { name: /quote/i }));
    expect(mockOnQuote).toHaveBeenCalledWith(
      '[quote=alice]Hello forum world[/quote]'
    );
  });

  it('shows edit form when Edit is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('lets moderators open the edit form for another user post', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={99}
        canModerate={true}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls updatePost on save with edited body', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'Updated body');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(mockUpdatePost).toHaveBeenCalledWith({
        forumId: 1,
        topicId: 5,
        postId: 7,
        body: 'Updated body'
      });
    });
  });

  it('restores body and hides form on Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hello forum world')).toBeInTheDocument();
  });

  it('calls deletePost after confirm on Delete click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(mockDeletePost).toHaveBeenCalledWith({
        forumId: 1,
        topicId: 5,
        postId: 7
      });
    });
  });

  it('uses "unknown" fallback for author username when author is null', async () => {
    const user = userEvent.setup();
    const mockOnQuote = jest.fn();
    const postWithNullAuthor = { ...mockPost, author: undefined };
    renderWithProviders(
      <ForumTopicPost
        post={postWithNullAuthor}
        forumId={1}
        topicId={5}
        onQuote={mockOnQuote}
      />
    );
    await user.click(screen.getByRole('button', { name: /quote/i }));
    expect(mockOnQuote).toHaveBeenCalledWith(
      '[quote=unknown]Hello forum world[/quote]'
    );
  });

  it('shows "Saving…" in save button when saving is true', async () => {
    mockIsSaving = true;
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(
      screen.getByRole('button', { name: /saving…/i })
    ).toBeInTheDocument();
  });

  it('does not call deletePost when confirm is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockPost}
        forumId={1}
        topicId={5}
        currentUserId={10}
      />
    );
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockDeletePost).not.toHaveBeenCalled();
  });

  it('renders the latest edit attribution for edited posts', () => {
    renderWithProviders(
      <ForumTopicPost post={mockEditedPost} forumId={1} topicId={5} />
    );

    expect(screen.getByText(/last edited by/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'charlie' })).toBeInTheDocument();
    expect(screen.getByText('2024-03-03T00:00:00Z')).toBeInTheDocument();
  });

  it('does not show edit history control to non-moderators', () => {
    renderWithProviders(
      <ForumTopicPost post={mockEditedPost} forumId={1} topicId={5} />
    );

    expect(
      screen.queryByRole('button', { name: /view edit history/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Original body')).not.toBeInTheDocument();
  });

  it('shows moderator edit history with previous revisions newest first', async () => {
    const user = userEvent.setup();
    mockEditHistoryData = mockEditHistory;
    renderWithProviders(
      <ForumTopicPost
        post={mockEditedPost}
        forumId={1}
        topicId={5}
        canModerate={true}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /view edit history/i })
    );

    expect(screen.getAllByText('2024-03-03T00:00:00Z')).toHaveLength(2);
    expect(screen.getAllByText('2024-03-02T00:00:00Z')).toHaveLength(1);
    expect(screen.getByText('Second draft')).toBeInTheDocument();
    expect(screen.getByText('Original body')).toBeInTheDocument();

    const historyBodies = screen.getAllByText(/Second draft|Original body/);
    expect(historyBodies[0]).toHaveTextContent('Second draft');
    expect(historyBodies[1]).toHaveTextContent('Original body');
  });

  it('hides moderator edit history after toggling closed', async () => {
    const user = userEvent.setup();
    mockEditHistoryData = mockEditHistory;
    renderWithProviders(
      <ForumTopicPost
        post={mockEditedPost}
        forumId={1}
        topicId={5}
        canModerate={true}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /view edit history/i })
    );
    await user.click(
      screen.getByRole('button', { name: /hide edit history/i })
    );

    expect(screen.queryByText('Second draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Original body')).not.toBeInTheDocument();
  });

  it('loads moderator edit history on first open when not already cached', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForumTopicPost
        post={mockEditedPost}
        forumId={1}
        topicId={5}
        canModerate={true}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /view edit history/i })
    );

    expect(mockLoadEditHistory).toHaveBeenCalledWith({
      forumId: 1,
      topicId: 5,
      postId: 7
    });
  });

  it('shows loading state while moderator edit history is fetching', async () => {
    const user = userEvent.setup();
    mockEditHistoryLoading = true;
    renderWithProviders(
      <ForumTopicPost
        post={mockEditedPost}
        forumId={1}
        topicId={5}
        canModerate={true}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /view edit history/i })
    );

    expect(screen.getByText(/loading edit history/i)).toBeInTheDocument();
  });
});
