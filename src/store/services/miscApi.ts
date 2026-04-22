import { api } from '../api';
import type { AnnouncementsResponse, SiteStats } from '../../types';

interface CommentParams {
  page?: string;
  type?: string;
  id?: number;
}
interface CommentBody {
  page: string;
  type: string;
  body: string;
  id?: number;
}
interface SubscribeArgs {
  page: string;
  subId: number;
}

export const miscApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnnouncements: build.query<AnnouncementsResponse, void>({
      query: () => '/announcements',
      providesTags: ['Announcement']
    }),
    getSiteStats: build.query<SiteStats, void>({
      query: () => '/stats',
      providesTags: ['Stats']
    }),
    getStylesheets: build.query<
      { id: number; name: string; url?: string }[],
      void
    >({
      query: () => '/stylesheet',
      providesTags: ['Stylesheet']
    }),
    getComments: build.query<{ id: number; body: string }[], CommentParams>({
      query: (params) => ({ url: '/comments', params }),
      providesTags: ['Comment']
    }),
    createComment: build.mutation<{ id: number }, CommentBody>({
      query: (data) => ({ url: '/comments', method: 'POST', body: data }),
      invalidatesTags: ['Comment']
    }),
    updateComment: build.mutation<void, { id: number; body: string }>({
      query: ({ id, ...data }) => ({
        url: `/comments/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Comment']
    }),
    deleteComment: build.mutation<void, number>({
      query: (id) => ({ url: `/comments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Comment']
    }),
    getNotifications: build.query<
      { id: number; message: string; createdAt: string }[],
      void
    >({
      query: () => '/notifications',
      providesTags: ['Notification']
    }),
    deleteNotification: build.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification']
    }),
    subscribe: build.mutation<void, SubscribeArgs>({
      query: (data) => ({
        url: '/subscriptions/subscribe',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),
    subscribeComments: build.mutation<void, SubscribeArgs>({
      query: (data) => ({
        url: '/subscriptions/subscribe-comments',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),
    getSubscriptions: build.query<{ id: number }[], void>({
      query: () => '/subscriptions',
      providesTags: ['Subscription']
    })
  })
});

export const {
  useGetAnnouncementsQuery,
  useGetSiteStatsQuery,
  useGetStylesheetsQuery,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useSubscribeMutation,
  useSubscribeCommentsMutation,
  useGetSubscriptionsQuery
} = miscApi;
