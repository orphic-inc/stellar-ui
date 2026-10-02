import { useController, type Control } from 'react-hook-form';
import ImageUpload, { type SavedImage } from './ImageUpload';
import type { MyProfileResponse, ProfileForm } from './Settings';

// The saved avatar, read as `toProfileForm` reads it, with its resolved src.
const savedAvatar = (profile?: MyProfileResponse): SavedImage =>
  profile?.profile.avatar != null
    ? { value: profile.profile.avatar, src: profile.profile.avatarSrc ?? null }
    : { value: profile?.avatar ?? '', src: profile?.avatarSrc ?? null };

interface AvatarFieldProps {
  /** The settings form's `control`; the field is its `avatar`. */
  control: Control<ProfileForm>;
  /** The loaded profile, for the saved avatar's preview. */
  profile?: MyProfileResponse;
}

/** The avatar on the settings form: upload-only, like every image field (#434). */
const AvatarField = ({ control, profile }: AvatarFieldProps) => {
  const { field } = useController({ name: 'avatar', control });
  return (
    <div>
      <ImageUpload
        field="avatar"
        label="Avatar"
        value={field.value ?? ''}
        onChange={field.onChange}
        saved={savedAvatar(profile)}
      />
      <p data-st="meta" className="text-xs mt-1">
        A PNG, JPEG, GIF or WebP image, stored on this site.
      </p>
    </div>
  );
};

export default AvatarField;
