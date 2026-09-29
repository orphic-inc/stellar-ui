/**
 * Content-Security-Policy for production builds, emitted as a `<meta>` by
 * webpack.config.js.
 *
 * The code-execution axes are the XSS gate: `script-src 'self'` (no inline,
 * eval or remote script), `object-src 'none'`, `base-uri` and `form-action
 * 'self'` (ADR-0003).
 *
 * The resource axes are closed too (#402, stellar-api#457, ADR-0031 §6). A
 * request to a host a member chose discloses the viewer's IP, user agent and
 * timing to that host:
 *
 * - `img-src 'self' data:`. stellar-api imports every remote image into its
 *   asset store and the UI draws each from its same-origin `*Src` (#403,
 *   stellar-api ADR-0051). `data:` stays: `@tailwindcss/forms` draws the
 *   `<select>` chevron and three other controls as `data:image/svg+xml`, and a
 *   `data:` image makes no request.
 * - `font-src 'self'`. Every font is bundled, KaTeX's included.
 * - `connect-src 'self'`, plus the Sentry ingest origin when the build has a
 *   DSN, since the SDK posts events there.
 *
 * `style-src … https:` stays open: it carries a member's external stylesheet
 * (ADR-0024). That sheet can no longer pull a remote image or font through
 * it; `img-src` and `font-src` hold regardless of where the CSS came from.
 *
 * `frame-ancestors` cannot be set through `<meta>`; it needs a response header.
 */

/** The origin a Sentry DSN posts to, or null when there is no DSN. */
const sentryOrigin = (dsn) => {
  if (!dsn) return null;
  // Fail the build rather than ship a policy that silently drops every event.
  const url = new URL(dsn);
  if (url.protocol !== 'https:')
    throw new Error(`SENTRY_DSN must be an https URL: ${url.protocol}`);
  return url.origin;
};

/** The policy, as the `content` of the CSP `<meta>`. */
const buildCsp = ({ sentryDsn } = {}) => {
  const sentry = sentryOrigin(sentryDsn);
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data:",
    "font-src 'self'",
    ['connect-src', "'self'", sentry].filter(Boolean).join(' '),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

module.exports = { buildCsp, sentryOrigin };
