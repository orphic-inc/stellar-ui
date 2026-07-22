// Mirror of the API's authoritative BBCode sanitize allowlist (stellar-api
// src/lib/bbcode/sanitizeConfig.ts, #398 Q15). The API sanitizes `bodyHtml`
// server-side before it ships (belt); this is the second net applied on inject
// (suspenders). The two allowlists are kept in sync by hand — the API is
// authoritative and bbcodeSanitize.test.ts pins this set so drift is caught.

// KaTeX (#403) emits MathML for accessibility, HTML spans for visual layout,
// and a little inline SVG for radicals/delimiters/accents. These tag/attr lists
// mirror the API's KATEX_* groups verbatim; keeping them enumerated (not a full
// MathML/SVG profile) keeps the base allowlist narrow — only the KaTeX surface
// is added. Without these the defense-in-depth sanitize would strip the math
// back out on inject.
const KATEX_MATHML_TAGS = [
  'math',
  'semantics',
  'annotation',
  'mrow',
  'mi',
  'mo',
  'mn',
  'ms',
  'mtext',
  'mspace',
  'msup',
  'msub',
  'msubsup',
  'mfrac',
  'msqrt',
  'mroot',
  'mover',
  'munder',
  'munderover',
  'mmultiscripts',
  'mprescripts',
  'none',
  'mtable',
  'mtr',
  'mtd',
  'mpadded',
  'mphantom',
  'menclose',
  'mstyle',
  'merror'
];
const KATEX_SVG_TAGS = ['svg', 'path', 'line', 'rect', 'g'];
const KATEX_ATTR = [
  'xmlns',
  'encoding',
  'aria-hidden',
  'title',
  'mathvariant',
  'mathcolor',
  'displaystyle',
  'scriptlevel',
  'stretchy',
  'fence',
  'accent',
  'accentunder',
  'notation',
  'linethickness',
  'columnalign',
  'columnspacing',
  'rowspacing',
  'width',
  'height',
  'viewBox',
  'preserveAspectRatio',
  'd',
  'fill',
  'stroke',
  'stroke-width',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2'
];

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
  'img',
  ...KATEX_MATHML_TAGS,
  ...KATEX_SVG_TAGS
];

export const BBCODE_ALLOWED_ATTR = [
  'href',
  'class',
  'style',
  'rel',
  'target',
  'src',
  'alt',
  ...KATEX_ATTR
];
