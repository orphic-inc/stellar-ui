import { api } from '../api';
import type { paths } from '../../types/api';

export type SearchTagsParams = NonNullable<
  paths['/tags']['get']['parameters']['query']
>;
export type TagSearchResponse =
  paths['/tags']['get']['responses'][200]['content']['application/json'];
export type OfficialTags =
  paths['/tags/official']['get']['responses'][200]['content']['application/json'];

export const tagApi = api.injectEndpoints({
  endpoints: (build) => ({
    // The api normalizes `q` and lists official tags first (#689), so the
    // browser neither folds the query nor ranks the results.
    searchTags: build.query<TagSearchResponse, SearchTagsParams>({
      query: (params) => ({ url: '/tags', params })
    }),
    // The curated vocabulary (stellar-api#298, ADR-0045): the whole set,
    // name-sorted and unpaginated. Staff promote and demote invalidate it.
    getOfficialTags: build.query<OfficialTags, void>({
      query: () => '/tags/official',
      providesTags: ['OfficialTags']
    })
  })
});

export const { useSearchTagsQuery, useGetOfficialTagsQuery } = tagApi;
