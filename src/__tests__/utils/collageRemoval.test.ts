import {
  collapsedCopies,
  removalConfirmMessage,
  removalFailureMessage
} from '../../utils/collageRemoval';
import type { CollageEntry } from '../../store/services/collageApi';

const entry = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 1,
    releaseId: 41,
    userId: 7,
    ...overrides
  }) as unknown as CollageEntry;

describe('collapsedCopies', () => {
  it('is just the representative when nothing was absorbed', () => {
    expect(collapsedCopies(entry())).toEqual([{ releaseId: 41, userId: 7 }]);
  });

  it('carries each absorbed copy with ITS OWN adder, not the representative’s', () => {
    // The whole point: delete permission is per row, so a copy added by someone
    // else must not inherit the representative's userId.
    expect(
      collapsedCopies(
        entry({
          groupedWith: [{ id: 2, releaseId: 87, userId: 55, title: 'Kid A' }]
        })
      )
    ).toEqual([
      { releaseId: 41, userId: 7 },
      { releaseId: 87, userId: 55 }
    ]);
  });
});

describe('removalConfirmMessage', () => {
  it('asks the original question for a row that is one entry', () => {
    expect(removalConfirmMessage('Kid A', 1, 1)).toBe(
      'Remove this release from the collage?'
    );
  });

  it('says how many will go when the viewer may remove them all', () => {
    expect(removalConfirmMessage('Kid A', 2, 2)).toContain(
      'all 2 will be removed'
    );
  });

  it('says what will be left behind, and why, on a partial removal', () => {
    const msg = removalConfirmMessage('Kid A', 3, 1);
    expect(msg).toContain('You can remove 1');
    expect(msg).toContain('added by other members and will stay');
  });
});

describe('removalFailureMessage', () => {
  it('calls out a 429, because the loop stops and copies remain', () => {
    expect(removalFailureMessage({ status: 429 })).toContain(
      'Too many requests'
    );
  });

  it('reads the same for everything else, including a locked collage 403', () => {
    expect(removalFailureMessage({ status: 403 })).toBe(
      'Failed to remove entry.'
    );
    expect(removalFailureMessage(new Error('network'))).toBe(
      'Failed to remove entry.'
    );
    expect(removalFailureMessage(undefined)).toBe('Failed to remove entry.');
  });
});
