import {
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
  it('treats staff as satisfying admin checks', () => {
    expect(hasPermission(makeUser({ staff: true }), 'admin')).toBe(true);
  });

  it('returns true when any permission matches', () => {
    expect(
      hasAnyPermission(makeUser({ wiki_edit: true }), ['staff', 'wiki_edit'])
    ).toBe(true);
  });

  it('recognizes non-staff elevated users for staff-only UI gates', () => {
    expect(isStaffUser(makeUser({ forums_moderate: true }))).toBe(true);
    expect(isStaffUser(makeUser({}))).toBe(false);
  });
});
