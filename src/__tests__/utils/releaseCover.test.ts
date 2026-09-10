import { releaseCover } from '../../utils/releaseCover';

// #318. The three "no group cover" inputs are distinct on the wire and all
// resolve to the release's own art — a test that only covered `null` would pass
// against a `?.` chain that mishandles `undefined`, and vice versa.
describe('releaseCover', () => {
  it('prefers the group cover when the group has one', () => {
    expect(
      releaseCover(
        { image: 'https://e/group.jpg' },
        { image: 'https://e/r.jpg' }
      )
    ).toBe('https://e/group.jpg');
  });

  it('falls back to the release when the group is absent', () => {
    expect(releaseCover(undefined, { image: 'https://e/r.jpg' })).toBe(
      'https://e/r.jpg'
    );
  });

  it('falls back to the release when the release is ungrouped', () => {
    expect(releaseCover(null, { image: 'https://e/r.jpg' })).toBe(
      'https://e/r.jpg'
    );
  });

  it('falls back to the release when the group has no cover art', () => {
    expect(releaseCover({ image: null }, { image: 'https://e/r.jpg' })).toBe(
      'https://e/r.jpg'
    );
  });

  it('returns null when neither has art, rather than undefined', () => {
    expect(releaseCover({ image: null }, { image: null })).toBeNull();
    expect(releaseCover(null, null)).toBeNull();
    expect(releaseCover(undefined, undefined)).toBeNull();
  });

  it('uses the group cover even when the release has none', () => {
    expect(
      releaseCover({ image: 'https://e/group.jpg' }, { image: null })
    ).toBe('https://e/group.jpg');
  });
});
