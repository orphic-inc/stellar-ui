import { api } from '../api';

export interface RulesPageAuthor {
  id: number;
  username: string;
}

export interface RulesPage {
  id: number;
  slug: string;
  title: string;
  body: string;
  isMain: boolean;
  sortOrder: number;
  authorId: number;
  author: RulesPageAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface RulesIndex {
  main: RulesPage | null;
  pages: RulesPage[];
}

export interface CreateRulesPageArgs {
  title: string;
  slug?: string;
  body: string;
  isMain?: boolean;
  sortOrder?: number;
}

export interface UpdateRulesPageArgs {
  id: number;
  title?: string;
  body?: string;
  isMain?: boolean;
  sortOrder?: number;
}

export const rulesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRulesIndex: build.query<RulesIndex, void>({
      query: () => '/rules',
      providesTags: ['RulesPage']
    }),
    getRulesPage: build.query<RulesPage, string>({
      query: (slug) => `/rules/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'RulesPage', id: slug }]
    }),
    createRulesPage: build.mutation<RulesPage, CreateRulesPageArgs>({
      query: (body) => ({ url: '/rules', method: 'POST', body }),
      invalidatesTags: ['RulesPage']
    }),
    updateRulesPage: build.mutation<RulesPage, UpdateRulesPageArgs>({
      query: ({ id, ...body }) => ({
        url: `/rules/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['RulesPage']
    }),
    deleteRulesPage: build.mutation<void, number>({
      query: (id) => ({ url: `/rules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RulesPage']
    })
  })
});

export const {
  useGetRulesIndexQuery,
  useGetRulesPageQuery,
  useCreateRulesPageMutation,
  useUpdateRulesPageMutation,
  useDeleteRulesPageMutation
} = rulesApi;
