import type { UseFormRegisterReturn } from 'react-hook-form';
import ImageUpload from './ImageUpload';

interface AvatarFieldProps {
  /** The form's `register('avatar')`. */
  input: UseFormRegisterReturn;
  /** Puts an uploaded image's address into the field (#275). */
  onUploaded: (url: string) => void;
}

/** The avatar address field on the settings form, with its upload control. */
const AvatarField = ({ input, onUploaded }: AvatarFieldProps) => (
  <div>
    <label
      htmlFor="settings-avatar"
      data-st="meta"
      className="block text-sm mb-1"
    >
      Avatar
    </label>
    <input
      id="settings-avatar"
      type="text"
      {...input}
      data-st="field"
      placeholder="https://… or /api/asset/…"
      className="w-full"
    />
    <p data-st="meta" className="text-xs mt-1">
      An <code>https://</code> address, or <code>/api/asset/…</code> for an
      image stored on this site. Plain <code>http://</code> is no longer
      accepted. Remember that whichever host you point at sees the IP address of
      everyone who views your profile and posts — a self-hosted image does not.
    </p>
    <ImageUpload field="avatar" onUploaded={onUploaded} />
  </div>
);

export default AvatarField;
