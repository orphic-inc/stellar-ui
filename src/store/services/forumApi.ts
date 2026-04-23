import { api } from '../api';
import type { paths } from '../../types/api';

interface TopicArgs {
  forumId: number;
  topicId: number;
}

interface PostArgs {
  forumId: number;
  topicId: number;
  postId: number;
}

type ForumCategoriesResponse =
  paths['/forums/categories']['get']['responses'][200]['content']['application/json'];
type CreateForumCategoryArgs = NonNullable<
  paths['/forums/categories']['post']['requestBody']
>['content']['application/json'];
type CreateForumCategoryResponse =
  paths['/forums/categories']['post']['responses'][201]['content']['application/json'];
type UpdateForumCategoryArgs = { id: number } & NonNullable<
  paths['/forums/categories/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateForumCategoryResponse =
  paths['/forums/categories/{id}']['put']['responses'][200]['content']['application/json'];

type ForumsResponse =
  paths['/forums']['get']['responses'][200]['content']['application/json'];
type ForumResponse =
  paths['/forums/{id}']['get']['responses'][200]['content']['application/json'];
type CreateForumArgs = NonNullable<
  paths['/forums']['post']['requestBody']
>['content']['application/json'];
type CreateForumResponse =
  paths['/forums']['post']['responses'][201]['content']['application/json'];
type UpdateForumArgs = { id: number } & NonNullable<
  paths['/forums/{id}']['put']['requestBody']
>['content']['application/json'];
type UpdateForumResponse =
  paths['/forums/{id}']['put']['responses'][200]['content']['application/json'];

type TopicsByForumResponse =
  paths['/forums/{forumId}/topics']['get']['responses'][200]['content']['application/json'];
type CreateTopicRequest = NonNullable<
  paths['/forums/{forumId}/topics']['post']['requestBody']
>['content']['application/json'];
type CreateTopicArgs = { forumId: number } & CreateTopicRequest;
type CreateTopicResponse =
  paths['/forums/{forumId}/topics']['post']['responses'][201]['content']['application/json'];
type TopicResponse =
  paths['/forums/{forumId}/topics/{topicId}']['get']['responses'][200]['content']['application/json'];
type UpdateTopicArgs = TopicArgs &
  NonNullable<
    paths['/forums/{forumId}/topics/{topicId}']['put']['requestBody']
  >['content']['application/json'];
type UpdateTopicResponse =
  paths['/forums/{forumId}/topics/{topicId}']['put']['responses'][200]['content']['application/json'];

type PostsByTopicResponse =
  paths['/forums/{forumId}/topics/{topicId}/posts']['get']['responses'][200]['content']['application/json'];
type CreatePostArgs = { forumId: number; topicId: number } & NonNullable<
  paths['/forums/{forumId}/topics/{topicId}/posts']['post']['requestBody']
>['content']['application/json'];
type CreatePostResponse =
  paths['/forums/{forumId}/topics/{topicId}/posts']['post']['responses'][201]['content']['application/json'];
type UpdatePostArgs = PostArgs &
  NonNullable<
    paths['/forums/{forumId}/topics/{topicId}/posts/{id}']['put']['requestBody']
  >['content']['application/json'];
type UpdatePostResponse =
  paths['/forums/{forumId}/topics/{topicId}/posts/{id}']['put']['responses'][200]['content']['application/json'];

type PollResponse =
  paths['/forums/polls/{topicId}']['get']['responses'][200]['content']['application/json'];
type VotePollArgs = NonNullable<
  paths['/forums/poll-votes']['post']['requestBody']
>['content']['application/json'] & { topicId: number };
type VotePollResponse =
  paths['/forums/poll-votes']['post']['responses'][200]['content']['application/json'];

type MarkReadArgs = NonNullable<
  paths['/forums/last-read']['post']['requestBody']
>['content']['application/json'];
type MarkReadResponse =
  paths['/forums/last-read']['post']['responses'][200]['content']['application/json'];

export type { CreateTopicArgs };

export const forumApi = api.injectEndpoints({
  endpoints: (build) => ({
    getForumCategories: build.query<ForumCategoriesResponse, void>({
      query: () => '/forums/categories',
      providesTags: ['ForumCategory']
    }),
    createForumCategory: build.mutation<
      CreateForumCategoryResponse,
      CreateForumCategoryArgs
    >({
      query: (data) => ({
        url: '/forums/categories',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ForumCategory']
    }),
    updateForumCategory: build.mutation<
      UpdateForumCategoryResponse,
      UpdateForumCategoryArgs
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

    getForums: build.query<ForumsResponse, void>({
      query: () => '/forums',
      providesTags: ['Forum']
    }),
    getForumById: build.query<ForumResponse, number>({
      query: (id) => `/forums/${id}`,
      providesTags: (_, __, id) => [{ type: 'Forum', id }]
    }),
    createForum: build.mutation<CreateForumResponse, CreateForumArgs>({
      query: (data) => ({ url: '/forums', method: 'POST', body: data }),
      invalidatesTags: ['Forum', 'ForumCategory']
    }),
    updateForum: build.mutation<UpdateForumResponse, UpdateForumArgs>({
      query: ({ id, ...data }) => ({
        url: `/forums/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Forum', id }, 'Forum']
    }),
    deleteForum: build.mutation<void, number>({
      query: (id) => ({ url: `/forums/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Forum', 'ForumCategory']
    }),

    getTopicsByForum: build.query<
      TopicsByForumResponse,
      { forumId: number; page?: number }
    >({
      query: ({ forumId, page = 1 }) =>
        `/forums/${forumId}/topics?page=${page}`,
      providesTags: (_, __, { forumId }) => [
        { type: 'ForumTopic', id: forumId }
      ]
    }),
    getTopicById: build.query<TopicResponse, TopicArgs>({
      query: ({ forumId, topicId }) => `/forums/${forumId}/topics/${topicId}`,
      providesTags: (_, __, { topicId }) => [
        { type: 'ForumTopic', id: topicId }
      ]
    }),
    createTopic: build.mutation<CreateTopicResponse, CreateTopicArgs>({
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
    updateTopic: build.mutation<UpdateTopicResponse, UpdateTopicArgs>({
      query: ({ forumId, topicId, ...data }) => ({
        url: `/forums/${forumId}/topics/${topicId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumTopic', id: topicId }
      ]
    }),
    deleteTopic: build.mutation<void, TopicArgs>({
      query: ({ forumId, topicId }) => ({
        url: `/forums/${forumId}/topics/${topicId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { forumId }) => [
        { type: 'Forum', id: forumId },
        'ForumTopic'
      ]
    }),

    getPostsByTopic: build.query<PostsByTopicResponse, TopicArgs>({
      query: ({ forumId, topicId }) =>
        `/forums/${forumId}/topics/${topicId}/posts`,
      providesTags: (_, __, { topicId }) => [{ type: 'ForumPost', id: topicId }]
    }),
    createPost: build.mutation<CreatePostResponse, CreatePostArgs>({
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
    updatePost: build.mutation<UpdatePostResponse, UpdatePostArgs>({
      query: ({ forumId, topicId, postId, ...data }) => ({
        url: `/forums/${forumId}/topics/${topicId}/posts/${postId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumPost', id: topicId }
      ]
    }),
    deletePost: build.mutation<void, PostArgs>({
      query: ({ forumId, topicId, postId }) => ({
        url: `/forums/${forumId}/topics/${topicId}/posts/${postId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumPost', id: topicId }
      ]
    }),

    getPollByTopic: build.query<PollResponse, number>({
      query: (topicId) => `/forums/polls/${topicId}`
    }),
    votePoll: build.mutation<VotePollResponse, VotePollArgs>({
      query: ({ topicId: _topicId, ...data }) => ({
        url: '/forums/poll-votes',
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_, __, { topicId }) => [
        { type: 'ForumTopic', id: topicId }
      ]
    }),

    markTopicRead: build.mutation<MarkReadResponse, MarkReadArgs>({
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
  useUpdateForumMutation,
  useDeleteForumMutation,
  useGetTopicsByForumQuery,
  useGetTopicByIdQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  useGetPostsByTopicQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPollByTopicQuery,
  useVotePollMutation,
  useMarkTopicReadMutation
} = forumApi;
