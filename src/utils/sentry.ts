import type {
  ErrorEvent,
  Event as SentryEvent,
  EventHint,
  User
} from '@sentry/react';

// Derived rather than imported: the SDK does not re-export the shapes of these
// two fields, and reading them off `Event` cannot drift from it.
type SentryRequest = NonNullable<SentryEvent['request']>;
type SentryBreadcrumb = NonNullable<SentryEvent['breadcrumbs']>[number];
import type { AuthUser } from '../types';

/**
 * Build Sentry user context from the Redux auth user — answers "who hit this".
 * Returns null when logged out (Sentry treats null as "clear"). Deliberately
 * omits email and other PII; id + username + rank level are enough to triage.
 */
export const sentryUserFromAuthUser = (user: AuthUser | null): User | null => {
  if (!user) return null;
  return {
    id: String(user.id),
    username: user.username,
    userRankLevel: user.userRank.level
  };
};

/**
 * Sentry beforeSend hook: drops benign browser noise so the dashboard reflects
 * real faults — ResizeObserver loop warnings (a harmless quirk) and aborted /
 * cancelled requests (AbortError, e.g. a navigated-away fetch). Real errors
 * pass through.
 */
export const sentryBeforeSend = (
  event: ErrorEvent,
  hint: EventHint
): ErrorEvent | null => {
  const err = hint.originalException;
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : '';
  if (name === 'AbortError') return null;
  if (/ResizeObserver loop/i.test(message)) return null;
  return scrubUrls(event);
};

/**
 * Everything from the first `?` onwards, gone.
 *
 * A string operation and not `new URL()`, which throws on the relative URLs
 * breadcrumbs carry (`parsedFrom.relative`). A URL with no query is returned
 * unchanged, fragment included.
 */
const stripQuery = (url: string): string => url.split('?')[0];

const scrubRequest = (request: SentryRequest): void => {
  if (request.url) request.url = stripQuery(request.url);
  const { headers } = request;
  // `document.referrer` — the page BEFORE this one. A member who registers and
  // lands on the homepage carries `/register?inviteKey=…` into the next error,
  // so scrubbing only `url` misses the credential once it outlives its page.
  if (headers?.Referer) headers.Referer = stripQuery(headers.Referer);
};

/** `navigation` breadcrumbs carry `from`/`to`; `fetch` and `xhr` carry `url`. */
const BREADCRUMB_URL_KEYS = ['url', 'from', 'to'] as const;

const scrubBreadcrumb = (crumb: SentryBreadcrumb): void => {
  const { data } = crumb;
  if (!data) return;
  for (const key of BREADCRUMB_URL_KEYS) {
    if (typeof data[key] === 'string') data[key] = stripQuery(data[key]);
  }
};

/**
 * Strip query strings from every URL an event carries (#361).
 *
 * Two routes here put a credential in the query string — `/recovery?token=`
 * (a password-reset token: account takeover, valid for an hour) and
 * `/register?inviteKey=`. Sentry attaches the full `window.location.href` to
 * every event, the referrer as a header, and URLs to navigation and network
 * breadcrumbs, so an error captured anywhere near either page ships the
 * credential to a third party.
 *
 * stellar-api solved the same class in `lib/sentry.ts`'s `scrubFeedToken`, but
 * by NAME — it had one credential to redact. Naming them here would reproduce
 * the bug this fixes: the gap exists because nobody revisited the scrubber
 * when a second credential-bearing URL appeared, and a third would be missed
 * the same silent way. Query strings here are browse filters and page numbers;
 * the path still says which route an event came from.
 *
 * Mutates and returns the same object, so `beforeSend` keeps returning the
 * event it was handed.
 */
export const scrubUrls = <T extends SentryEvent>(event: T): T => {
  if (event.request) scrubRequest(event.request);
  event.breadcrumbs?.forEach(scrubBreadcrumb);
  return event;
};
