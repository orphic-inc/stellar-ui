import { api } from '../api';
import type { paths } from '../../types/api';

type HomepageFeaturedResponse =
  paths['/home/featured']['get']['responses'][200]['content']['application/json'];

export const homeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHomepageFeatured: build.query<HomepageFeaturedResponse, void>({
      query: () => '/home/featured'
    })
  })
});

export const { useGetHomepageFeaturedQuery } = homeApi;
