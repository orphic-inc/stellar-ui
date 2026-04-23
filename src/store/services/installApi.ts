import { api } from '../api';
import type { paths } from '../../types/api';

type InstallStatus =
  paths['/install']['get']['responses'][200]['content']['application/json'];
type InstallArgs = NonNullable<
  paths['/install']['post']['requestBody']
>['content']['application/json'];
type InstallResponse =
  paths['/install']['post']['responses'][201]['content']['application/json'];

export const installApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInstallStatus: build.query<InstallStatus, void>({
      query: () => '/install'
    }),
    install: build.mutation<InstallResponse, InstallArgs>({
      query: (data) => ({ url: '/install', method: 'POST', body: data })
    })
  })
});

export const { useGetInstallStatusQuery, useInstallMutation } = installApi;
