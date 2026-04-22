import { api } from '../api';
import type { Community, Release, PaginatedResponse } from '../../types';

interface ReleaseArgs {
  communityId: number;
  groupId: number;
}
interface CreateContributionArgs {
  communityId: number;
  type: string;
  title: string;
  tags?: string;
  image?: string;
  description?: string;
  releaseDescription?: string;
  collaborators?: { artist: string; importance: string }[];
  contributors?: number[];
}

export const communityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCommunities: build.query<PaginatedResponse<Community>, void>({
      query: () => '/communities',
      providesTags: ['Community']
    }),
    getCommunityById: build.query<Community, number>({
      query: (id) => `/communities/${id}`,
      providesTags: (_, __, id) => [{ type: 'Community', id }]
    }),
    createCommunity: build.mutation<Community, Partial<Community>>({
      query: (data) => ({ url: '/communities', method: 'POST', body: data }),
      invalidatesTags: ['Community']
    }),
    updateCommunity: build.mutation<
      Community,
      { id: number } & Partial<Community>
    >({
      query: ({ id, ...data }) => ({
        url: `/communities/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Community', id }]
    }),

    // Releases (groups)
    getReleasesByCommunity: build.query<PaginatedResponse<Release>, number>({
      query: (communityId) => `/communities/${communityId}/groups`,
      providesTags: (_, __, id) => [{ type: 'Release', id }]
    }),
    getReleaseById: build.query<Release, ReleaseArgs>({
      query: ({ communityId, groupId }) =>
        `/communities/${communityId}/groups/${groupId}`,
      providesTags: (_, __, { groupId }) => [{ type: 'Release', id: groupId }]
    }),
    createRelease: build.mutation<
      Release,
      { communityId: number } & Partial<Release>
    >({
      query: ({ communityId, ...data }) => ({
        url: `/communities/${communityId}/groups`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_, __, { communityId }) => [
        { type: 'Release', id: communityId }
      ]
    }),
    updateRelease: build.mutation<Release, ReleaseArgs & Partial<Release>>({
      query: ({ communityId, groupId, ...data }) => ({
        url: `/communities/${communityId}/groups/${groupId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { groupId }) => [
        { type: 'Release', id: groupId }
      ]
    }),
    deleteRelease: build.mutation<void, ReleaseArgs>({
      query: ({ communityId, groupId }) => ({
        url: `/communities/${communityId}/groups/${groupId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Release']
    }),

    // Contributions
    getContributions: build.query<PaginatedResponse<Release>, void>({
      query: () => '/contributions',
      providesTags: ['Contribution']
    }),
    createContribution: build.mutation<Release, CreateContributionArgs>({
      query: (data) => ({ url: '/contributions', method: 'POST', body: data }),
      invalidatesTags: ['Contribution', 'Release']
    })
  })
});

export const {
  useGetCommunitiesQuery,
  useGetCommunityByIdQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation,
  useGetReleasesByCommunityQuery,
  useGetReleaseByIdQuery,
  useCreateReleaseMutation,
  useUpdateReleaseMutation,
  useDeleteReleaseMutation,
  useGetContributionsQuery,
  useCreateContributionMutation
} = communityApi;
