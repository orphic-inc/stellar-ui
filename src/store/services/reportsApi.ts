import { api } from '../api';
import type { paths } from '../../types/api';

type ReportListResponse =
  paths['/reports']['get']['responses'][200]['content']['application/json'];
type ReportResponse =
  paths['/reports/{id}']['get']['responses'][200]['content']['application/json'];
type FileReportBody = NonNullable<
  paths['/reports']['post']['requestBody']
>['content']['application/json'];
type FileReportResponse =
  paths['/reports']['post']['responses'][201]['content']['application/json'];
type ResolveBody = NonNullable<
  paths['/reports/{id}/resolve']['post']['requestBody']
>['content']['application/json'];
type AddNoteBody = NonNullable<
  paths['/reports/{id}/notes']['post']['requestBody']
>['content']['application/json'];
type AddNoteResponse =
  paths['/reports/{id}/notes']['post']['responses'][201]['content']['application/json'];
type CountsResponse =
  paths['/reports/counts']['get']['responses'][200]['content']['application/json'];
type MyReportsResponse =
  paths['/reports/mine']['get']['responses'][200]['content']['application/json'];

export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReports: build.query<
      ReportListResponse,
      {
        page?: number;
        status?: string;
        targetType?: string;
        claimedByMe?: boolean;
      }
    >({
      query: ({
        page = 1,
        status = 'Open',
        targetType = 'all',
        claimedByMe = false
      } = {}) => ({
        url: '/reports',
        params: { page, status, targetType, claimedByMe }
      }),
      providesTags: ['Report']
    }),

    getMyReports: build.query<MyReportsResponse, { page?: number }>({
      query: ({ page = 1 } = {}) => ({
        url: '/reports/mine',
        params: { page }
      }),
      providesTags: ['Report']
    }),

    getReportCounts: build.query<CountsResponse, void>({
      query: () => '/reports/counts',
      providesTags: ['Report']
    }),

    getReport: build.query<ReportResponse, number>({
      query: (id) => `/reports/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Report', id }]
    }),

    fileReport: build.mutation<FileReportResponse, FileReportBody>({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      invalidatesTags: ['Report']
    }),

    claimReport: build.mutation<void, number>({
      query: (id) => ({ url: `/reports/${id}/claim`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Report', id }, 'Report']
    }),

    unclaimReport: build.mutation<void, number>({
      query: (id) => ({ url: `/reports/${id}/unclaim`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Report', id }, 'Report']
    }),

    resolveReport: build.mutation<void, { id: number } & ResolveBody>({
      query: ({ id, ...body }) => ({
        url: `/reports/${id}/resolve`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Report', id },
        'Report'
      ]
    }),

    addReportNote: build.mutation<
      AddNoteResponse,
      { id: number } & AddNoteBody
    >({
      query: ({ id, ...body }) => ({
        url: `/reports/${id}/notes`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Report', id }]
    })
  })
});

export const {
  useGetReportsQuery,
  useGetMyReportsQuery,
  useGetReportCountsQuery,
  useGetReportQuery,
  useFileReportMutation,
  useClaimReportMutation,
  useUnclaimReportMutation,
  useResolveReportMutation,
  useAddReportNoteMutation
} = reportsApi;
