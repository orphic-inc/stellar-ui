import { useSyncExternalStore } from 'react';

/**
 * The theme recovery hatch (#449). `?notheme=1` keeps every member theme off in
 * this tab, so a member can always reach Settings even when a stylesheet hides
 * every control on the page (stellar-api ADR-0032 §7). It lasts until the tab
 * closes or the banner turns themes back on.
 *
 * Keep the key and parameter in sync with src/preapply-theme.js, which reads
 * them before React mounts.
 */
const STORAGE_KEY = 'stellar-notheme';
const PARAM = /(?:^|[?&])notheme=1(?:&|$)/;

export const hasNoThemeParam = (search: string): boolean => PARAM.test(search);

const stored = (): boolean => {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

// The page's own URL counts even when storage refuses the flag.
let off: boolean | null = null;
const listeners = new Set<() => void>();

const current = (): boolean => {
  if (off === null) off = hasNoThemeParam(window.location.search) || stored();
  return off;
};

export const setThemesOff = (value: boolean): void => {
  off = value;
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, '1');
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage refused: the flag still holds for this page load.
  }
  listeners.forEach((notify) => notify());
};

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

/** Whether member themes are off in this tab. */
export const useThemesOff = (): boolean =>
  useSyncExternalStore(subscribe, current);

/** Test-only: forget the cached flag so the next read starts fresh. */
export const __resetThemeHatch = (): void => {
  off = null;
};
