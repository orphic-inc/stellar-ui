import type { AuthUser } from '../../types';
import { hasPermission } from '../../utils/permissions';

export const canSeeModBar = (user: AuthUser | null | undefined): boolean =>
  hasPermission(user, 'staff');

export const canAccessStaffQueue = (
  user: AuthUser | null | undefined
): boolean => hasPermission(user, 'staff_inbox_manage');

export const canUseReportActions = (
  user: AuthUser | null | undefined
): boolean =>
  hasPermission(user, 'reports_manage') || hasPermission(user, 'staff');

export const canUseTicketStaffActions = (
  user: AuthUser | null | undefined
): boolean =>
  hasPermission(user, 'staff_inbox_manage') || hasPermission(user, 'staff');

export const canUseRequestModeration = (
  user: AuthUser | null | undefined
): boolean =>
  hasPermission(user, 'requests_moderate') || hasPermission(user, 'staff');

export const canSeeTop10History = (
  user: AuthUser | null | undefined
): boolean => hasPermission(user, 'staff');
