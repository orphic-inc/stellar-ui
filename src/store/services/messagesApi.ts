import { api } from '../api';
import type { paths } from '../../types/api';

type InboxResponse =
  paths['/messages']['get']['responses'][200]['content']['application/json'];
type SentboxResponse =
  paths['/messages/sent']['get']['responses'][200]['content']['application/json'];
type ConversationResponse =
  paths['/messages/{id}']['get']['responses'][200]['content']['application/json'];
type ComposeBody = NonNullable<
  paths['/messages']['post']['requestBody']
>['content']['application/json'];
type ReplyBody = NonNullable<
  paths['/messages/{id}/reply']['post']['requestBody']
>['content']['application/json'];
type UpdateFlagsBody = NonNullable<
  paths['/messages/{id}']['patch']['requestBody']
>['content']['application/json'];
type BulkBody = NonNullable<
  paths['/messages/bulk']['post']['requestBody']
>['content']['application/json'];
type ReplyResponse =
  paths['/messages/{id}/reply']['post']['responses'][201]['content']['application/json'];
type UnreadCountResponse =
  paths['/messages/unread-count']['get']['responses'][200]['content']['application/json'];

export const messagesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInbox: build.query<InboxResponse, { page?: number; search?: string }>({
      query: ({ page = 1, search } = {}) => ({
        url: '/messages',
        params: { page, ...(search ? { search } : {}) }
      }),
      providesTags: ['PrivateMessage']
    }),

    getSentbox: build.query<SentboxResponse, { page?: number }>({
      query: ({ page = 1 } = {}) => ({
        url: '/messages/sent',
        params: { page }
      }),
      providesTags: ['PrivateMessage']
    }),

    getUnreadCount: build.query<UnreadCountResponse, void>({
      query: () => '/messages/unread-count',
      providesTags: ['PrivateMessage']
    }),

    getConversation: build.query<ConversationResponse, number>({
      query: (id) => `/messages/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'PrivateMessage', id }]
    }),

    composeMessage: build.mutation<ConversationResponse, ComposeBody>({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: ['PrivateMessage']
    }),

    replyToConversation: build.mutation<
      ReplyResponse,
      { id: number } & ReplyBody
    >({
      query: ({ id, ...body }) => ({
        url: `/messages/${id}/reply`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'PrivateMessage', id },
        'PrivateMessage'
      ]
    }),

    updateConversationFlags: build.mutation<
      void,
      { id: number } & UpdateFlagsBody
    >({
      query: ({ id, ...body }) => ({
        url: `/messages/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'PrivateMessage', id },
        'PrivateMessage'
      ]
    }),

    deleteConversation: build.mutation<void, number>({
      query: (id) => ({ url: `/messages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PrivateMessage']
    }),

    bulkUpdateConversations: build.mutation<void, BulkBody>({
      query: (body) => ({ url: '/messages/bulk', method: 'POST', body }),
      invalidatesTags: ['PrivateMessage']
    })
  })
});

export const {
  useGetInboxQuery,
  useGetSentboxQuery,
  useGetUnreadCountQuery,
  useGetConversationQuery,
  useComposeMessageMutation,
  useReplyToConversationMutation,
  useUpdateConversationFlagsMutation,
  useDeleteConversationMutation,
  useBulkUpdateConversationsMutation
} = messagesApi;
