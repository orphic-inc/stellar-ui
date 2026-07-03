import { useEffect } from 'react';
import { useGetMyProfileQuery } from '../../store/services/profileApi';
import { useGetStylesheetsQuery } from '../../store/services/siteApi';

const LINK_ID = 'stellar-theme';

// A theme may restyle anything it likes — visual freedom is the point (ADR-0003).
// The only boundary is code injection, which is held elsewhere: author CSS is
// sanitized at store time on the API (lib/cssSanitize.ts) and the app-wide CSP
// (index.html) blocks script execution + exfiltration. So the injector stays a
// plain <link href>: the browser treats href as a URL, never as CSS text, so it
// carries no CSS-injection surface. We only gate the *scheme* of the
// user-controlled external URL — https only (ADR-0024 §3: the API stores only
// https URLs, the prod CSP style-src is https-scoped, and http would mixed-
// content-block anyway; allowing it here would read like a promise we can't keep).
const isInjectableUrl = (raw: string): boolean => {
  try {
    return new URL(raw, window.location.origin).protocol === 'https:';
  } catch {
    return false;
  }
};

// The API delivers an adopted registry stylesheet as text/css from this route
// (ADR-0024 §1). Same-origin, so the auth cookie rides the browser's <link>
// request; the UI dev server proxies /api. Linked exactly like a Personal URL —
// href, never CSS text — so it adds no injection surface over the external case.
const registryCssHref = (id: number): string =>
  `/api/stylesheet/author-stylesheet/${id}/css`;

const StylesheetInjector = () => {
  const { data: profile } = useGetMyProfileQuery();
  const { data: stylesheets } = useGetStylesheetsQuery();

  const siteAppearance = profile?.userSettings?.siteAppearance;
  const externalStylesheet = profile?.userSettings?.externalStylesheet;
  const activeAuthorStylesheetId =
    profile?.userSettings?.activeAuthorStylesheetId;

  // Single-winner precedence (ADR-0024 §4) — the Site Stylesheet slot's explicit
  // source, then the built-in fallback, then Sublime. No stacking: the slot is
  // Personal XOR Registry (the API enforces that), so at most one of the first
  // two branches is ever populated.
  const href: string | null = (() => {
    if (externalStylesheet) {
      return isInjectableUrl(externalStylesheet) ? externalStylesheet : null;
    }
    if (activeAuthorStylesheetId != null) {
      return registryCssHref(activeAuthorStylesheetId);
    }
    if (!siteAppearance || !stylesheets) return null;
    const match = stylesheets.find((s) => s.name === siteAppearance);
    if (!match) return null;
    // Sublime has an empty stylesheet — no link needed
    if (siteAppearance === 'sublime') return null;
    return match.cssUrl;
  })();

  useEffect(() => {
    const existing = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!href) {
      existing?.remove();
      return;
    }
    if (existing) {
      existing.href = href;
      return;
    }
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);

    return () => {
      document.getElementById(LINK_ID)?.remove();
    };
  }, [href]);

  return null;
};

export default StylesheetInjector;
