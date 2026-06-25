import React from 'react';
import { Link } from 'react-router-dom';

// Renders a verbatim rule body (PRD-09 / ADR-0020): the stored text carries
// `${...}` tokens and a small markdown subset, and `GET /api/rules/tree` ships a
// resolved token→value `variables` map alongside it. The API single-sources the
// *values*; the UI owns *presentation* — so a token whose value is a path/URL is
// rendered as a real link, a text-valued token substitutes in place, and the
// link text for a bare token comes from the UI label map below.

// Human labels for bare route/URL tokens (e.g. `${irc}` → "IRC"). Only the
// visible text lives here; the href always comes from the API `variables` map.
// A token missing from this map falls back to a humanized form of its name.
const TOKEN_LABELS: Record<string, string> = {
  irc: 'IRC',
  staffpm: 'Staff PM',
  public_kb: 'Knowledge Base',
  interview_article: 'IRC Interview',
  vpns_article: 'VPNs',
  ips_article: 'IP addresses',
  autofp_article: 'autosnatching',
  bugs_article: 'bug-reporting policy',
  exploit_article: 'exploits',
  invite_article: 'Invites',
  classes_article: 'user classes',
  requests_article: 'requests',
  interfaces_article: 'interfaces',
  bugs_forum: 'Bugs Forum'
};

const linkClass = 'text-indigo-400 hover:text-indigo-300';

const isExternal = (href: string): boolean => /^https?:\/\//.test(href);
// A resolved value is a link when it's an absolute URL or an app route; anything
// else (e.g. "Stellar", "#disabled") is a text token and substitutes in place.
const isLinkValue = (value: string): boolean =>
  isExternal(value) || value.startsWith('/');

const humanize = (token: string): string => token.replace(/_/g, ' ');

const renderLink = (
  href: string,
  label: React.ReactNode,
  key: string
): React.ReactNode =>
  isExternal(href) ? (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {label}
    </a>
  ) : (
    <Link key={key} to={href} className={linkClass}>
      {label}
    </Link>
  );

// Markdown-link | bold | italic | bare-token, scanned in document order. A fresh
// instance is created per call because renderRuleText recurses (link labels and
// bold/italic spans may themselves contain tokens) and a shared global regex
// would corrupt the outer scan's lastIndex.
const INLINE_SOURCE =
  /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|_([^_]+)_|\$\{([a-z_]+)\}/.source;
const TOKEN_TARGET_RE = /^\$\{([a-z_]+)\}$/;

export const renderRuleText = (
  text: string,
  variables: Record<string, string>
): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const re = new RegExp(INLINE_SOURCE, 'g');
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `n${i++}`;
    const [, linkLabel, linkTarget, bold, italic, token] = m;
    if (linkLabel !== undefined) {
      const tm = linkTarget.match(TOKEN_TARGET_RE);
      const href = tm ? (variables[tm[1]] ?? '#') : linkTarget;
      nodes.push(renderLink(href, renderRuleText(linkLabel, variables), key));
    } else if (bold !== undefined) {
      nodes.push(<strong key={key}>{renderRuleText(bold, variables)}</strong>);
    } else if (italic !== undefined) {
      nodes.push(<em key={key}>{renderRuleText(italic, variables)}</em>);
    } else if (token !== undefined) {
      const value = variables[token];
      if (value === undefined) {
        nodes.push(`\${${token}}`); // unresolved — surface the literal token
      } else if (isLinkValue(value)) {
        nodes.push(
          renderLink(value, TOKEN_LABELS[token] ?? humanize(token), key)
        );
      } else {
        nodes.push(value);
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};
