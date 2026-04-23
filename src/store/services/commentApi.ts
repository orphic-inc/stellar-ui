import { api } from '../api';

interface CommentParams {
  page?: string;
  pageId?: number;
}

interface CommentBody {
  page: string;
  body: string;
  communityId?: number;
  contributionId?: number;
  artistId?: number;
  releaseId?: number;
}

export const commentApi = api.injectEndpoints({
  endpoints: (build) => ({
    getComments: build.query<
      {
        id: number;
        body: string;
        authorId: number;
        author?: { id: number; username: string; avatar?: string };
        createdAt: string;
      }[],
      CommentParams
    >({
      query: (params) => ({ url: '/comments', params }),
      providesTags: ['Comment']
    }),
    createComment: build.mutation<{ id: number }, CommentBody>({
      query: (data) => ({ url: '/comments', method: 'POST', body: data }),
      invalidatesTags: ['Comment']
    }),
    updateComment: build.mutation<void, { id: number; body: string }>({
      query: ({ id, ...data }) => ({
        url: `/comments/${id}`,
        method: 'PUT',
        body: data
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
