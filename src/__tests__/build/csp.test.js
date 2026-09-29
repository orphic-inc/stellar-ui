/**
 * The production CSP (#402). The resource axes are closed, so a request to a
 * host a member chose cannot leave the page; each directive is pinned whole,
 * because a stray `https:` reopens it.
 */
const { buildCsp, sentryOrigin } = require('../../../webpack.csp');

const directive = (csp, name) =>
  csp.split('; ').find((d) => d.split(' ')[0] === name);

describe('buildCsp', () => {
  const csp = buildCsp();

  it.each([
    ['img-src', "img-src 'self' data:"],
    ['font-src', "font-src 'self'"],
    ['connect-src', "connect-src 'self'"],
    ['script-src', "script-src 'self'"],
    ['object-src', "object-src 'none'"]
  ])('pins %s', (name, expected) => {
    expect(directive(csp, name)).toBe(expected);
  });

  it('keeps style-src open for a member external stylesheet (ADR-0024)', () => {
    expect(directive(csp, 'style-src')).toBe(
      "style-src 'self' 'unsafe-inline' https:"
    );
  });

  it('allows exactly the Sentry ingest origin when the build has a DSN', () => {
    const withSentry = buildCsp({
      sentryDsn: 'https://abc123@o42.ingest.sentry.io/7'
    });
    expect(directive(withSentry, 'connect-src')).toBe(
      "connect-src 'self' https://o42.ingest.sentry.io"
    );
    expect(directive(withSentry, 'img-src')).toBe("img-src 'self' data:");
  });
});

describe('sentryOrigin', () => {
  it('drops the key and project, keeping only the origin', () => {
    expect(sentryOrigin('https://key@o1.ingest.us.sentry.io/99')).toBe(
      'https://o1.ingest.us.sentry.io'
    );
  });

  it('is null with no DSN', () => {
    expect(sentryOrigin('')).toBeNull();
    expect(sentryOrigin(undefined)).toBeNull();
  });

  it('fails the build on a DSN that is not https', () => {
    expect(() => sentryOrigin('http://key@sentry.local/1')).toThrow(/https/);
    expect(() => sentryOrigin('not a url')).toThrow();
  });
});
