import { api } from '../api';
import type { components, paths } from '../../types/api';
import type { DncEntry } from './adminApi';

export interface VoteAggregate {
  releaseId: number;
  ups: number;
  total: number;
  score: number;
}

export type MyVote = 'up' | 'down' | null;

export interface VoteResponse {
  myVote: MyVote;
  voteAggregate: VoteAggregate | null;
}

export type ReleaseTag = components['schemas']['ReleaseTagEnriched'];
export type ReleaseHistoryEntry = components['schemas']['ReleaseHistoryEntry'];

interface ReleaseArgs {
  communityId: number;
  releaseId: number;
}

type CommunitiesResponse =
  paths['/communities']['get']['responses'][200]['content']['application/json'];
type CommunityResponse =
  paths['/communities/{id}']['get']['responses'][200]['content']['application/json'];
type CommunityReleasesResponse =
  paths['/communities/{id}/releases']['get']['responses'][200]['content']['application/json'];
export type ReleaseResponse =
  paths['/communities/{communityId}/releases/{releaseId}']['get']['responses'][200]['content']['application/json'];
type ReleaseHistoryResponse =
  paths['/communities/{communityId}/releases/{releaseId}/history']['get']['responses'][200]['content']['application/json'];
type ContributionsResponse =
  paths['/contributions']['get']['responses'][200]['content']['application/json'];
type CreateContributionArgs = NonNullable<
  paths['/contributions']['post']['requestBody']
>['content']['application/json'];
type CreateContributionResponse =
  paths['/contributions']['post']['responses'][201]['content']['application/json'];
type AddContributionToReleaseArgs = ReleaseArgs &
  NonNullable<
    paths['/communities/{communityId}/releases/{releaseId}/contributions']['post']['requestBody']
  >['content']['application/json'];
type AddContributionToReleaseResponse =
  paths['/communities/{communityId}/releases/{releaseId}/contributions']['post']['responses'][201]['content']['application/json'];

export const communityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCommunities: build.query<CommunitiesResponse, number>({
      query: (page = 1) => `/communities?page=${page}`,
      providesTags: ['Community']
    }),
    getCommunityById: build.query<CommunityResponse, number>({
      query: (id) => `/communities/${id}`,
      providesTags: (_, __, id) => [{ type: 'Community', id }]
    }),
    createCommunity: build.mutation<
      CommunityResponse,
      Partial<CommunityResponse>
    >({
      query: (data) => ({ url: '/communities', method: 'POST', body: data }),
      invalidatesTags: ['Community']
    }),
    updateCommunity: build.mutation<
      CommunityResponse,
      {
        id: number;
        name?: string;
        description?: string;
        image?: string;
        registrationStatus?: string;
        allowDuplicateFormats?: boolean;
        staffIds?: number[];
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/communities/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Community', id }]
    }),

    // Releases
    getReleasesByCommunity: build.query<
      CommunityReleasesResponse,
      { communityId: number; page?: number }
    >({
      query: ({ communityId, page = 1 }) =>
        `/communities/${communityId}/releases?page=${page}`,
      providesTags: [{ type: 'Release', id: 'LIST' }]
    }),
    getReleaseById: build.query<ReleaseResponse, ReleaseArgs>({
      query: ({ communityId, releaseId }) =>
        `/communities/${communityId}/releases/${releaseId}`,
      providesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId }
      ]
    }),
    createRelease: build.mutation<
      ReleaseResponse,
      { communityId: number } & Partial<ReleaseResponse>
    >({
      query: ({ communityId, ...data }) => ({
        url: `/communities/${communityId}/releases`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Release', id: 'LIST' }]
    }),
    updateRelease: build.mutation<
      ReleaseResponse,
      ReleaseArgs &
        Partial<
          Pick<
            ReleaseResponse,
            'title' | 'description' | 'image' | 'year' | 'isEdition' | 'edition'
          >
        > & { editSummary?: string }
    >({
      query: ({ communityId, releaseId, ...data }) => ({
        url: `/communities/${communityId}/releases/${releaseId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId }
      ]
    }),
    deleteRelease: build.mutation<void, ReleaseArgs>({
      query: ({ communityId, releaseId }) => ({
        url: `/communities/${communityId}/releases/${releaseId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Release']
    }),

    // Members
    addCommunityMember: build.mutation<
      void,
      { communityId: number; userId: number }
    >({
      query: ({ communityId, userId }) => ({
        url: `/communities/${communityId}/members`,
        method: 'POST',
        body: { userId }
      }),
      invalidatesTags: (_, __, { communityId }) => [
        { type: 'Community', id: communityId }
      ]
    }),
    removeCommunityMember: build.mutation<
      void,
      { communityId: number; userId: number }
    >({
      query: ({ communityId, userId }) => ({
        url: `/communities/${communityId}/members/${userId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { communityId }) => [
        { type: 'Community', id: communityId }
      ]
    }),

    // Staff
    addCommunityStaff: build.mutation<
      void,
      { communityId: number; userId: number }
    >({
      query: ({ communityId, userId }) => ({
        url: `/communities/${communityId}/staff`,
        method: 'POST',
        body: { userId }
      }),
      invalidatesTags: (_, __, { communityId }) => [
        { type: 'Community', id: communityId }
      ]
    }),
    removeCommunityStaff: build.mutation<
      void,
      { communityId: number; userId: number }
    >({
      query: ({ communityId, userId }) => ({
        url: `/communities/${communityId}/staff/${userId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { communityId }) => [
        { type: 'Community', id: communityId }
      ]
    }),

    // Contributions
    getContributions: build.query<ContributionsResponse, void>({
      query: () => '/contributions',
      providesTags: ['Contribution']
    }),
    createContribution: build.mutation<
      CreateContributionResponse,
      CreateContributionArgs
    >({
      query: (data) => ({
        url: '/contributions',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Contribution', 'Release']
    }),
    addContributionToRelease: build.mutation<
      AddContributionToReleaseResponse,
      AddContributionToReleaseArgs
    >({
      query: ({ communityId, releaseId, ...data }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/contributions`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId },
        'Contribution'
      ]
    }),

    // Votes
    voteOnRelease: build.mutation<
      VoteResponse,
      ReleaseArgs & { positive: boolean }
    >({
      query: ({ communityId, releaseId, positive }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/vote`,
        method: 'POST',
        body: { positive }
      }),
      invalidatesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId },
        'Top10'
      ]
    }),
    removeVoteOnRelease: build.mutation<VoteResponse, ReleaseArgs>({
      query: ({ communityId, releaseId }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/vote`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId },
        'Top10'
      ]
    }),

    // Tags
    addTagToRelease: build.mutation<ReleaseTag, ReleaseArgs & { name: string }>(
      {
        query: ({ communityId, releaseId, name }) => ({
          url: `/communities/${communityId}/releases/${releaseId}/tags`,
          method: 'POST',
          body: { name }
        }),
        invalidatesTags: (_, __, { releaseId }) => [
          { type: 'Release', id: releaseId },
          'Top10'
        ]
      }
    ),
    voteOnReleaseTag: build.mutation<
      ReleaseTag,
      ReleaseArgs & { tagId: number; direction: 'up' | 'down' }
    >({
      query: ({ communityId, releaseId, tagId, direction }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/tags/${tagId}/vote`,
        method: 'POST',
        body: { direction }
      }),
      invalidatesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId },
        'Top10'
      ]
    }),
    removeTagFromRelease: build.mutation<void, ReleaseArgs & { tagId: number }>(
      {
        query: ({ communityId, releaseId, tagId }) => ({
          url: `/communities/${communityId}/releases/${releaseId}/tags/${tagId}`,
          method: 'DELETE'
        }),
        invalidatesTags: (_, __, { releaseId }) => [
          { type: 'Release', id: releaseId },
          'Top10'
        ]
      }
    ),

    getReleaseHistory: build.query<
      ReleaseHistoryResponse,
      ReleaseArgs & { page?: number }
    >({
      query: ({ communityId, releaseId, page = 1 }) =>
        `/communities/${communityId}/releases/${releaseId}/history?page=${page}`,
      providesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId }
      ]
    }),

    revertReleaseHistory: build.mutation<
      ReleaseResponse,
      ReleaseArgs & { historyId: number }
    >({
      query: ({ communityId, releaseId, historyId }) => ({
        url: `/communities/${communityId}/releases/${releaseId}/history/${historyId}/revert`,
        method: 'POST'
      }),
      invalidatesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId }
      ]
    }),

    // DNC (Do Not Contribute) — readable by all authenticated users
    getDncList: build.query<DncEntry[], number>({
      query: (communityId) => `/communities/${communityId}/dnc`,
      providesTags: ['Dnc']
    })
  })
});

export const {
  useGetCommunitiesQuery,
  useGetCommunityByIdQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation,
  useAddCommunityMemberMutation,
  useRemoveCommunityMemberMutation,
  useAddCommunityStaffMutation,
  useRemoveCommunityStaffMutation,
  useGetReleasesByCommunityQuery,
  useGetReleaseByIdQuery,
  useCreateReleaseMutation,
  useUpdateReleaseMutation,
  useDeleteReleaseMutation,
  useGetContributionsQuery,
  useCreateContributionMutation,
  useAddContributionToReleaseMutation,
  useVoteOnReleaseMutation,
  useRemoveVoteOnReleaseMutation,
  useAddTagToReleaseMutation,
  useVoteOnReleaseTagMutation,
  useRemoveTagFromReleaseMutation,
  useGetReleaseHistoryQuery,
  useRevertReleaseHistoryMutation,
  useGetDncListQuery
} = communityApi;
