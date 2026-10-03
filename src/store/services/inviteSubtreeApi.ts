import { api } from '../api';
import type { paths } from '../../types/api';

// Staff actions on a member's whole invite subtree (stellar-api#639, ADR-0056).
// Kept apart from userApi, whose endpoints block is already over the size limit.

export type InviteSubtreePreview =
  paths['/users/{id}/invite-subtree/preview']['get']['responses'][200]['content']['application/json'];
type ApplyBody = NonNullable<
  paths['/users/{id}/invite-subtree/action']['post']['requestBody']
>['content']['application/json'];
export type InviteSubtreeAction = ApplyBody['action'];
type ApplyResponse =
  paths['/users/{id}/invite-subtree/action']['post']['responses'][200]['content']['application/json'];

export const inviteSubtreeApi = api.injectEndpoints({
  endpoints: (build) => ({
    // `keepUnusedDataFor: 0`: a preview is a snapshot staff confirm against, so
    // a stale one should never be served from the cache.
    previewInviteSubtree: build.query<InviteSubtreePreview, number>({
      query: (id) => `/users/${id}/invite-subtree/preview`,
      keepUnusedDataFor: 0
    }),
    // General tags, not per-id ones: a run changes many members, and every
    // list that shows them provides the general tag (stellar-ui#481).
    applyInviteSubtreeAction: build.mutation<
      ApplyResponse,
      { id: number } & ApplyBody
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/invite-subtree/action`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['InviteTree', 'User', 'Profile']
    })
  })
});

export const {
  useLazyPreviewInviteSubtreeQuery,
  useApplyInviteSubtreeActionMutation
} = inviteSubtreeApi;
