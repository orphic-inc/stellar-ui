import { api } from '../api';
import type { paths } from '../../types/api';

export type Notification =
  paths['/notifications']['get']['responses'][200]['content']['application/json'][number];
export type NotificationType = Notification['type'];
export type NotificationActor = NonNullable<Notification['actor']>;
export type NotificationSource = NonNullable<Notification['source']>;

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
