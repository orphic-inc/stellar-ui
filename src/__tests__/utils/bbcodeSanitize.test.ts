import {
  BBCODE_ALLOWED_TAGS,
  BBCODE_ALLOWED_ATTR
} from '../../utils/bbcodeSanitize';

// This allowlist MUST match the API's authoritative set in
// stellar-api src/lib/bbcode/sanitizeConfig.ts (#398 Q15, widened for KaTeX in
// #403). The API is the source of truth; this test pins the mirror so any drift
// on either side is a failing test rather than silent under- or
// over-sanitization on inject.
describe('BBCode sanitize allowlist (mirror of the API)', () => {
  it('pins the allowed tag set exactly', () => {
    expect([...BBCODE_ALLOWED_TAGS].sort()).toEqual(
      [
        // Base BBCode surface (#398)
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
        'ul',
        // KaTeX MathML + SVG surface (#403)
        'annotation',
        'g',
        'line',
        'math',
        'menclose',
        'merror',
        'mfrac',
        'mi',
        'mmultiscripts',
        'mn',
        'mo',
        'mover',
        'mpadded',
        'mphantom',
        'mprescripts',
        'mroot',
        'mrow',
        'ms',
        'mspace',
        'msqrt',
        'mstyle',
        'msub',
        'msubsup',
        'msup',
        'mtable',
        'mtd',
        'mtext',
        'mtr',
        'munder',
        'munderover',
        'none',
        'path',
        'rect',
        'semantics',
        'svg'
      ].sort()
    );
  });

  it('pins the allowed attribute set exactly', () => {
    expect([...BBCODE_ALLOWED_ATTR].sort()).toEqual(
      [
        // Base BBCode surface (#398)
        'alt',
        'class',
        'href',
        'rel',
        'src',
        'style',
        'target',
        // KaTeX presentational MathML + SVG attributes (#403)
        'accent',
        'accentunder',
        'aria-hidden',
        'columnalign',
        'columnspacing',
        'd',
        'displaystyle',
        'encoding',
        'fence',
        'fill',
        'height',
        'linethickness',
        'mathcolor',
        'mathvariant',
        'notation',
        'preserveAspectRatio',
        'rowspacing',
        'scriptlevel',
        'stretchy',
        'stroke',
        'stroke-width',
        'title',
        'viewBox',
        'width',
        'x',
        'x1',
        'x2',
        'xmlns',
        'y',
        'y1',
        'y2'
      ].sort()
    );
  });
});
