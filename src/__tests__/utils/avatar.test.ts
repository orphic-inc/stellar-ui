import { avatarSrc, SEEDED_AVATAR_SENTINEL } from '../../utils/avatar';

// Locks the UI half of the seeded-avatar cross-repo contract. The bug this
// guards: stellar-api's devTools generator and this sentinel drifted (the API
// stored null while the UI still expected 'seeded'), so seeded test users
// rendered the shared default instead of the distinct seeded asset.
//
// Note: jest maps every image import to '' (src/__tests__/fileMock.js), so the
// seeded vs default *assets* can't be distinguished here — these tests lock the
// sentinel value + mapping behaviour, not the rendered pixels.
describe('avatarSrc', () => {
  it('keeps the seeded sentinel value in sync with the API', () => {
    // Must equal SEEDED_AVATAR in stellar-api devTools generators/users.ts.
    expect(SEEDED_AVATAR_SENTINEL).toBe('seeded');
  });

  it('maps the seeded sentinel to an asset, not a raw <img src="seeded">', () => {
    // The original bug rendered the sentinel verbatim as a broken image src.
    expect(avatarSrc(SEEDED_AVATAR_SENTINEL)).not.toBe(SEEDED_AVATAR_SENTINEL);
  });

  it('passes a real avatar URL through unchanged', () => {
    const url = 'https://cdn.example.com/me.png';
    expect(avatarSrc(url)).toBe(url);
  });

  // stellar-api #396 added a second stored form: an avatar held in the
  // content-addressed asset store. It is a same-origin relative path, so the
  // passthrough arm already handles it — this pins that it is NOT mistaken for
  // the sentinel or the empty case and swapped for a bundled asset, which would
  // silently replace every self-hosted avatar with the default.
  it('passes an /api/asset content address through unchanged', () => {
    const path = `/api/asset/${'a'.repeat(64)}`;
    expect(avatarSrc(path)).toBe(path);
  });

  it('falls back to the default for null, undefined, empty, and whitespace', () => {
    const fallback = avatarSrc(null);
    expect(avatarSrc(undefined)).toBe(fallback);
    expect(avatarSrc('')).toBe(fallback);
    expect(avatarSrc('   ')).toBe(fallback);
  });
});
