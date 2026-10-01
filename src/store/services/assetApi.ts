import { api } from '../api';
import type { paths } from '../../types/api';

type UploadAssetQuery = NonNullable<
  paths['/asset']['post']['parameters']['query']
>;
export type UploadAssetResponse =
  paths['/asset']['post']['responses'][201]['content']['application/json'];

// The image field an upload will replace (stellar-api#871): that field's
// current asset does not count toward the rank's limit, so a member at their
// limit can still upload the replacement. Saving the form releases the old one.
export type ImageField = NonNullable<UploadAssetQuery['field']>;

// The types `POST /asset` accepts, by magic bytes. Checked here only to refuse
// an obvious mismatch before sending; the api's check is the authority.
export const UPLOADABLE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
] as const;

export interface UploadAssetArgs {
  file: File;
  field: ImageField;
}

export const assetApi = api.injectEndpoints({
  endpoints: (build) => ({
    // The body is the raw image, not multipart: the api reads it with
    // `express.raw` and identifies it by its own bytes. fetchBaseQuery drops
    // any Content-Type for a body it cannot serialise, and the browser then
    // sets it from the File's own type, which is the header the api checks.
    uploadAsset: build.mutation<UploadAssetResponse, UploadAssetArgs>({
      query: ({ file, field }) => ({
        url: '/asset',
        method: 'POST',
        params: { kind: 'Avatar', field } satisfies UploadAssetQuery,
        body: file
      })
    })
  })
});

export const { useUploadAssetMutation } = assetApi;
