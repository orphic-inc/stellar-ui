import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  hasNoThemeParam,
  setThemesOff,
  useThemesOff
} from '../../utils/themeHatch';

/**
 * Says the tab is unthemed, and turns themes back on (#449). No member theme is
 * loaded while it shows, so no theme can hide it. It also catches `?notheme=1`
 * arriving by an in-app link, such as a staff reply opened inside the site.
 */
const ThemesOffBanner = () => {
  const { search } = useLocation();
  const off = useThemesOff();

  useEffect(() => {
    if (hasNoThemeParam(search)) setThemesOff(true);
  }, [search]);

  if (!off) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 border-b border-[color-mix(in_oklch,var(--st-warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--st-warning)_12%,transparent)] px-4 py-2 text-sm text-[var(--st-warning)]"
    >
      <span>
        Member themes are off in this tab, so the site shows its plain look.
      </span>
      <button
        type="button"
        onClick={() => setThemesOff(false)}
        className="shrink-0 underline hover:text-[var(--st-text-strong)] transition-colors text-xs"
      >
        Turn themes back on
      </button>
    </div>
  );
};

export default ThemesOffBanner;
