import { releaseCover } from '../../utils/releaseCover';

// #318. The three "no group cover" inputs are distinct on the wire and all
// resolve to the release's own art — a test that only covered `null` would pass
// against a `?.` chain that mishandles `undefined`, and vice versa.
describe('releaseCover', () => {
  it('prefers the group cover when the group has one', () => {
    expect(
      releaseCover(
        { imageSrc: '/api/asset/group' },
        { imageSrc: '/api/asset/r' }
      )
    ).toBe('/api/asset/group');
  });

  it('falls back to the release when the group is absent', () => {
    expect(releaseCover(undefined, { imageSrc: '/api/asset/r' })).toBe(
      '/api/asset/r'
    );
  });

  it('falls back to the release when the release is ungrouped', () => {
    expect(releaseCover(null, { imageSrc: '/api/asset/r' })).toBe(
      '/api/asset/r'
    );
  });

  it('falls back to the release when the group has no cover art', () => {
    expect(releaseCover({ imageSrc: null }, { imageSrc: '/api/asset/r' })).toBe(
      '/api/asset/r'
    );
  });

  it('returns null when neither has art, rather than undefined', () => {
    expect(releaseCover({ imageSrc: null }, { imageSrc: null })).toBeNull();
    expect(releaseCover(null, null)).toBeNull();
    expect(releaseCover(undefined, undefined)).toBeNull();
  });

  // #403: the raw `image` may be a remote URL, and is never drawn.
  it('reads only the resolved cover, never the raw image', () => {
    expect(
      releaseCover(
        { image: 'https://e/group.jpg', imageSrc: null } as never,
        { image: 'https://e/r.jpg', imageSrc: null } as never
      )
    ).toBeNull();
  });

  it('uses the group cover even when the release has none', () => {
    expect(
      releaseCover({ imageSrc: '/api/asset/group' }, { imageSrc: null })
    ).toBe('/api/asset/group');
  });
});
