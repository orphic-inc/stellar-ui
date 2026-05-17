import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import ForumTopicPage from '../../components/forum/ForumTopicPage';

type MockForumPostProps = {
  post: { id: number };
  onQuote?: (text: string) => void;
};

const mockUseGetForumByIdQuery = jest.fn();
const mockUseGetTopicByIdQuery = jest.fn();
const mockUseGetPostsByTopicQuery = jest.fn();
const mockUseGetPollByTopicQuery = jest.fn();
const mockUseGetSubscriptionsQuery = jest.fn();
const mockMarkRead = jest.fn();
const mockVotePoll = jest.fn();
const mockSubscribe = jest.fn();
const mockUpdateTopic = jest.fn();
const mockCatchupForum = jest.fn();

jest.mock('../../store/services/forumApi', () => ({
  useGetForumByIdQuery: (...args: unknown[]) =>
    mockUseGetForumByIdQuery(...args),
  useGetTopicByIdQuery: (...args: unknown[]) =>
    mockUseGetTopicByIdQuery(...args),
  useGetPostsByTopicQuery: (...args: unknown[]) =>
    mockUseGetPostsByTopicQuery(...args),
  useGetPollByTopicQuery: (...args: unknown[]) =>
    mockUseGetPollByTopicQuery(...args),
  useMarkTopicReadMutation: () => [mockMarkRead],
  useVotePollMutation: () => [mockVotePoll, { isLoading: false }],
  useUpdateTopicMutation: () => [mockUpdateTopic, { isLoading: false }],
  useCatchupForumMutation: () => [mockCatchupForum]
}));

jest.mock('../../store/services/subscriptionApi', () => ({
  useGetSubscriptionsQuery: () => mockUseGetSubscriptionsQuery(),
  useSubscribeMutation: () => [mockSubscribe, { isLoading: false }]
}));

jest.mock('../../components/layout/PostBox', () => {
  const MockPostBox = () => <div data-testid="post-box">PostBox</div>;
  MockPostBox.displayName = 'MockPostBox';
  return MockPostBox;
});

jest.mock('../../components/forum/ForumTopicPost', () => {
  const MockForumTopicPost = ({ post, onQuote }: MockForumPostProps) => (
    <button type="button" onClick={() => onQuote?.('[quote]text[/quote]')}>
      Quote Post {post.id}
    </button>
  );
  MockForumTopicPost.displayName = 'MockForumTopicPost';
  return MockForumTopicPost;
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ forumId: '9', forumTopicId: '44' })
}));

describe('ForumTopicPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetForumByIdQuery.mockReturnValue({
      data: { id: 9, name: 'Jazz Forum' }
    });
    mockUseGetTopicByIdQuery.mockReturnValue({
      data: {
        id: 44,
        title: 'Blue Note thread',
        isLocked: false,
        isSticky: false
      },
      isLoading: false
    });
    mockUseGetPostsByTopicQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 101,
            body: 'First post',
            author: { id: 7, username: 'alice' }
          },
          {
            id: 102,
            body: 'Second post',
            author: { id: 8, username: 'bob' }
          }
        ]
      },
      isLoading: false
    });
    mockUseGetPollByTopicQuery.mockReturnValue({
      data: {
        id: 6,
        question: 'Best format?',
        answers: JSON.stringify(['CD', 'Vinyl']),
        closed: false,
        votes: []
      }
    });
    mockUseGetSubscriptionsQuery.mockReturnValue({
      data: [{ topicId: 44 }]
    });
  });

  it('marks the topic read and lets a moderator manage poll and topic actions', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod',
        userRank: { permissions: { forums_moderate: true } }
      } as never)
    );

    renderWithProviders(<ForumTopicPage />, { store });

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith({
        forumTopicId: 44,
        forumPostId: 102
      });
    });

    await user.click(screen.getByRole('button', { name: /^lock$/i }));
    await user.click(screen.getByRole('button', { name: /^sticky$/i }));
    await user.click(screen.getByRole('button', { name: /^unsubscribe$/i }));
    await user.click(screen.getByRole('button', { name: /catch up/i }));
    await user.click(screen.getByRole('button', { name: /quote post 101/i }));
    await user.click(screen.getByLabelText('CD'));
    await user.click(screen.getByRole('button', { name: /^vote$/i }));

    expect(mockUpdateTopic).toHaveBeenNthCalledWith(1, {
      forumId: 9,
      topicId: 44,
      isLocked: true
    });
    expect(mockUpdateTopic).toHaveBeenNthCalledWith(2, {
      forumId: 9,
      topicId: 44,
      isSticky: true
    });
    expect(mockSubscribe).toHaveBeenCalledWith({
      topicId: 44,
      action: 'unsubscribe'
    });
    expect(mockCatchupForum).toHaveBeenCalledWith(9);
    expect(mockVotePoll).toHaveBeenCalledWith({
      forumPollId: 6,
      vote: 0,
      topicId: 44
    });
    expect(screen.getByTestId('post-box')).toBeInTheDocument();
  });

  it('shows poll parse failure and hides the reply box for locked topics', () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    mockUseGetTopicByIdQuery.mockReturnValue({
      data: { id: 44, title: 'Locked topic', isLocked: true, isSticky: false },
      isLoading: false
    });
    mockUseGetPollByTopicQuery.mockReturnValue({
      data: {
        id: 6,
        question: 'Broken poll',
        answers: '{bad json',
        closed: false,
        votes: []
      }
    });

    renderWithProviders(<ForumTopicPage />, { store });

    expect(screen.getByText('Poll data is unavailable.')).toBeInTheDocument();
    expect(screen.queryByTestId('post-box')).not.toBeInTheDocument();
  });
});
