import { useCallback, useEffect, useRef } from 'react';
import { useGetMyProfileQuery } from '../../store/services/profileApi';
import { useGetStylesheetsQuery } from '../../store/services/siteApi';

const LINK_ID = 'stellar-theme';
// Keep in sync with src/preapply-theme.js, which pre-applies this key's value
// before React mounts to avoid a cold-load FOUC (ADR-0024 §4).
const STORAGE_KEY = 'stellar-theme-href';

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

// How long PrivateLayout may hold its spinner for the theme (#161). Long enough
// for a same-origin sheet on a slow connection, short enough that a hung
// external host does not read as a broken site. The link is kept past it, so a
// late theme still lands.
export const THEME_GATE_TIMEOUT_MS = 3000;

// Calls `done` once the sheet loads or fails. For a link whose href has just
// been set: any `sheet` it already carries is the previous one's.
const waitForLoad = (link: HTMLLinkElement, done: () => void): (() => void) => {
  link.addEventListener('load', done);
  link.addEventListener('error', done);
  return () => {
    link.removeEventListener('load', done);
    link.removeEventListener('error', done);
  };
};

// The same, but done at once when the sheet is already in. A script-added
// <link> does not block paint, so "ready" has to be the sheet itself, not its
// href. `sheet` is already set when preapply-theme.js's parser-blocking link
// finished before React mounted.
const whenSettled = (link: HTMLLinkElement, done: () => void): (() => void) => {
  if (link.sheet) {
    done();
    return () => {};
  }
  return waitForLoad(link, done);
};

interface Props {
  /**
   * Called once, when the member's theme is on screen or will not be: its
   * sheet loaded or failed, they have none, or THEME_GATE_TIMEOUT_MS passed.
   * PrivateLayout holds its spinner until then (#161). Never called again.
   */
  onReady?: () => void;
}

const StylesheetInjector = ({ onReady }: Props) => {
  const { data: profile } = useGetMyProfileQuery();
  const { data: stylesheets } = useGetStylesheetsQuery();

  // The latest callback, without making the effects below restart on a new one.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  const readyRef = useRef(false);
  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReadyRef.current?.();
  }, []);

  // A return visit: preapply-theme.js linked the stored href before mount, so
  // the gate can open on that sheet without waiting for the profile. If the
  // member changed theme elsewhere, the effect below swaps it in place later.
  useEffect(() => {
    const preApplied = document.getElementById(
      LINK_ID
    ) as HTMLLinkElement | null;
    const stopWaiting = preApplied ? whenSettled(preApplied, markReady) : null;
    const timer = window.setTimeout(markReady, THEME_GATE_TIMEOUT_MS);
    return () => {
      stopWaiting?.();
      window.clearTimeout(timer);
    };
  }, [markReady]);

  const siteAppearance = profile?.userSettings?.siteAppearance;
  const externalStylesheet = profile?.userSettings?.externalStylesheet;
  const activeAuthorStylesheetId =
    profile?.userSettings?.activeAuthorStylesheetId;

  // Single-winner precedence (ADR-0024 §4) — the Site Stylesheet slot's explicit
  // source, then the selected registry row. No stacking: the slot is Personal
  // XOR Registry (the API enforces that), so at most one of the first two
  // branches is ever populated.
  //
  // Sublime is not special here (#196): it resolves through the registry like
  // any other row and renders nothing because its `cssUrl` is null, not because
  // the client recognises the name. Matching on the name would also force the
  // API's registry guard to carry a carve-out, and a carve-out is where the next
  // unreachable theme hides.
  //
  // `undefined` is a distinct "not resolved yet" state from `null` ("resolved:
  // no theme") — profile/stylesheets are momentarily undefined on cold mount,
  // before either query has returned. Collapsing that into `null` would make
  // the effect below tear down the pre-applied link (src/preapply-theme.js)
  // before the real answer arrives, reintroducing the FOUC it exists to avoid.
  const href: string | null | undefined = (() => {
    if (profile === undefined) return undefined;
    if (externalStylesheet) {
      return isInjectableUrl(externalStylesheet) ? externalStylesheet : null;
    }
    if (activeAuthorStylesheetId != null) {
      return registryCssHref(activeAuthorStylesheetId);
    }
    if (!siteAppearance) return null;
    if (stylesheets === undefined) return undefined;
    const match = stylesheets.find((s) => s.name === siteAppearance);
    return match ? match.cssUrl : null;
  })();

  useEffect(() => {
    if (href === undefined) return;

    const existing = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!href) {
      existing?.remove();
      window.localStorage.removeItem(STORAGE_KEY);
      markReady();
      return;
    }
    if (existing) {
      const unchanged = existing.getAttribute('href') === href;
      existing.href = href;
      window.localStorage.setItem(STORAGE_KEY, href);
      // A changed href reloads the sheet, so the old one no longer counts.
      if (unchanged) return whenSettled(existing, markReady);
      return waitForLoad(existing, markReady);
    }
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
    window.localStorage.setItem(STORAGE_KEY, href);
    const stopWaiting = waitForLoad(link, markReady);
    // No unmount cleanup here on purpose: this is a singleton that outlives
    // every render, and registering one would remove+recreate the <link> on
    // every href change instead of mutating it in place like the adopt branch
    // above — a churn asymmetry between "started from an adopted link" and
    // "started from one we created" that's otherwise invisible but needless.
    // Removing the readiness listeners is not that: the link itself stays.
    return stopWaiting;
  }, [href, markReady]);

  // Unmount-only, unlike the effect above, so it adds none of that churn. The
  // injector lives in PrivateLayout, so unmounting means leaving the session
  // (Logout, or a 401 that sends the member to /login), and the theme goes with
  // it (#379). Kept, it styled the public pages, and its stored href was
  // pre-applied on the next cold load, where a registry sheet 401s. The next
  // login then resolved the SAME href and assigned it in place, which does not
  // refetch, so the empty sheet stayed until a reload.
  useEffect(
    () => () => {
      document.getElementById(LINK_ID)?.remove();
      window.localStorage.removeItem(STORAGE_KEY);
    },
    []
  );

  return null;
};

export default StylesheetInjector;
