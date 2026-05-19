import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForumTopicPage from '../../components/forum/ForumTopicPage';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { setCredentials } from '../../store/slices/authSlice';
import { createTestStore, renderWithProviders } from '../testUtils';

type TopicState = {
  id: number;
  title: string;
  isLocked: boolean;
  isSticky: boolean;
};

type PollState = {
  id: number;
  question: string;
  answers: string;
  closed: boolean;
  votes: Array<{ userId: number; vote: number }>;
};

const makeForumFetch = ({
  topic,
  poll,
  subscriptions,
  markReadStatus = 200
}: {
  topic?: TopicState;
  poll?: PollState;
  subscriptions?: Array<{ topicId: number }>;
  markReadStatus?: number;
}) => {
  const forum = { id: 9, name: 'Jazz Forum' };
  const posts = {
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
  };
  const topicState = topic ?? {
    id: 44,
    title: 'Blue Note thread',
    isLocked: false,
    isSticky: false
  };
  const pollState = poll ?? {
    id: 6,
    question: 'Best format?',
    answers: JSON.stringify(['CD', 'Vinyl']),
    closed: false,
    votes: []
  };
  const subscriptionState = subscriptions ?? [{ topicId: 44 }];

  return jest.fn(async (request: Request) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/forums/9') {
      return makeResponse({ body: forum });
    }

    if (url.pathname === '/api/forums/9/topics/44') {
      if (request.method === 'PUT') {
        const body = JSON.parse(
          (await request.text()) || '{}'
        ) as Partial<TopicState>;
        Object.assign(topicState, body);
        return makeResponse({ body: topicState });
      }

      return makeResponse({ body: topicState });
    }

    if (url.pathname === '/api/forums/9/topics/44/posts') {
      return makeResponse({ body: posts });
    }

    if (url.pathname === '/api/forums/polls/44') {
      return makeResponse({ body: pollState });
    }

    if (url.pathname === '/api/subscriptions') {
      return makeResponse({ body: subscriptionState });
    }

    if (url.pathname === '/api/subscriptions/subscribe') {
      const body = JSON.parse((await request.text()) || '{}') as {
        topicId: number;
        action: 'subscribe' | 'unsubscribe';
      };

      if (body.action === 'unsubscribe') {
        const index = subscriptionState.findIndex(
          (s) => s.topicId === body.topicId
        );
        if (index >= 0) subscriptionState.splice(index, 1);
      } else if (!subscriptionState.some((s) => s.topicId === body.topicId)) {
        subscriptionState.push({ topicId: body.topicId });
      }

      return makeResponse({ status: 204 });
    }

    if (url.pathname === '/api/forums/last-read') {
      return makeResponse({ status: markReadStatus, body: { marked: true } });
    }

    if (url.pathname === '/api/forums/poll-votes') {
      const body = JSON.parse((await request.text()) || '{}') as {
        forumPollId: number;
        vote: number;
      };
      pollState.votes = [{ userId: 9, vote: body.vote }];
      return makeResponse({
        body: { forumPollId: body.forumPollId, vote: body.vote }
      });
    }

    if (url.pathname === '/api/forums/9/catchup') {
      return makeResponse({ body: { markedRead: 3 } });
    }

    return makeResponse({
      status: 404,
      body: { msg: `Unhandled request: ${request.method} ${url.pathname}` }
    });
  });
};

jest.mock('../../components/layout/PostBox', () => {
  const MockPostBox = ({
    quoteText
  }: {
    quoteText?: string;
    onQuoteConsumed?: () => void;
  }) => <div data-testid="post-box">{quoteText || 'PostBox'}</div>;
  MockPostBox.displayName = 'MockPostBox';
  return MockPostBox;
});

jest.mock('../../components/forum/ForumTopicPost', () => {
  const MockForumTopicPost = ({
    post,
    onQuote
  }: {
    post: { id: number };
    onQuote?: (text: string) => void;
  }) => (
    <button type="button" onClick={() => onQuote?.(`[quote=${post.id}]`)}>
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

describe('ForumTopicPage RTK Query integration', () => {
  beforeAll(() => {
    ensureRequestPolyfill();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('loads topic data, marks the topic read, and performs moderation and subscription mutations through RTK Query', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 9,
        username: 'mod',
        userRank: { permissions: { forums_moderate: true } }
      } as never)
    );
    (global.fetch as jest.Mock).mockImplementation(makeForumFetch({}));

    renderWithProviders(<ForumTopicPage />, { store });

    expect((await screen.findAllByText('Blue Note thread')).length).toBe(2);
    expect(
      screen.getByRole('button', { name: /^unsubscribe$/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('post-box')).toHaveTextContent('PostBox');

    await waitFor(async () => {
      const request = (global.fetch as jest.Mock).mock.calls.find((call) =>
        (call[0] as Request).url.includes('/api/forums/last-read')
      )?.[0] as Request | undefined;

      expect(request).toBeDefined();
      expect(request?.method).toBe('POST');
      expect(await request?.text()).toBe(
        JSON.stringify({ forumTopicId: 44, forumPostId: 102 })
      );
    });

    await user.click(screen.getByRole('button', { name: /quote post 101/i }));
    expect(screen.getByTestId('post-box')).toHaveTextContent('[quote=101]');

    await user.click(screen.getByRole('button', { name: /^lock$/i }));
    await waitFor(async () => {
      const request = (global.fetch as jest.Mock).mock.calls.find(
        (call) =>
          (call[0] as Request).url.includes('/api/forums/9/topics/44') &&
          (call[0] as Request).method === 'PUT'
      )?.[0] as Request | undefined;

      expect(request).toBeDefined();
      expect(await request?.text()).toBe(JSON.stringify({ isLocked: true }));
      expect(
        screen.getByRole('button', { name: /^unlock$/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^sticky$/i }));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^unsticky$/i })
      ).toBeInTheDocument();
      expect(screen.getByText('[Sticky]')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^unsubscribe$/i }));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^subscribe$/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /catch up/i }));
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.map(
        (call) => call[0] as Request
      );
      expect(
        calls.some(
          (request) =>
            request.method === 'POST' &&
            request.url.includes('/api/forums/9/catchup')
        )
      ).toBe(true);
    });

    await user.click(screen.getByLabelText('CD'));
    await user.click(screen.getByRole('button', { name: /^vote$/i }));

    await waitFor(async () => {
      const calls = (global.fetch as jest.Mock).mock.calls
        .map((call) => call[0] as Request)
        .filter((request) => request.url.includes('/api/forums/poll-votes'));
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe('POST');
      expect(await calls[0].text()).toBe(
        JSON.stringify({ forumPollId: 6, vote: 0 })
      );
    });
  });

  it('shows parse failures and hides the reply box for locked topics when the user cannot moderate', async () => {
    const store = createTestStore();
    store.dispatch(
      setCredentials({
        id: 7,
        username: 'alice',
        userRank: { permissions: {} }
      } as never)
    );
    (global.fetch as jest.Mock).mockImplementation(
      makeForumFetch({
        topic: {
          id: 44,
          title: 'Locked topic',
          isLocked: true,
          isSticky: false
        },
        poll: {
          id: 6,
          question: 'Broken poll',
          answers: '{bad json',
          closed: false,
          votes: []
        },
        subscriptions: []
      })
    );

    renderWithProviders(<ForumTopicPage />, { store });

    expect((await screen.findAllByText('Locked topic')).length).toBe(2);
    expect(screen.getByText('Poll data is unavailable.')).toBeInTheDocument();
    expect(screen.queryByTestId('post-box')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^subscribe$/i })
    ).toBeInTheDocument();
  });
});
