import {
  BBCODE_ALLOWED_TAGS,
  BBCODE_ALLOWED_ATTR
} from '../../utils/bbcodeSanitize';

// This allowlist MUST match the API's authoritative set in
// stellar-api src/lib/bbcode/sanitizeConfig.ts (#398 Q15). The API is the
// source of truth; this test pins the mirror so any drift on either side is a
// failing test rather than silent under- or over-sanitization on inject.
describe('BBCode sanitize allowlist (mirror of the API)', () => {
  it('pins the allowed tag set exactly', () => {
    expect([...BBCODE_ALLOWED_TAGS].sort()).toEqual(
      [
        'a',
        'blockquote',
        'br',
        'cite',
        'code',
        'details',
        'div',
        'em',
        'h2',
        'h3',
        'h4',
        'img',
        'li',
        'ol',
        'pre',
        's',
        'span',
        'strong',
        'summary',
        'u',
        'ul'
      ].sort()
    );
  });

  it('pins the allowed attribute set exactly', () => {
    expect([...BBCODE_ALLOWED_ATTR].sort()).toEqual(
      ['alt', 'class', 'href', 'rel', 'src', 'style', 'target'].sort()
    );
  });
});
