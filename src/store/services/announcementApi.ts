import { api } from '../api';
import type { AnnouncementsResponse } from '../../types';

export const announcementApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnnouncements: build.query<AnnouncementsResponse, void>({
      query: () => '/announcements',
      providesTags: ['Announcement']
    }),
    createAnnouncement: build.mutation<void, { title: string; body: string }>({
      query: (data) => ({ url: '/announcements', method: 'POST', body: data }),
      invalidatesTags: ['Announcement']
    }),
    deleteAnnouncement: build.mutation<void, number>({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Announcement']
    }),
    createBlogPost: build.mutation<void, { title: string; body: string }>({
      query: (data) => ({
        url: '/announcements/blog',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Announcement']
    }),
    deleteBlogPost: build.mutation<void, number>({
      query: (id) => ({ url: `/announcements/blog/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Announcement']
    })
  })
});

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useCreateBlogPostMutation,
  useDeleteBlogPostMutation
} = announcementApi;
