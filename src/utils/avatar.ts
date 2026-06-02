import type { SyntheticEvent } from 'react';

/** Bundled fallback avatar, served from src/static (see webpack config). */
export const DEFAULT_AVATAR = '/static/common/avatars/default.png';

/**
 * Resolve a user's avatar URL to something renderable. Treats null, undefined,
 * and empty string alike — all fall back to the bundled default. (Gravatar was
 * removed; stored avatars may be null for new users.)
 */
export const avatarSrc = (avatar?: string | null): string =>
  avatar && avatar.trim() ? avatar : DEFAULT_AVATAR;

/**
 * onError handler for avatar <img> tags — swaps to the default when the stored
 * URL fails to load (e.g. a stale external URL that now 404s). Guards against an
 * infinite loop if the default itself is missing.
 */
export const onAvatarError = (e: SyntheticEvent<HTMLImageElement>): void => {
  const img = e.currentTarget;
  if (img.src.endsWith(DEFAULT_AVATAR)) return;
  img.src = DEFAULT_AVATAR;
};
