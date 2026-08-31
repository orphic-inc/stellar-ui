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
 * Resolve a user's stored avatar value to a renderable image source.
 * - null / undefined / empty → bundled default
 * - the seeded sentinel → bundled seeded marker (visually distinct test users)
 * - anything else → passed through as-is
 *
 * The passthrough arm carries two forms since stellar-api #396: a remote
 * `https://…` URL, and `/api/asset/<sha256>` for an avatar stored in the
 * content-addressed asset store. The second is a same-origin relative path,
 * which needs no handling here — the store's `baseUrl` is already `/api`, the
 * dev server proxies `/api`, and the CSP's `img-src 'self'` covers it. It is
 * also the only form that survives if `img-src` is ever tightened to `'self'`
 * (stellar-api #457).
 */
export const avatarSrc = (avatar?: string | null): string => {
  if (!avatar || !avatar.trim()) return defaultAvatar;
  if (avatar === SEEDED_AVATAR_SENTINEL) return seededAvatar;
  return avatar;
};

/**
 * onError handler for avatar <img> tags — swaps to the bundled default when a
 * stored external URL fails to load (e.g. a stale link that now 404s). Guards
 * against a loop if the default itself somehow fails.
 */
export const onAvatarError = (e: SyntheticEvent<HTMLImageElement>): void => {
  const img = e.currentTarget;
  if (img.src.endsWith(defaultAvatar)) return;
  img.src = defaultAvatar;
};
