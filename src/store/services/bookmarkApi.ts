import { api } from '../api';

export interface BookmarkToggleResponse {
  bookmarked: boolean;
}

export interface ArtistBookmark {
  artistId: number;
  artist: { id: number; name: string };
  createdAt: string;
}

export interface ReleaseBookmark {
  releaseId: number;
  release: { id: number; title: string; communityId: number | null };
  createdAt: string;
}

export interface CommunityBookmark {
  communityId: number;
  community: { id: number; name: string };
  createdAt: string;
}

export interface RequestBookmark {
  requestId: number;
  request: { id: number; title: string };
  createdAt: string;
}

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
