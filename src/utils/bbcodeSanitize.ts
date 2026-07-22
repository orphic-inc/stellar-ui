// Mirror of the API's authoritative BBCode sanitize allowlist (stellar-api
// src/lib/bbcode/sanitizeConfig.ts, #398 Q15). The API sanitizes `bodyHtml`
// server-side before it ships (belt); this is the second net applied on inject
// (suspenders). The two allowlists are kept in sync by hand — the API is
// authoritative and bbcodeSanitize.test.ts pins this set so drift is caught.
export const BBCODE_ALLOWED_TAGS = [
  'strong',
  'em',
  'u',
  's',
  'span',
  'div',
  'a',
  'br',
  'blockquote',
  'cite',
  'details',
  'summary',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'img'
];

export const BBCODE_ALLOWED_ATTR = [
  'href',
  'class',
  'style',
  'rel',
  'target',
  'src',
  'alt'
];
