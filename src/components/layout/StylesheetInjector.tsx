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
// user-controlled external URL — http(s) sheets only, nothing exotic.
const isInjectableUrl = (raw: string): boolean => {
  try {
    const { protocol } = new URL(raw, window.location.origin);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const StylesheetInjector = () => {
  const { data: profile } = useGetMyProfileQuery();
  const { data: stylesheets } = useGetStylesheetsQuery();

  const siteAppearance = profile?.userSettings?.siteAppearance;
  const externalStylesheet = profile?.userSettings?.externalStylesheet;

  const href: string | null = (() => {
    if (externalStylesheet) {
      return isInjectableUrl(externalStylesheet) ? externalStylesheet : null;
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
