import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { forumApi } from '../../store/services/forumApi';
import { messagesApi } from '../../store/services/messagesApi';
import { staffInboxApi } from '../../store/services/staffInboxApi';

const fetchMock = jest.fn();

const getLastRequest = async () => {
  const request = fetchMock.mock.calls.at(-1)?.[0] as Request | undefined;
  if (!request) throw new Error('Expected fetch to be called');

  return {
    url: request.url,
    method: request.method,
    body: await request.text()
  };
};

beforeAll(() => {
  ensureRequestPolyfill();
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    writable: true
  });
});

beforeEach(() => {
  fetchMock.mockReset();
});

describe('discussion-oriented service APIs', () => {
  it('builds forumApi requests across category, forum, topic, post, poll, and read-state flows', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(forumApi.endpoints.getForumCategories.initiate()),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/forums/categories',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.createForumCategory.initiate({
              name: 'General',
              sort: 1
            })
          ),
        response: { status: 201, body: { id: 1 } },
        expected: {
          url: '/api/forums/categories',
          method: 'POST',
          body: JSON.stringify({ name: 'General', sort: 1 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(forumApi.endpoints.getForumById.initiate(4)),
        response: { status: 200, body: { id: 4 } },
        expected: { url: '/api/forums/4', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.createTopic.initiate({
              forumId: 4,
              title: 'Rules',
              body: 'Read this first'
            })
          ),
        response: { status: 201, body: { id: 8 } },
        expected: {
          url: '/api/forums/4/topics',
          method: 'POST',
          body: JSON.stringify({
            title: 'Rules',
            body: 'Read this first'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.updateTopic.initiate({
              forumId: 4,
              topicId: 8,
              title: 'Updated Rules'
            })
          ),
        response: { status: 200, body: { id: 8 } },
        expected: {
          url: '/api/forums/4/topics/8',
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated Rules' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.getPostsByTopic.initiate({
              forumId: 4,
              topicId: 8
            })
          ),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/forums/4/topics/8/posts',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.createPost.initiate({
              forumId: 4,
              topicId: 8,
              body: 'First reply'
            })
          ),
        response: { status: 201, body: { id: 12 } },
        expected: {
          url: '/api/forums/4/topics/8/posts',
          method: 'POST',
          body: JSON.stringify({ body: 'First reply' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.updatePost.initiate({
              forumId: 4,
              topicId: 8,
              postId: 12,
              body: 'Edited reply'
            })
          ),
        response: { status: 200, body: { id: 12 } },
        expected: {
          url: '/api/forums/4/topics/8/posts/12',
          method: 'PUT',
          body: JSON.stringify({ body: 'Edited reply' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(forumApi.endpoints.getPollByTopic.initiate(8)),
        response: { status: 200, body: { topicId: 8, options: [] } },
        expected: { url: '/api/forums/polls/8', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.votePoll.initiate({
              topicId: 8,
              forumPollId: 3,
              vote: 1
            })
          ),
        response: { status: 200, body: { id: 3 } },
        expected: {
          url: '/api/forums/poll-votes',
          method: 'POST',
          body: JSON.stringify({ forumPollId: 3, vote: 1 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            forumApi.endpoints.markTopicRead.initiate({
              forumTopicId: 8,
              forumPostId: 12
            })
          ),
        response: { status: 200, body: { ok: true } },
        expected: {
          url: '/api/forums/last-read',
          method: 'POST',
          body: JSON.stringify({ forumTopicId: 8, forumPostId: 12 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(forumApi.endpoints.catchupForum.initiate(4)),
        response: { status: 200, body: { markedRead: 3 } },
        expected: {
          url: '/api/forums/4/catchup',
          method: 'POST',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(forumApi.endpoints.getForumCategoriesAdmin.initiate()),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/forums/categories?all=true',
          method: 'GET',
          body: ''
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });

  it('builds messagesApi requests for inbox, conversation, draft, and staff PM flows', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            messagesApi.endpoints.getInbox.initiate({
              page: 2,
              search: 'staff'
            })
          ),
        response: { status: 200, body: { data: [], meta: { page: 2 } } },
        expected: {
          url: '/api/messages?page=2&search=staff',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            messagesApi.endpoints.replyToConversation.initiate({
              id: 11,
              body: 'Reply body'
            })
          ),
        response: { status: 201, body: { id: 12, body: 'Reply body' } },
        expected: {
          url: '/api/messages/11/reply',
          method: 'POST',
          body: JSON.stringify({ body: 'Reply body' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            messagesApi.endpoints.updateConversationFlags.initiate({
              id: 11,
              isSticky: true,
              isRead: false
            })
          ),
        response: { status: 204 },
        expected: {
          url: '/api/messages/11',
          method: 'PATCH',
          body: JSON.stringify({ isSticky: true, isRead: false })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            messagesApi.endpoints.bulkUpdateConversations.initiate({
              ids: [11, 12],
              action: 'markUnread'
            })
          ),
        response: { status: 204 },
        expected: {
          url: '/api/messages/bulk',
          method: 'POST',
          body: JSON.stringify({ ids: [11, 12], action: 'markUnread' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            messagesApi.endpoints.createDraft.initiate({
              subject: 'Draft',
              body: 'Draft body'
            })
          ),
        response: { status: 201, body: { id: 21 } },
        expected: {
          url: '/api/messages/drafts',
          method: 'POST',
          body: JSON.stringify({ subject: 'Draft', body: 'Draft body' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            messagesApi.endpoints.sendMassPm.initiate({
              subject: 'Staff update',
              body: 'All hands'
            })
          ),
        response: { status: 200, body: { sentCount: 18 } },
        expected: {
          url: '/api/messages/mass',
          method: 'POST',
          body: JSON.stringify({ subject: 'Staff update', body: 'All hands' })
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });

  it('builds staffInboxApi requests for canned responses, tickets, queue filtering, and resolution flows', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(staffInboxApi.endpoints.getCannedResponses.initiate()),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/staff-inbox/responses',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            staffInboxApi.endpoints.createCannedResponse.initiate({
              name: 'Greeting',
              body: 'Hello there'
            })
          ),
        response: { status: 201, body: { id: 1 } },
        expected: {
          url: '/api/staff-inbox/responses',
          method: 'POST',
          body: JSON.stringify({ name: 'Greeting', body: 'Hello there' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            staffInboxApi.endpoints.getMyTickets.initiate({ page: 2 })
          ),
        response: { status: 200, body: { data: [], meta: { page: 2 } } },
        expected: {
          url: '/api/staff-inbox/tickets?page=2',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            staffInboxApi.endpoints.getTicketQueue.initiate({
              page: 3,
              status: 'Open',
              assignedToMe: true,
              unassigned: false
            })
          ),
        response: { status: 200, body: { data: [], meta: { page: 3 } } },
        expected: {
          url: '/api/staff-inbox/queue?page=3&status=Open&assignedToMe=true&unassigned=false',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            staffInboxApi.endpoints.replyToTicket.initiate({
              id: 12,
              body: 'Resolved'
            })
          ),
        response: { status: 201, body: { id: 4, body: 'Resolved' } },
        expected: {
          url: '/api/staff-inbox/tickets/12/reply',
          method: 'POST',
          body: JSON.stringify({ body: 'Resolved' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            staffInboxApi.endpoints.assignTicket.initiate({
              id: 12,
              assignedUserId: 7
            })
          ),
        response: { status: 204 },
        expected: {
          url: '/api/staff-inbox/tickets/12/assign',
          method: 'POST',
          body: JSON.stringify({ assignedUserId: 7 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            staffInboxApi.endpoints.bulkResolveTickets.initiate({
              ids: [12, 13]
            })
          ),
        response: { status: 200, body: { resolved: 2 } },
        expected: {
          url: '/api/staff-inbox/bulk-resolve',
          method: 'POST',
          body: JSON.stringify({ ids: [12, 13] })
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });
});
