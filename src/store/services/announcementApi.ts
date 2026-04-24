import { api } from '../api';
import type { paths } from '../../types/api';

type AnnouncementsResponse =
  paths['/announcements']['get']['responses'][200]['content']['application/json'];
type CreateAnnouncementArgs = NonNullable<
  paths['/announcements']['post']['requestBody']
>['content']['application/json'];
type CreateAnnouncementResponse =
  paths['/announcements']['post']['responses'][201]['content']['application/json'];
type CreateBlogPostArgs = NonNullable<
  paths['/announcements/blog']['post']['requestBody']
>['content']['application/json'];
type CreateBlogPostResponse =
  paths['/announcements/blog']['post']['responses'][201]['content']['application/json'];

export const announcementApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnnouncements: build.query<AnnouncementsResponse, void>({
      query: () => '/announcements',
      providesTags: ['Announcement']
    }),
    createAnnouncement: build.mutation<
      CreateAnnouncementResponse,
      CreateAnnouncementArgs
    >({
      query: (data) => ({ url: '/announcements', method: 'POST', body: data }),
      invalidatesTags: ['Announcement']
    }),
    deleteAnnouncement: build.mutation<void, number>({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Announcement']
    }),
    createBlogPost: build.mutation<CreateBlogPostResponse, CreateBlogPostArgs>({
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
