import { api } from '../api';
import type { paths } from '../../types/api';

export type CommentPage = NonNullable<
  paths['/comments']['get']['parameters']['query']
>['page'] extends infer T
  ? Exclude<T, undefined>
  : never;

type CommentQueryParams = NonNullable<
  paths['/comments']['get']['parameters']['query']
>;
type CommentsResponse =
  paths['/comments']['get']['responses'][200]['content']['application/json'];
type CommentListItem = CommentsResponse['data'][number];
type CreateCommentBody = NonNullable<
  paths['/comments']['post']['requestBody']
>['content']['application/json'];
type UpdateCommentBody = NonNullable<
  paths['/comments/{id}']['put']['requestBody']
>['content']['application/json'];

export const commentApi = api.injectEndpoints({
  endpoints: (build) => ({
    getComments: build.query<CommentListItem[], CommentQueryParams>({
      query: (params) => ({ url: '/comments', params }),
      transformResponse: (response: CommentsResponse) => response.data,
      providesTags: ['Comment']
    }),
    createComment: build.mutation<CommentListItem, CreateCommentBody>({
      query: (data) => ({ url: '/comments', method: 'POST', body: data }),
      invalidatesTags: ['Comment']
    }),
    updateComment: build.mutation<
      CommentListItem,
      { id: number; body: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/comments/${id}`,
        method: 'PUT',
        body: data as UpdateCommentBody
      }),
      invalidatesTags: ['Comment']
    }),
    deleteComment: build.mutation<void, number>({
      query: (id) => ({ url: `/comments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Comment']
    })
  })
});

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation
} = commentApi;
