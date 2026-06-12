import type { ErrorEvent, EventHint } from '@sentry/react';
import type { AuthUser } from '../../types';
import { sentryBeforeSend, sentryUserFromAuthUser } from '../../utils/sentry';

const event = { event_id: 'e' } as ErrorEvent;

describe('sentryBeforeSend', () => {
  it('drops benign ResizeObserver loop errors', () => {
    const hint = {
      originalException: new Error(
        'ResizeObserver loop completed with undelivered notifications.'
      )
    };
    expect(sentryBeforeSend(event, hint as EventHint)).toBeNull();
  });

  it('drops aborted/cancelled requests (AbortError)', () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    expect(
      sentryBeforeSend(event, { originalException: err } as EventHint)
    ).toBeNull();
  });

  it('keeps real application errors', () => {
    const err = new TypeError('cannot read properties of undefined');
    expect(
      sentryBeforeSend(event, { originalException: err } as EventHint)
    ).toBe(event);
  });
});

describe('sentryUserFromAuthUser', () => {
  it('maps an authenticated user to a Sentry payload (no PII beyond username)', () => {
    const user = {
      id: 7,
      username: 'kai',
      userRank: { level: 100, name: 'User', color: '#fff' }
    } as AuthUser;
    expect(sentryUserFromAuthUser(user)).toEqual({
      id: '7',
      username: 'kai',
      userRankLevel: 100
    });
  });

  it('returns null when logged out', () => {
    expect(sentryUserFromAuthUser(null)).toBeNull();
  });
});
