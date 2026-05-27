import {
  canSeeModBar,
  hasPermission,
  hasAnyPermission,
  isStaffUser
} from '../../utils/permissions';

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
});
