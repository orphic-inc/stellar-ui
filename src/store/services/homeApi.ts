import { api } from '../api';
import type { HomepageFeaturedContent } from '../../types';

export const homeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHomepageFeatured: build.query<HomepageFeaturedContent, void>({
      query: () => '/home/featured'
    })
  })
});

export const { useGetHomepageFeaturedQuery } = homeApi;
