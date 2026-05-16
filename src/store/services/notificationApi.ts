import { api } from '../api';
import type { paths, components } from '../../types/api';

type NotificationsResponse =
  paths['/notifications']['get']['responses'][200]['content']['application/json'];

export type Notification = components['schemas']['Notification'];

export const notificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<NotificationsResponse, void>({
      query: () => '/notifications',
      providesTags: ['Notification']
    }),
    deleteNotification: build.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification']
    })
  })
});

export const { useGetNotificationsQuery, useDeleteNotificationMutation } =
  notificationApi;
