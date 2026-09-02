import { api } from '../api';
import type { paths } from '../../types/api';

export type CommentPage = NonNullable<
  paths['/comments']['get']['parameters']['query']
>['context'] extends infer T
  ? Exclude<T, undefined>
  : never;
type CommentQueryParams = NonNullable<
  paths['/comments']['get']['parameters']['query']
>;
type CommentsResponse =
  paths['/comments']['get']['responses'][200]['content']['application/json'];
// Three shapes, not one: the list includes author + editedUser, the create echo
// includes author only, and the update echo includes neither (stellar-api#495).
// Derived straight off `paths[...]` rather than through CommentsResponse: the
// service-types scanner resolves local aliases one level, so a chained alias
// reads as hand-written even when it is not.
type CommentListItem =
  paths['/comments']['get']['responses'][200]['content']['application/json']['data'][number];
type CreatedComment =
  paths['/comments']['post']['responses'][201]['content']['application/json'];
type UpdatedComment =
  paths['/comments/{id}']['put']['responses'][200]['content']['application/json'];
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
    createComment: build.mutation<CreatedComment, CreateCommentBody>({
      query: (data) => ({ url: '/comments', method: 'POST', body: data }),
      invalidatesTags: ['Comment']
    }),
    updateComment: build.mutation<UpdatedComment, { id: number; body: string }>(
      {
        query: ({ id, ...data }) => ({
          url: `/comments/${id}`,
          method: 'PUT',
          body: data as UpdateCommentBody
        }),
        invalidatesTags: ['Comment']
      }
    ),
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
