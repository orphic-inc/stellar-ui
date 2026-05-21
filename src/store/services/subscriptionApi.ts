import { api } from '../api';
import type { paths } from '../../types/api';

type SubscriptionsResponse =
  paths['/subscriptions']['get']['responses'][200]['content']['application/json'];
type SubscribeArgs = NonNullable<
  paths['/subscriptions/subscribe']['post']['requestBody']
>['content']['application/json'];
type SubscribeCommentsArgs = NonNullable<
  paths['/subscriptions/subscribe-comments']['post']['requestBody']
>['content']['application/json'];
type CommentStatusArgs =
  paths['/subscriptions/comment-status']['get']['parameters']['query'];
type CommentStatusResponse =
  paths['/subscriptions/comment-status']['get']['responses'][200]['content']['application/json'];

export const subscriptionApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSubscriptions: build.query<SubscriptionsResponse, void>({
      query: () => '/subscriptions',
      providesTags: ['Subscription']
    }),
    subscribe: build.mutation<void, SubscribeArgs>({
      query: (data) => ({
        url: '/subscriptions/subscribe',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),
    subscribeComments: build.mutation<void, SubscribeCommentsArgs>({
      query: (data) => ({
        url: '/subscriptions/subscribe-comments',
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_result, _err, { page, pageId }) => [
        'Subscription',
        { type: 'Subscription', id: `comment-${page}-${pageId}` }
      ]
    }),
    getCommentSubscription: build.query<
      CommentStatusResponse,
      CommentStatusArgs
    >({
      query: ({ page, pageId }) =>
        `/subscriptions/comment-status?page=${page}&pageId=${pageId}`,
      providesTags: (_result, _err, { page, pageId }) => [
        { type: 'Subscription', id: `comment-${page}-${pageId}` }
      ]
    }),
    getArtistSubscription: build.query<{ subscribed: boolean }, number>({
      query: (artistId) => `/artists/${artistId}/subscribe`,
      providesTags: (_result, _err, artistId) => [
        { type: 'ArtistSubscription', id: artistId }
      ]
    }),
    subscribeArtist: build.mutation<{ subscribed: boolean }, number>({
      query: (artistId) => ({
        url: `/artists/${artistId}/subscribe`,
        method: 'POST'
      }),
      invalidatesTags: (_result, _err, artistId) => [
        { type: 'ArtistSubscription', id: artistId },
        { type: 'Artist', id: artistId }
      ]
    }),
    unsubscribeArtist: build.mutation<{ subscribed: boolean }, number>({
      query: (artistId) => ({
        url: `/artists/${artistId}/subscribe`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _err, artistId) => [
        { type: 'ArtistSubscription', id: artistId },
        { type: 'Artist', id: artistId }
      ]
    })
  })
});

export const {
  useGetSubscriptionsQuery,
  useSubscribeMutation,
  useSubscribeCommentsMutation,
  useGetCommentSubscriptionQuery,
  useGetArtistSubscriptionQuery,
  useSubscribeArtistMutation,
  useUnsubscribeArtistMutation
} = subscriptionApi;
