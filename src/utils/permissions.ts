import type { AuthUser } from '../types';

export const VALID_PERMISSIONS = [
  'forums_read',
  'forums_post',
  'forums_moderate',
  'forums_manage',
  'communities_manage',
  'collages_manage',
  'collages_moderate',
  'news_manage',
  'invites_manage',
  'users_edit',
  'users_warn',
  'users_disable',
  'staff',
  'admin'
] as const;

export type Permission = (typeof VALID_PERMISSIONS)[number];

const getPermissions = (
  user: AuthUser | null | undefined
): Record<string, boolean> => user?.userRank?.permissions ?? {};

export const hasPermission = (
  user: AuthUser | null | undefined,
  permission: Permission
): boolean => {
  const permissions = getPermissions(user);
  if (permission === 'admin') return !!(permissions.admin || permissions.staff);
  return !!permissions[permission];
};

export const hasAnyPermission = (
  user: AuthUser | null | undefined,
  permissions: Permission[]
): boolean => permissions.some((permission) => hasPermission(user, permission));

export const isStaffUser = (user: AuthUser | null | undefined): boolean =>
  hasAnyPermission(user, [
    'staff',
    'admin',
    'forums_manage',
    'forums_moderate',
    'communities_manage',
    'news_manage',
    'users_edit'
  ]);
