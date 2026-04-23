import { api } from '../api';

interface SubscribeArgs {
  topicId: number;
  action: 'subscribe' | 'unsubscribe';
}

interface SubscribeCommentsArgs {
  page: string;
  pageId: number;
  action: 'subscribe' | 'unsubscribe';
}

export const subscriptionApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSubscriptions: build.query<{ id: number; topicId: number }[], void>({
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
