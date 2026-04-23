import { api } from '../api';

export type CommentPage =
  | 'communities'
  | 'artist'
  | 'collages'
  | 'requests'
  | 'release';

type CommentQueryParams = {
  page?: CommentPage;
  pageId?: number;
};

type CommunityCommentBody = {
  page: 'communities';
  body: string;
  communityId: number;
};

type ArtistCommentBody = {
  page: 'artist';
  body: string;
  artistId: number;
};

type ContributionCommentBody = {
  page: 'collages' | 'requests';
  body: string;
  contributionId: number;
};

type ReleaseCommentBody = {
  page: 'release';
  body: string;
  releaseId: number;
};

type CommentBody =
  | CommunityCommentBody
  | ArtistCommentBody
  | ContributionCommentBody
  | ReleaseCommentBody;

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
      CommentQueryParams
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
