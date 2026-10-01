import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  UPLOADABLE_IMAGE_TYPES,
  useUploadAssetMutation,
  type ImageField
} from '../../../store/services/assetApi';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { getApiErrorMessage } from '../../../utils/apiError';

const TOO_LARGE = 'This image is larger than the site allows.';
const WRONG_TYPE = 'Choose a PNG, JPEG, GIF or WebP image.';
// `Asset limit reached (N).` — the member is at their rank's limit.
const AT_LIMIT = /^Asset limit reached/;
const FREE_A_SLOT =
  ' Clearing one of your image fields and saving frees a slot.';

/** What to tell the member when an upload is refused. */
export const uploadErrorMessage = (err: unknown): string => {
  if ((err as { status?: unknown })?.status === 413) return TOO_LARGE;
  const msg = getApiErrorMessage(err) ?? 'The upload failed.';
  return AT_LIMIT.test(msg) ? msg + FREE_A_SLOT : msg;
};

interface ImageUploadProps {
  /** The image field the upload will replace (stellar-api#871). */
  field: ImageField;
  /** Receives the stored image's `/api/asset/…` address. */
  onUploaded: (url: string) => void;
}

/**
 * Upload an image to the site and hand back its address, for a form field that
 * takes one (stellar-ui#275). The form's own save stores it, as if the member
 * had typed the address.
 */
const ImageUpload = ({ field, onUploaded }: ImageUploadProps) => {
  const user = useSelector(selectCurrentUser);
  const [upload, { isLoading }] = useUploadAssetMutation();
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(
    null
  );
  const id = `image-upload-${field}`;

  // `null` is unlimited and `0` is none (stellar-api#716).
  if (user?.userRank?.assetLimit === 0) {
    return (
      <p data-st="meta" className="text-xs mt-1">
        Your rank can&apos;t upload images yet. You can still use an{' '}
        <code>https://</code> address.
      </p>
    );
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!(UPLOADABLE_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setNote({ text: WRONG_TYPE, error: true });
      return;
    }
    try {
      const { url } = await upload({ file, field }).unwrap();
      onUploaded(url);
      setNote({ text: 'Uploaded. Save to use it.', error: false });
    } catch (err) {
      setNote({ text: uploadErrorMessage(err), error: true });
    }
  };

  return (
    <div className="mt-2">
      <label htmlFor={id} data-st="meta" className="text-xs mr-2">
        Or upload an image
      </label>
      <input
        id={id}
        type="file"
        accept={UPLOADABLE_IMAGE_TYPES.join(',')}
        onChange={onChange}
        disabled={isLoading}
        className="text-xs"
      />
      {note && (
        <p
          data-st="meta"
          role={note.error ? 'alert' : 'status'}
          className={
            'text-xs mt-1' + (note.error ? ' text-[var(--st-danger)]' : '')
          }
        >
          {note.text}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
