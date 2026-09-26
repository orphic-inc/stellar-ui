import { api } from '../api';
import type { AuthUser } from '../../types';
import type { components, paths } from '../../types/api';

export type NotificationFilter = components['schemas']['NotificationFilter'];
export type NotificationFilterHit =
  components['schemas']['NotificationFilterHitItem'];
export type NotificationFilterInput = NonNullable<
  paths['/notification-filters']['post']['requestBody']
>['content']['application/json'];

type FiltersResponse =
  paths['/notification-filters']['get']['responses'][200]['content']['application/json'];
type HitsResponse =
  paths['/notification-filters/hits']['get']['responses'][200]['content']['application/json'];
type UnreadCountResponse =
  paths['/notification-filters/hits/unread-count']['get']['responses'][200]['content']['application/json'];

/** Scopes a hit action to one filter; omitted, it spans every filter. */
type FilterScope = { filterId?: number };

/**
 * Whether the member's rank allows notification filters (#370). The session
 * carries the primary rank's `notificationFilterLimit` (stellar-api#715):
 * `null` is unlimited and `0` is none, which the api answers with a 403. So
 * the entry points hide at `0` rather than probing.
 */
export const hasNotificationFilters = (user: AuthUser | null | undefined) =>
  user != null && user.userRank.notificationFilterLimit !== 0;

export const notificationFilterApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotificationFilters: build.query<FiltersResponse, void>({
      query: () => '/notification-filters',
      providesTags: ['NotificationFilter']
    }),

    createNotificationFilter: build.mutation<
      NotificationFilter,
      NotificationFilterInput
    >({
      query: (body) => ({ url: '/notification-filters', method: 'POST', body }),
      invalidatesTags: ['NotificationFilter']
    }),

    // Hits name their filters by label, so an edit refreshes them too.
    updateNotificationFilter: build.mutation<
      NotificationFilter,
      NotificationFilterInput & { id: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/notification-filters/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['NotificationFilter', 'NotificationFilterHit']
    }),

    // A filter's hits are deleted with it.
    deleteNotificationFilter: build.mutation<void, number>({
      query: (id) => ({ url: `/notification-filters/${id}`, method: 'DELETE' }),
      invalidatesTags: ['NotificationFilter', 'NotificationFilterHit']
    }),

    getNotificationFilterHits: build.query<
      HitsResponse,
      FilterScope & { page: number }
    >({
      query: ({ page, filterId }) => ({
        url: '/notification-filters/hits',
        params: { page, ...(filterId ? { filterId } : {}) }
      }),
      providesTags: ['NotificationFilterHit']
    }),

    getNotificationFilterHitUnreadCount: build.query<UnreadCountResponse, void>(
      {
        query: () => '/notification-filters/hits/unread-count',
        providesTags: ['NotificationFilterHit']
      }
    ),

    markNotificationFilterHitRead: build.mutation<
      void,
      FilterScope & { contributionId: number }
    >({
      query: (body) => ({
        url: '/notification-filters/hits/read',
        method: 'POST',
        body
      }),
      invalidatesTags: ['NotificationFilterHit']
    }),

    catchUpNotificationFilterHits: build.mutation<void, FilterScope>({
      query: (body) => ({
        url: '/notification-filters/hits/catchup',
        method: 'POST',
        body
      }),
      invalidatesTags: ['NotificationFilterHit']
    }),

    // Removes READ hits only; unread matches survive.
    clearReadNotificationFilterHits: build.mutation<void, FilterScope>({
      query: ({ filterId }) => ({
        url: '/notification-filters/hits',
        method: 'DELETE',
        params: filterId ? { filterId } : undefined
      }),
      invalidatesTags: ['NotificationFilterHit']
    }),

    removeNotificationFilterHit: build.mutation<
      void,
      FilterScope & { contributionId: number }
    >({
      query: ({ contributionId, filterId }) => ({
        url: `/notification-filters/hits/${contributionId}`,
        method: 'DELETE',
        params: filterId ? { filterId } : undefined
      }),
      invalidatesTags: ['NotificationFilterHit']
    })
  })
});

export const {
  useGetNotificationFiltersQuery,
  useCreateNotificationFilterMutation,
  useUpdateNotificationFilterMutation,
  useDeleteNotificationFilterMutation,
  useGetNotificationFilterHitsQuery,
  useGetNotificationFilterHitUnreadCountQuery,
  useMarkNotificationFilterHitReadMutation,
  useCatchUpNotificationFilterHitsMutation,
  useClearReadNotificationFilterHitsMutation,
  useRemoveNotificationFilterHitMutation
} = notificationFilterApi;
