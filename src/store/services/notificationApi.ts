import { api } from '../api';

export interface NotificationQuoter {
  id: number;
  username: string;
  avatar: string | null;
}

export interface NotificationSource {
  title: string;
  forumId?: number;
}

export interface Notification {
  id: number;
  userId: number;
  quoterId: number;
  quoter: NotificationQuoter;
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
