import { api } from '../api';
import type { paths, components } from '../../types/api';

// The member's own Member Feed URLs (stellar-api#262). A discriminated union on
// `enabled`: a site running without STELLAR_FEED_SECRET answers
// `{ enabled: false }` and serves no feeds at all.
export type MemberFeeds = components['schemas']['MemberFeeds'];

// The contributions feed's optional filters, read off the contract rather than
// restated here, so a format or bitrate added upstream arrives with api:sync.
type ContributionsFeedQuery = NonNullable<
  paths['/feeds/contributions.xml']['get']['parameters']['query']
>;
export type FeedFormat = NonNullable<ContributionsFeedQuery['format']>;
export type FeedBitrate = NonNullable<ContributionsFeedQuery['bitrate']>;

export const feedApi = api.injectEndpoints({
  endpoints: (build) => ({
    // `keepUnusedDataFor: 0`: these URLs carry a bearer token, so they leave the
    // store as soon as the tab unmounts rather than lingering for the default
    // 60 seconds. The api answers `Cache-Control: no-store` for the same reason.
    getMemberFeeds: build.query<MemberFeeds, void>({
      query: () => '/profile/me/feeds',
      keepUnusedDataFor: 0,
      providesTags: ['MemberFeeds']
    }),
    // Writes its own response into the feeds cache rather than invalidating it:
    // rotation answers the new URLs, so a refetch would be a second request for
    // something already in hand, and would briefly leave two answers in play.
    rotateMyFeedToken: build.mutation<MemberFeeds, void>({
      query: () => ({
        url: '/profile/me/feed-token/rotate',
        method: 'POST'
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          feedApi.util.updateQueryData('getMemberFeeds', undefined, () => data)
        );
      }
    })
  })
});

export const { useGetMemberFeedsQuery, useRotateMyFeedTokenMutation } = feedApi;
