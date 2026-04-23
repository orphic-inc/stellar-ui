import { api } from '../api';
import type {
  ForumCategory,
  Forum,
  ForumTopic,
  ForumPost,
  ForumPoll,
  PaginatedResponse
} from '../../types';

interface TopicArgs {
  forumId: number;
  topicId: number;
}
interface PostArgs {
  forumId: number;
  topicId: number;
  postId?: number;
}
interface CreateTopicArgs {
  forumId: number;
  title: string;
  body: string;
  poll?: { question: string; answers: string[] };
}
interface CreatePostArgs {
  forumId: number;
  topicId: number;
  body: string;
}
interface MarkReadArgs {
  forumTopicId: number;
  forumPostId: number;
}

export const forumApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Categories
    getForumCategories: build.query<ForumCategory[], void>({
      query: () => '/forums/categories',
      providesTags: ['ForumCategory']
    }),
    createForumCategory: build.mutation<
      ForumCategory,
      { name: string; sort?: number }
    >({
      query: (data) => ({
        url: '/forums/categories',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ForumCategory']
    }),
    updateForumCategory: build.mutation<
      ForumCategory,
      { id: number; name?: string; sort?: number }
    >({
      query: ({ id, ...data }) => ({
        url: `/forums/categories/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ForumCategory']
    }),
    deleteForumCategory: build.mutation<void, number>({
      query: (id) => ({ url: `/forums/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ForumCategory']
    }),

    // Forums
    getForums: build.query<Forum[], void>({
      query: () => '/forums',
      providesTags: ['Forum']
    }),
    getForumById: build.query<Forum, number>({
      query: (id) => `/forums/${id}`,
      providesTags: (_, __, id) => [{ type: 'Forum', id }]
    }),
    createForum: build.mutation<
      Forum,
      Partial<Forum> & { forumCategoryId: number }
    >({
      query: (data) => ({ url: '/forums', method: 'POST', body: data }),
      invalidatesTags: ['Forum', 'ForumCategory']
    }),

    // Topics
    getTopicsByForum: build.query<
      PaginatedResponse<ForumTopic>,
      { forumId: number; page?: number }
    >({
      query: ({ forumId, page = 1 }) =>
        `/forums/${forumId}/topics?page=${page}`,
      providesTags: (_, __, { forumId }) => [
        { type: 'ForumTopic', id: forumId }
      ]
    }),
    getTopicById: build.query<ForumTopic, TopicArgs>({
      query: ({ forumId, topicId }) => `/forums/${forumId}/topics/${topicId}`,
      providesTags: (_, __, { topicId }) => [
        { type: 'ForumTopic', id: topicId }
      ]
    }),
    createTopic: build.mutation<ForumTopic, CreateTopicArgs>({
      query: ({ forumId, ...data }) => ({
        url: `/forums/${forumId}/topics`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_, __, { forumId }) => [
        { type: 'Forum', id: forumId },
        'ForumTopic'
      ]
    }),
    updateTopic: build.mutation<ForumTopic, TopicArgs & Partial<ForumTopic>>({
      query: ({ forumId, topicId, ...data }) => ({
        url: `/forums/${forumId}/topics/${topicId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumTopic', id: topicId }
      ]
    }),

    // Posts
    getPostsByTopic: build.query<PaginatedResponse<ForumPost>, TopicArgs>({
      query: ({ forumId, topicId }) =>
        `/forums/${forumId}/topics/${topicId}/posts`,
      providesTags: (_, __, { topicId }) => [{ type: 'ForumPost', id: topicId }]
    }),
    createPost: build.mutation<ForumPost, CreatePostArgs>({
      query: ({ forumId, topicId, ...data }) => ({
        url: `/forums/${forumId}/topics/${topicId}/posts`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_, __, { topicId, forumId }) => [
        { type: 'ForumPost', id: topicId },
        { type: 'Forum', id: forumId }
      ]
    }),
    updatePost: build.mutation<ForumPost, PostArgs & { body: string }>({
      query: ({ forumId, topicId, postId, ...data }) => ({
        url: `/forums/${forumId}/topics/${topicId}/posts/${postId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumPost', id: topicId }
      ]
    }),
    deletePost: build.mutation<void, Required<PostArgs>>({
      query: ({ forumId, topicId, postId }) => ({
        url: `/forums/${forumId}/topics/${topicId}/posts/${postId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumPost', id: topicId }
      ]
    }),

    // Polls
    getPollByTopic: build.query<ForumPoll, number>({
      query: (topicId) => `/forums/polls/${topicId}`
    }),
    votePoll: build.mutation<void, { forumPollId: number; vote: number }>({
      query: (data) => ({
        url: '/forums/poll-votes',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Forum']
    }),

    // Last read
    markTopicRead: build.mutation<void, MarkReadArgs>({
      query: (data) => ({
        url: '/forums/last-read',
        method: 'POST',
        body: data
      })
    })
  })
});

export const {
  useGetForumCategoriesQuery,
  useCreateForumCategoryMutation,
  useUpdateForumCategoryMutation,
  useDeleteForumCategoryMutation,
  useGetForumsQuery,
  useGetForumByIdQuery,
  useCreateForumMutation,
  useGetTopicsByForumQuery,
  useGetTopicByIdQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useGetPostsByTopicQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPollByTopicQuery,
  useVotePollMutation,
  useMarkTopicReadMutation
} = forumApi;
