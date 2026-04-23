import { api } from '../api';
import type {
  Community,
  Release,
  Contribution,
  PaginatedResponse
} from '../../types';

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

    // Releases
    getReleasesByCommunity: build.query<PaginatedResponse<Release>, number>({
      query: (communityId) => `/communities/${communityId}/releases`,
      providesTags: [{ type: 'Release', id: 'LIST' }]
    }),
    getReleaseById: build.query<Release, ReleaseArgs>({
      query: ({ communityId, releaseId }) =>
        `/communities/${communityId}/releases/${releaseId}`,
      providesTags: (_, __, { releaseId }) => [
        { type: 'Release', id: releaseId }
      ]
    }),
    createRelease: build.mutation<
      Release,
      { communityId: number } & Partial<Release>
    >({
      query: ({ communityId, ...data }) => ({
        url: `/communities/${communityId}/releases`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Release', id: 'LIST' }]
    }),
    updateRelease: build.mutation<Release, ReleaseArgs & Partial<Release>>({
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
