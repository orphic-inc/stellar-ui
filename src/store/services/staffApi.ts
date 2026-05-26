import { api } from '../api';
import type { paths } from '../../types/api';

type GetStaffResponse =
  paths['/staff']['get']['responses'][200]['content']['application/json'];

export const staffApi = api.injectEndpoints({
  endpoints: (build) => ({
    getStaff: build.query<GetStaffResponse, void>({
      query: () => '/staff',
      providesTags: ['StaffGroup', 'UserRank']
    })
  })
});

export const { useGetStaffQuery } = staffApi;
