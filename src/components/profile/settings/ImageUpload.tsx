import { useId, useRef, useState, type ReactNode } from 'react';
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
const ASSET_PATH = '/api/asset/';

/** What to tell the member when an upload is refused. */
export const uploadErrorMessage = (err: unknown): string => {
  if ((err as { status?: unknown })?.status === 413) return TOO_LARGE;
  const msg = getApiErrorMessage(err) ?? 'The upload failed.';
  return AT_LIMIT.test(msg) ? msg + FREE_A_SLOT : msg;
};

/** A field's saved value, and what a browser may load for it (its `*Src`). */
export interface SavedImage {
  value: string;
  src: string | null;
}

/**
 * What to preview for the field's current value. An upload is a same-origin
 * path and shows as it is. A saved older `https://` address shows only through
 * the api's resolved `*Src`, so the page never loads a remote image (ADR-0051).
 */
export const previewSrc = (value: string, saved: SavedImage): string | null => {
  if (value.startsWith(ASSET_PATH)) return value;
  return value !== '' && value === saved.value ? saved.src : null;
};

type Note = { text: string; error: boolean };

/** Holds the chosen file's name and outcome, and uploads it for `field`. */
const useImagePicker = (field: ImageField, onUploaded: (u: string) => void) => {
  const [upload, { isLoading }] = useUploadAssetMutation();
  const [fileName, setFileName] = useState('');
  const [note, setNote] = useState<Note | null>(null);

  const pick = async (file: File) => {
    setFileName(file.name);
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
  const clear = () => {
    setFileName('');
    setNote(null);
  };
  return { isLoading, fileName, note, pick, clear };
};

interface PreviewProps {
  value: string;
  src: string | null;
  label: string;
}

const Preview = ({ value, src, label }: PreviewProps) => {
  if (!value) {
    return (
      <p data-st="meta" className="text-xs">
        No image.
      </p>
    );
  }
  if (!src) {
    return (
      <p data-st="meta" className="text-xs">
        Saved as an address on another site. It shows here once this site has a
        copy.
      </p>
    );
  }
  return (
    <img
      src={src}
      alt={`Current ${label.toLowerCase()}`}
      className="h-16 w-16 object-contain"
    />
  );
};

const NoteLine = ({ note }: { note: Note }) => (
  <p
    data-st="meta"
    role={note.error ? 'alert' : 'status'}
    className={'text-xs mt-1' + (note.error ? ' text-[var(--st-danger)]' : '')}
  >
    {note.text}
  </p>
);

interface ImageUploadProps {
  /** The image field an upload will replace (stellar-api#871). */
  field: ImageField;
  label: string;
  /** The form's value: an `/api/asset/…` path, an older address, or `''`. */
  value: string;
  /** Receives an upload's address, or `''` when the member removes the image. */
  onChange: (value: string) => void;
  saved: SavedImage;
  /** Present when the field is locked: shown in place of the controls. */
  lockedNote?: ReactNode;
}

/**
 * An image field (stellar-ui#434): a preview of the current image, `[Browse]`
 * to upload a new one and `[Remove]` to empty it. There is no address box. The
 * form's own save stores the result, and `''` releases the old upload.
 */
const ImageUpload = (props: ImageUploadProps) => {
  const { field, label, value, onChange, saved, lockedNote } = props;
  const user = useSelector(selectCurrentUser);
  const picker = useImagePicker(field, onChange);
  const fileInput = useRef<HTMLInputElement>(null);
  const labelId = useId();
  // `null` is unlimited and `0` is none (stellar-api#716).
  const canUpload = user?.userRank?.assetLimit !== 0;

  const remove = () => {
    picker.clear();
    onChange('');
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void picker.pick(file);
  };

  return (
    <div role="group" aria-labelledby={labelId}>
      <span
        id={labelId}
        data-st="meta"
        className={
          'block text-sm mb-1' +
          (lockedNote ? ' cursor-not-allowed opacity-50' : '')
        }
      >
        {label}
      </span>
      <Preview value={value} src={previewSrc(value, saved)} label={label} />
      {lockedNote ?? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {canUpload && (
            <>
              <input
                ref={fileInput}
                type="file"
                hidden
                aria-label={`${label} image file`}
                accept={UPLOADABLE_IMAGE_TYPES.join(',')}
                onChange={onFile}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={picker.isLoading}
                className="brackets btn-link disabled:opacity-40"
              >
                {picker.isLoading ? 'Uploading…' : 'Browse'}
              </button>
              {picker.fileName && <span>{picker.fileName}</span>}
            </>
          )}
          {value && (
            <button
              type="button"
              onClick={remove}
              className="brackets btn-link"
            >
              Remove
            </button>
          )}
        </div>
      )}
      {!lockedNote && !canUpload && (
        <p data-st="meta" className="text-xs mt-1">
          Your rank can&apos;t upload images yet.
        </p>
      )}
      {picker.note && <NoteLine note={picker.note} />}
    </div>
  );
};

export default ImageUpload;
