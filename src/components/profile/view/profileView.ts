import type { paths } from '../../../types/api';
import type { AuthUser } from '../../../types';
import { formatBytes } from '../../../utils';
import { hasAnyPermission } from '../../../utils/permissions';

/** What `GET /profile/user/{userId}` answers: the profile every section reads. */
export type ProfileView =
  paths['/profile/user/{userId}']['get']['responses'][200]['content']['application/json'];

/** What `GET /profile/me/ratio` answers; only ever fetched on the own profile. */
export type MyRatioStats =
  paths['/profile/me/ratio']['get']['responses'][200]['content']['application/json'];

export const COLLAGE_CATEGORY_LABELS: Record<number, string> = {
  0: 'Personal',
  1: 'Theme / Genre',
  2: 'Discography',
  3: 'Label',
  4: 'Charts',
  5: 'Staff Picks',
  6: 'Other'
};

export const formatByteStat = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 'Hidden';
  try {
    return formatBytes(Number(BigInt(String(value))));
  } catch {
    return formatBytes(Number(value));
  }
};

const ERROR_MESSAGES: Record<number, string> = {
  401: 'You must be signed in to view this profile.',
  403: 'You do not have permission to view this profile.',
  404: 'User not found.'
};

/** The message for a failed profile load, by HTTP status. */
export const profileErrorMessage = (error: object) => {
  const status =
    'status' in error && typeof error.status === 'number' ? error.status : 0;
  return ERROR_MESSAGES[status] ?? 'Unable to load profile.';
};

/** The five permissions that make a profile viewer staff. */
export const isStaffViewer = (user: AuthUser | null) =>
  hasAnyPermission(user, [
    'staff',
    'admin',
    'users_edit',
    'users_warn',
    'users_disable'
  ]);

/** Whether the owner may edit their own staff bio. */
export const canEditOwnStaffBio = (
  user: AuthUser | null,
  profile: ProfileView,
  isOwnProfile: boolean
) =>
  isOwnProfile &&
  (profile.userRank.displayStaff || hasAnyPermission(user, ['admin']));
