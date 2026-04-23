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
      invalidatesTags: ['Subscription']
    })
  })
});

export const {
  useGetSubscriptionsQuery,
  useSubscribeMutation,
  useSubscribeCommentsMutation
} = subscriptionApi;
