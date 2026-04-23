import { api } from '../api';
import type { paths } from '../../types/api';
import type { Contribution, PaginatedResponse } from '../../types';

interface ReleaseArgs {
  communityId: number;
  releaseId: number;
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

type CommunitiesResponse =
  paths['/communities']['get']['responses'][200]['content']['application/json'];
type CommunityResponse =
  paths['/communities/{id}']['get']['responses'][200]['content']['application/json'];
type CommunityReleasesResponse =
  paths['/communities/{id}/releases']['get']['responses'][200]['content']['application/json'];
type ReleaseResponse =
  paths['/communities/{communityId}/releases/{releaseId}']['get']['responses'][200]['content']['application/json'];

export const communityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCommunities: build.query<CommunitiesResponse, void>({
      query: () => '/communities',
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
      { id: number } & Partial<CommunityResponse>
    >({
      query: ({ id, ...data }) => ({
        url: `/communities/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Community', id }]
    }),

    // Releases
    getReleasesByCommunity: build.query<CommunityReleasesResponse, number>({
      query: (communityId) => `/communities/${communityId}/releases`,
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
      ReleaseArgs & Partial<ReleaseResponse>
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

    // Contributions
    getContributions: build.query<PaginatedResponse<Contribution>, void>({
      query: () => '/contributions',
      providesTags: ['Contribution']
    }),
    createContribution: build.mutation<ReleaseResponse, CreateContributionArgs>(
      {
        query: (data) => ({
          url: '/contributions',
          method: 'POST',
          body: data
        }),
        invalidatesTags: ['Contribution', 'Release']
      }
    )
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
