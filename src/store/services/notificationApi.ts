import { api } from '../api';

export const notificationApi = api.injectEndpoints({
  endpoints: (build) => ({
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
    })
  })
});

export const { useGetNotificationsQuery, useDeleteNotificationMutation } =
  notificationApi;
