import { api } from '../api';

export interface WikiAlias {
  alias: string;
  userId: number;
  createdAt: string;
}

export interface WikiAuthor {
  id: number;
  username: string;
}

export interface WikiPage {
  id: number;
  title: string;
  slug: string;
  revision: number;
  minReadLevel: number;
  minEditLevel: number;
  authorId: number;
  author: WikiAuthor;
  createdAt: string;
  updatedAt: string;
  aliases: WikiAlias[];
}

export interface WikiPageWithBody extends WikiPage {
  body: string;
  // Server-rendered, sanitized HTML transcription of the raw BBCode `body`
  // (#398). The API is the single source of transcription; the UI renders this
  // and no longer parses `body` itself. `body` is retained for the edit form.
  bodyHtml: string;
}

export interface WikiRevisionSummary {
  id: number;
  revision: number;
  title: string;
  authorId: number;
  author: WikiAuthor;
  createdAt: string;
}

export interface WikiRevisionContent {
  revision: number;
  title: string;
  body: string;
  authorId: number;
  author: WikiAuthor;
  createdAt: string;
}

export interface WikiListResponse {
  data: WikiPage[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface WikiRevisionsResponse {
  currentRevision: number;
  revisions: WikiRevisionSummary[];
}

export interface WikiSearchParams {
  q?: string;
  type?: 'title' | 'body' | 'all';
  order?: 'title' | 'created' | 'edited';
  way?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface WikiCompareResponse {
  pageId: number;
  title: string;
  old: { revision: number; body: string };
  new: { revision: number; body: string };
}

export interface CreateWikiPageArgs {
  title: string;
  body: string;
  slug?: string;
  minReadLevel?: number;
  minEditLevel?: number;
}

export interface UpdateWikiPageArgs {
  id: number;
  title?: string;
  body?: string;
  minReadLevel?: number;
  minEditLevel?: number;
}

export const wikiApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWikiPages: build.query<WikiListResponse, WikiSearchParams>({
      query: (params) => ({ url: '/wiki', params }),
      providesTags: ['WikiPage']
    }),

    getWikiPage: build.query<WikiPageWithBody, number>({
      query: (id) => `/wiki/${id}`,
      providesTags: (_, __, id) => [{ type: 'WikiPage', id }]
    }),

    getWikiPageByAlias: build.query<WikiPageWithBody, string>({
      query: (alias) => `/wiki/by-alias/${encodeURIComponent(alias)}`,
      providesTags: (result) =>
        result ? [{ type: 'WikiPage', id: result.id }] : ['WikiPage']
    }),

    getWikiRevisions: build.query<WikiRevisionsResponse, number>({
      query: (id) => `/wiki/${id}/revisions`,
      providesTags: (_, __, id) => [{ type: 'WikiPage', id }]
    }),

    getWikiRevision: build.query<
      WikiRevisionContent,
      { id: number; rev: number }
    >({
      query: ({ id, rev }) => `/wiki/${id}/revisions/${rev}`
    }),

    createWikiPage: build.mutation<WikiPageWithBody, CreateWikiPageArgs>({
      query: (body) => ({ url: '/wiki', method: 'POST', body }),
      invalidatesTags: ['WikiPage']
    }),

    updateWikiPage: build.mutation<WikiPageWithBody, UpdateWikiPageArgs>({
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
      WikiPageWithBody,
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
