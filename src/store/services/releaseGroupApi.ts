import { api } from '../api';
import type { paths } from '../../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The group plus **the member releases this viewer may see** — which is not
 * every member. A release in a community the viewer has no access to is absent
 * by design: a release's identity is private to its community
 * (stellar-api ADR-0036), and `resolveGroupForViewer` is the single access
 * boundary for walking a group edge (ADR-0037). There is no staff bypass.
 *
 * Two consequences for anything rendering this:
 *
 *  - The member list can be **shorter than the album really is**, and can
 *    differ between two viewers on the same page. That is correct, not a gap.
 *  - The endpoint answers **404** for a group with no viewer-visible member,
 *    with the same status and message as a group id that does not exist —
 *    deliberately indistinguishable, so it cannot probe for private catalogues.
 */
export type ReleaseGroupDetail =
  paths['/release-groups/{id}']['get']['responses'][200]['content']['application/json'];
export type ReleaseGroupMember = ReleaseGroupDetail['releases'][number];

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const releaseGroupApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReleaseGroup: build.query<ReleaseGroupDetail, number>({
      query: (id) => `/release-groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ReleaseGroup' as const, id }]
    })
  })
});

export const { useGetReleaseGroupQuery } = releaseGroupApi;
