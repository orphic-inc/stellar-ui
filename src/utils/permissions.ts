import type { AuthUser } from '../types';
import { type Permission, VALID_PERMISSIONS } from './permissionCatalog';

export { VALID_PERMISSIONS };
export type { Permission };

const getPermissions = (
  user: AuthUser | null | undefined
): Record<string, boolean> => user?.userRank?.permissions ?? {};

export const hasPermission = (
  user: AuthUser | null | undefined,
  permission: Permission
): boolean => {
  const permissions = getPermissions(user);
  if (permissions.admin) return true;
  return !!permissions[permission];
};

export const hasAnyPermission = (
  user: AuthUser | null | undefined,
  permissions: Permission[]
): boolean => permissions.some((permission) => hasPermission(user, permission));

export const canSeeModBar = (user: AuthUser | null | undefined): boolean =>
  hasAnyPermission(user, ['staff', 'admin']);

export const isStaffUser = (user: AuthUser | null | undefined): boolean =>
  hasAnyPermission(user, [
    'staff',
    'forums_manage',
    'forums_moderate',
    'communities_manage',
    'contributions_manage',
    'reports_manage',
    'staff_inbox_manage',
    'news_manage',
    'users_edit',
    'rank_permissions_manage'
  ]);
