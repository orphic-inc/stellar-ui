import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CommentsSection from '../../components/layout/CommentsSection';

jest.mock('dompurify', () => ({ sanitize: (html: string) => html }));
jest.mock('../../components/layout/Time', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>
}));

const mockCreateComment = jest.fn();
const mockDeleteComment = jest.fn();

let mockCommentsData: unknown[] | undefined = [];
let mockIsLoading = false;

const mockComments = [
  {
    id: 1,
    authorId: 10,
    author: { username: 'alice' },
    body: '<b>Hello</b>',
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    authorId: 99,
    author: { username: 'bob' },
    body: 'World',
    createdAt: '2024-01-02'
  }
];

jest.mock('../../store/services/commentApi', () => ({
  useGetCommentsQuery: () => ({
    data: mockCommentsData,
    isLoading: mockIsLoading
  }),
  useCreateCommentMutation: () => [mockCreateComment, { isLoading: false }],
  useDeleteCommentMutation: () => [mockDeleteComment]
}));

let mockCurrentUser: { id: number; username: string } | null = {
  id: 99,
  username: 'bob'
};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockCurrentUser
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )
}));

describe('CommentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommentsData = mockComments;
    mockIsLoading = false;
    mockCurrentUser = { id: 99, username: 'bob' };
    mockCreateComment.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows loading state', () => {
    mockIsLoading = true;
    mockCommentsData = undefined;
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no comments', () => {
    mockCommentsData = [];
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('renders comment authors and bodies', () => {
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('shows delete button for own comment (bob)', () => {
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    expect(
      screen.getByRole('button', { name: /delete comment/i })
    ).toBeInTheDocument();
  });

  it("shows report link for other users' comments (alice)", () => {
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    expect(
      screen.getByRole('link', { name: /report comment/i })
    ).toBeInTheDocument();
  });

  it('calls deleteComment when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    await user.click(screen.getByRole('button', { name: /delete comment/i }));
    expect(mockDeleteComment).toHaveBeenCalledWith(2);
  });

  it('calls createComment with releaseId on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentsSection page="release" pageId={5} />);
    await user.type(
      screen.getByPlaceholderText(/add a comment/i),
      'Nice release'
    );
    await user.click(screen.getByRole('button', { name: /post comment/i }));
    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith({
        page: 'release',
        body: 'Nice release',
        releaseId: 5
      });
    });
  });

  it('clears comment body after successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentsSection page="release" pageId={5} />);
    const textarea = screen.getByPlaceholderText(/add a comment/i);
    await user.type(textarea, 'Hello world');
    await user.click(screen.getByRole('button', { name: /post comment/i }));
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('hides form when user is not logged in', () => {
    mockCurrentUser = null;
    renderWithProviders(<CommentsSection page="release" pageId={1} />);
    expect(
      screen.queryByPlaceholderText(/add a comment/i)
    ).not.toBeInTheDocument();
  });
});
