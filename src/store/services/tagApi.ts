import { api } from '../api';
import type { paths } from '../../types/api';

export type SearchTagsParams = NonNullable<
  paths['/tags']['get']['parameters']['query']
>;
export type TagSearchResponse =
  paths['/tags']['get']['responses'][200]['content']['application/json'];

export const tagApi = api.injectEndpoints({
  endpoints: (build) => ({
    // The api normalizes `q` and lists official tags first (#689), so the
    // browser neither folds the query nor ranks the results.
    searchTags: build.query<TagSearchResponse, SearchTagsParams>({
      query: (params) => ({ url: '/tags', params })
    })
  })
});

export const { useSearchTagsQuery } = tagApi;
