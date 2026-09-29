import type { SyntheticEvent } from 'react';
import defaultAvatar from '../assets/avatars/default.png';
import seededAvatar from '../assets/avatars/seeded.png';

/**
 * Sentinel the API stamps on devTools-seeded users (it can't reference a
 * webpack-bundled asset by URL, so it stores this marker and the UI maps it).
 * Keep in sync with SEEDED_AVATAR in stellar-api's devTools user generator.
 */
export const SEEDED_AVATAR_SENTINEL = 'seeded';

export { defaultAvatar as DEFAULT_AVATAR };

/**
 * The image source for a member's avatar.
 *
 * Renders from `src`, the api's resolved `avatarSrc`: a same-origin path, or
 * null while a remote avatar is not imported (stellar-api ADR-0051). It is never
 * a remote URL, which is what lets the CSP close `img-src` to `'self'`
 * (#402, #403). `raw` is the stored `avatar`, read only for the seeded sentinel,
 * which resolves to null because it is not a URL.
 *
 * - the seeded sentinel → bundled seeded marker (visually distinct test users)
 * - a resolved src → that
 * - otherwise (none, pending, failed) → bundled default
 */
export const avatarSrc = (src?: string | null, raw?: string | null): string => {
  if (raw === SEEDED_AVATAR_SENTINEL) return seededAvatar;
  return src || defaultAvatar;
};

/**
 * onError handler for avatar <img> tags — swaps to the bundled default when an
 * image fails to load (e.g. an asset that has since been collected). Guards
 * against a loop if the default itself somehow fails.
 */
export const onAvatarError = (e: SyntheticEvent<HTMLImageElement>): void => {
  const img = e.currentTarget;
  if (img.src.endsWith(defaultAvatar)) return;
  img.src = defaultAvatar;
};
