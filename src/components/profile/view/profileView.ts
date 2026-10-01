import type { paths } from '../../../types/api';
import type { AuthUser } from '../../../types';
import { formatBytes } from '../../../utils';
import { hasAnyPermission, hasPermission } from '../../../utils/permissions';

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

/**
 * Whether a profile links to the member's invite tree (#423), the page
 * `GET /users/{id}/invite-tree` serves under the same `invites_manage` gate.
 * Never on your own profile: your tree is on /invite.
 *
 * Hidden when the member is known to have invited nobody, as the legacy
 * implementation did. `community` is null when the member hides ratio stats
 * from a viewer who isn't staff, so an unknown count still shows the link: a
 * viewer with the permission never loses access to a tree that exists.
 */
export const showsInviteTreeLink = (
  viewer: AuthUser | null | undefined,
  profile: Pick<ProfileView, 'id' | 'community'>
): boolean =>
  !!viewer &&
  viewer.id !== profile.id &&
  hasPermission(viewer, 'invites_manage') &&
  profile.community?.invites.direct !== 0;
