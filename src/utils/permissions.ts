import type { AuthUser } from '../types';
import type { components } from '../types/api';

export type Permission = components['schemas']['PermissionKey'];

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
  hasPermission(user, 'staff');

export const isStaffUser = (user: AuthUser | null | undefined): boolean =>
  hasPermission(user, 'staff');
