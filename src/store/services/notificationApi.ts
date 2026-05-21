import { api } from '../api';

export type NotificationType =
  | 'forum_quote'
  | 'forum_sub'
  | 'request_filled'
  | 'collage_updated'
  | 'comment_sub'
  | 'artist_release';

export interface NotificationActor {
  id: number;
  username: string;
  avatar: string | null;
}

export interface NotificationSource {
  title: string;
  forumId?: number;
  releaseId?: number;
  communityId?: number;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  actorId: number | null;
  actor: NotificationActor | null;
  page: string;
  pageId: number;
  postId: number | null;
  readAt: string | null;
  createdAt: string;
  source: NotificationSource | null;
}

export const notificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<Notification[], void>({
      query: () => '/notifications',
      providesTags: ['Notification']
    }),

    getUnreadNotificationCount: build.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification']
    }),

    markNotificationRead: build.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification']
    }),

    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification']
    }),

    deleteNotification: build.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation
} = notificationApi;
