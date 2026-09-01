import { api } from '../api';
import type { components, paths } from '../../types/api';

// ui#277 — every result type below is derived from the vendored contract rather
// than hand-written. The wiki router projects THREE page shapes and the
// contract now names all three (stellar-api #487):
//
//   WikiPageSummary   PAGE_SELECT           the list rows; carries no `body`
//   WikiPage          + body                what create/update/rollback echo
//   WikiPageRendered  + bodyHtml            the two direct page reads
//
// `bodyHtml` is the server-rendered, sanitized transcription of the raw BBCode
// `body` (#398). The API is the single source of transcription; the UI renders
// this and no longer parses `body` itself. `body` is retained for the edit form,
// which is why the reads return the rendered shape and the writes do not.
export type WikiPage = components['schemas']['WikiPageSummary'];
export type WikiPageWithBody = components['schemas']['WikiPageRendered'];
export type WikiRevisionSummary = components['schemas']['WikiRevisionSummary'];
export type WikiRevisionContent = components['schemas']['WikiRevisionContent'];

type WikiListResponse =
  paths['/wiki']['get']['responses'][200]['content']['application/json'];
type WikiPageResponse =
  paths['/wiki/{id}']['get']['responses'][200]['content']['application/json'];
type WikiPageByAliasResponse =
  paths['/wiki/by-alias/{alias}']['get']['responses'][200]['content']['application/json'];
type WikiRevisionsResponse =
  paths['/wiki/{id}/revisions']['get']['responses'][200]['content']['application/json'];
type WikiRevisionResponse =
  paths['/wiki/{id}/revisions/{rev}']['get']['responses'][200]['content']['application/json'];
type WikiCompareResponse =
  paths['/wiki/{id}/compare']['get']['responses'][200]['content']['application/json'];
// The write echoes: PAGE_WITH_BODY_SELECT returned directly, so no `bodyHtml`.
type CreateWikiPageResponse =
  paths['/wiki']['post']['responses'][201]['content']['application/json'];
type UpdateWikiPageResponse =
  paths['/wiki/{id}']['put']['responses'][200]['content']['application/json'];
type RollbackWikiPageResponse =
  paths['/wiki/{id}/rollback/{rev}']['post']['responses'][200]['content']['application/json'];

export type WikiSearchParams = NonNullable<
  paths['/wiki']['get']['parameters']['query']
>;

export type CreateWikiPageArgs = NonNullable<
  paths['/wiki']['post']['requestBody']
>['content']['application/json'];
type UpdateWikiPageBody = NonNullable<
  paths['/wiki/{id}']['put']['requestBody']
>['content']['application/json'];
export type UpdateWikiPageArgs = UpdateWikiPageBody & { id: number };

export const wikiApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWikiPages: build.query<WikiListResponse, WikiSearchParams>({
      query: (params) => ({ url: '/wiki', params }),
      providesTags: ['WikiPage']
    }),

    getWikiPage: build.query<WikiPageResponse, number>({
      query: (id) => `/wiki/${id}`,
      providesTags: (_, __, id) => [{ type: 'WikiPage', id }]
    }),

    getWikiPageByAlias: build.query<WikiPageByAliasResponse, string>({
      query: (alias) => `/wiki/by-alias/${encodeURIComponent(alias)}`,
      providesTags: (result) =>
        result ? [{ type: 'WikiPage', id: result.id }] : ['WikiPage']
    }),

    getWikiRevisions: build.query<WikiRevisionsResponse, number>({
      query: (id) => `/wiki/${id}/revisions`,
      providesTags: (_, __, id) => [{ type: 'WikiPage', id }]
    }),

    getWikiRevision: build.query<
      WikiRevisionResponse,
      { id: number; rev: number }
    >({
      query: ({ id, rev }) => `/wiki/${id}/revisions/${rev}`
    }),

    createWikiPage: build.mutation<CreateWikiPageResponse, CreateWikiPageArgs>({
      query: (body) => ({ url: '/wiki', method: 'POST', body }),
      invalidatesTags: ['WikiPage']
    }),

    updateWikiPage: build.mutation<UpdateWikiPageResponse, UpdateWikiPageArgs>({
      query: ({ id, ...body }) => ({ url: `/wiki/${id}`, method: 'PUT', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'WikiPage', id }, 'WikiPage']
    }),

    deleteWikiPage: build.mutation<void, number>({
      query: (id) => ({ url: `/wiki/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WikiPage']
    }),

    addWikiAlias: build.mutation<
      { alias: string },
      { id: number; alias: string }
    >({
      query: ({ id, alias }) => ({
        url: `/wiki/${id}/aliases`,
        method: 'POST',
        body: { alias }
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'WikiPage', id }]
    }),

    deleteWikiAlias: build.mutation<void, { id: number; alias: string }>({
      query: ({ id, alias }) => ({
        url: `/wiki/${id}/aliases/${encodeURIComponent(alias)}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'WikiPage', id }]
    }),

    rollbackWikiPage: build.mutation<
      RollbackWikiPageResponse,
      { id: number; rev: number }
    >({
      query: ({ id, rev }) => ({
        url: `/wiki/${id}/rollback/${rev}`,
        method: 'POST'
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'WikiPage', id }, 'WikiPage']
    }),

    compareWikiRevisions: build.query<
      WikiCompareResponse,
      { id: number; old: number; new: number }
    >({
      query: ({ id, old: o, new: n }) => `/wiki/${id}/compare?old=${o}&new=${n}`
    })
  })
});

export const {
  useGetWikiPagesQuery,
  useGetWikiPageQuery,
  useGetWikiPageByAliasQuery,
  useGetWikiRevisionsQuery,
  useGetWikiRevisionQuery,
  useCreateWikiPageMutation,
  useUpdateWikiPageMutation,
  useDeleteWikiPageMutation,
  useAddWikiAliasMutation,
  useDeleteWikiAliasMutation,
  useRollbackWikiPageMutation,
  useCompareWikiRevisionsQuery
} = wikiApi;
