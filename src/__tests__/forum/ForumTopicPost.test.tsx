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

jest.mock('../../store/services/forumApi', () => ({
  useUpdatePostMutation: () => [mockUpdatePost, { isLoading: false }],
  useDeletePostMutation: () => [mockDeletePost]
}));

const mockPost = {
  id: 7,
  author: { id: 10, username: 'alice', avatar: null },
  body: 'Hello forum world',
  createdAt: '2024-03-01T00:00:00Z'
};

describe('ForumTopicPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatePost.mockResolvedValue({});
    mockDeletePost.mockResolvedValue({});
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
});
