import type { ErrorEvent, EventHint, User } from '@sentry/react';
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
  return event;
};
