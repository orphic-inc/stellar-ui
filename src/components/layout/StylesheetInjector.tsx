import { useEffect } from 'react';
import { useGetMyProfileQuery } from '../../store/services/profileApi';
import { useGetStylesheetsQuery } from '../../store/services/siteApi';

const LINK_ID = 'stellar-theme';

const StylesheetInjector = () => {
  const { data: profile } = useGetMyProfileQuery();
  const { data: stylesheets } = useGetStylesheetsQuery();

  const siteAppearance = profile?.userSettings?.siteAppearance;
  const externalStylesheet = profile?.userSettings?.externalStylesheet;

  const href: string | null = (() => {
    if (externalStylesheet) return externalStylesheet;
    if (!siteAppearance || !stylesheets) return null;
    const match = stylesheets.find((s) => s.name === siteAppearance);
    if (!match) return null;
    // Sublime has an empty stylesheet — no link needed
    if (siteAppearance === 'sublime') return null;
    return match.cssUrl;
  })();

  useEffect(() => {
    const existing = document.getElementById(LINK_ID);
    if (!href) {
      existing?.remove();
      return;
    }
    if (existing) {
      (existing as HTMLLinkElement).href = href;
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
