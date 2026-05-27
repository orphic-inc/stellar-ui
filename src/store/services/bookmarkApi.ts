import { api } from '../api';
import type { paths } from '../../types/api';

export type BookmarkToggleResponse =
  paths['/bookmarks/artists/{artistId}']['post']['responses'][200]['content']['application/json'];

export type ArtistBookmark =
  paths['/bookmarks/artists']['get']['responses'][200]['content']['application/json'][number];
export type ReleaseBookmark =
  paths['/bookmarks/releases']['get']['responses'][200]['content']['application/json'][number];
export type CommunityBookmark =
  paths['/bookmarks/communities']['get']['responses'][200]['content']['application/json'][number];
export type RequestBookmark =
  paths['/bookmarks/requests']['get']['responses'][200]['content']['application/json'][number];

export const bookmarkApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Artists
    toggleArtistBookmark: build.mutation<BookmarkToggleResponse, number>({
      query: (artistId) => ({
        url: `/bookmarks/artists/${artistId}`,
        method: 'POST'
      }),
      invalidatesTags: [{ type: 'Bookmark', id: 'ARTISTS' }]
    }),
    removeArtistBookmark: build.mutation<void, number>({
      query: (artistId) => ({
        url: `/bookmarks/artists/${artistId}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Bookmark', id: 'ARTISTS' }]
    }),
    getArtistBookmarks: build.query<ArtistBookmark[], void>({
      query: () => '/bookmarks/artists',
      providesTags: [{ type: 'Bookmark', id: 'ARTISTS' }]
    }),

    // Releases
    toggleReleaseBookmark: build.mutation<BookmarkToggleResponse, number>({
      query: (releaseId) => ({
        url: `/bookmarks/releases/${releaseId}`,
        method: 'POST'
      }),
      invalidatesTags: [{ type: 'Bookmark', id: 'RELEASES' }]
    }),
    getReleaseBookmarks: build.query<ReleaseBookmark[], void>({
      query: () => '/bookmarks/releases',
      providesTags: [{ type: 'Bookmark', id: 'RELEASES' }]
    }),

    // Communities
    toggleCommunityBookmark: build.mutation<BookmarkToggleResponse, number>({
      query: (communityId) => ({
        url: `/bookmarks/communities/${communityId}`,
        method: 'POST'
      }),
      invalidatesTags: [{ type: 'Bookmark', id: 'COMMUNITIES' }]
    }),
    getCommunityBookmarks: build.query<CommunityBookmark[], void>({
      query: () => '/bookmarks/communities',
      providesTags: [{ type: 'Bookmark', id: 'COMMUNITIES' }]
    }),

    // Requests
    toggleRequestBookmark: build.mutation<BookmarkToggleResponse, number>({
      query: (requestId) => ({
        url: `/bookmarks/requests/${requestId}`,
        method: 'POST'
      }),
      invalidatesTags: [{ type: 'Bookmark', id: 'REQUESTS' }]
    }),
    getRequestBookmarks: build.query<RequestBookmark[], void>({
      query: () => '/bookmarks/requests',
      providesTags: [{ type: 'Bookmark', id: 'REQUESTS' }]
    })
  })
});

export const {
  useToggleArtistBookmarkMutation,
  useRemoveArtistBookmarkMutation,
  useGetArtistBookmarksQuery,
  useToggleReleaseBookmarkMutation,
  useGetReleaseBookmarksQuery,
  useToggleCommunityBookmarkMutation,
  useGetCommunityBookmarksQuery,
  useToggleRequestBookmarkMutation,
  useGetRequestBookmarksQuery
} = bookmarkApi;
