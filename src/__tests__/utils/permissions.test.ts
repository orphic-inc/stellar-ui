import {
  canSeeModBar,
  hasPermission,
  hasAnyPermission,
  isStaffUser
} from '../../utils/permissions';
import {
  canAccessStaffQueue,
  canSeeTop10History,
  canUseReportActions,
  canUseRequestModeration
} from '../../components/staff/staffAffordances';
import { canAccessToolbox } from '../../components/staff/staffToolRegistry';

const makeUser = (permissions: Record<string, boolean>) =>
  ({
    id: 1,
    username: 'tester',
    userRank: { permissions }
  }) as never;

describe('permissions helpers', () => {
  it('treats admin as satisfying other permission checks', () => {
    expect(hasPermission(makeUser({ admin: true }), 'reports_manage')).toBe(
      true
    );
  });

  it('returns true when any permission matches', () => {
    expect(
      hasAnyPermission(makeUser({ wiki_edit: true }), ['staff', 'wiki_edit'])
    ).toBe(true);
  });

  it('gates staff UI on the staff permission', () => {
    expect(isStaffUser(makeUser({ staff: true }))).toBe(true);
    expect(isStaffUser(makeUser({ admin: true }))).toBe(true);
    expect(isStaffUser(makeUser({ forums_moderate: true }))).toBe(false);
    expect(isStaffUser(makeUser({}))).toBe(false);
  });

  it('gates the modbar on the staff permission', () => {
    expect(canSeeModBar(makeUser({ staff: true }))).toBe(true);
    expect(canSeeModBar(makeUser({ admin: true }))).toBe(true);
    expect(canSeeModBar(makeUser({ forums_moderate: true }))).toBe(false);
  });

  it('derives toolbox access from the staff tool registry', () => {
    expect(canAccessToolbox(makeUser({ reports_manage: true }))).toBe(true);
    expect(canAccessToolbox(makeUser({}))).toBe(false);
  });

  it('gates queue and report affordances on exact permissions', () => {
    expect(canAccessStaffQueue(makeUser({ staff_inbox_manage: true }))).toBe(
      true
    );
    expect(canAccessStaffQueue(makeUser({ staff: true }))).toBe(false);
    expect(canUseReportActions(makeUser({ reports_manage: true }))).toBe(true);
    expect(canUseReportActions(makeUser({ staff: true }))).toBe(true);
  });

  it('keeps dedicated staff affordances where intended', () => {
    expect(canSeeTop10History(makeUser({ staff: true }))).toBe(true);
    expect(canSeeTop10History(makeUser({ admin: true }))).toBe(true);
    expect(canSeeTop10History(makeUser({ reports_manage: true }))).toBe(false);
  });

  it('gates request moderation on requests_moderate', () => {
    expect(canUseRequestModeration(makeUser({ requests_moderate: true }))).toBe(
      true
    );
    expect(canUseRequestModeration(makeUser({ staff: true }))).toBe(true);
  });
});
