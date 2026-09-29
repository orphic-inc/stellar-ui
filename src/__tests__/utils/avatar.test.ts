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
  const ASSET = `/api/asset/${'a'.repeat(64)}`;

  it('keeps the seeded sentinel value in sync with the API', () => {
    // Must equal SEEDED_AVATAR in stellar-api devTools generators/users.ts.
    expect(SEEDED_AVATAR_SENTINEL).toBe('seeded');
  });

  it('maps the seeded sentinel to an asset, not a raw <img src="seeded">', () => {
    // The sentinel is not a URL, so the api resolves it to a null avatarSrc.
    expect(avatarSrc(null, SEEDED_AVATAR_SENTINEL)).not.toBe(
      SEEDED_AVATAR_SENTINEL
    );
  });

  it('renders the resolved src', () => {
    expect(avatarSrc(ASSET, 'https://cdn.example.com/me.png')).toBe(ASSET);
  });

  // #403: the raw avatar may be a remote URL. It is never drawn, or the CSP's
  // img-src 'self' (#402) would block it.
  it('never draws the raw avatar, even when nothing is resolved', () => {
    const raw = 'https://cdn.example.com/me.png';
    expect(avatarSrc(null, raw)).not.toBe(raw);
    expect(avatarSrc(null, raw)).toBe(avatarSrc(null));
  });

  it('falls back to the default for null, undefined and empty', () => {
    const fallback = avatarSrc(null);
    expect(avatarSrc(undefined)).toBe(fallback);
    expect(avatarSrc('')).toBe(fallback);
  });
});
