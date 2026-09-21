import type { ErrorEvent, EventHint } from '@sentry/react';
import type { AuthUser } from '../../types';
import {
  scrubUrls,
  sentryBeforeSend,
  sentryUserFromAuthUser
} from '../../utils/sentry';

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

/**
 * #361. Two routes here carry a credential in the query string:
 * `/recovery?token=` (a password-reset token — account takeover) and
 * `/register?inviteKey=`. Sentry attaches URLs to four places by default.
 */
describe('scrubUrls', () => {
  /** `ErrorEvent` requires `type`, so a bare literal cannot be asserted to it. */
  const errorEvent = (over: Partial<ErrorEvent>): ErrorEvent => ({
    event_id: 'e',
    type: undefined,
    ...over
  });

  it('strips the query from the current page URL', () => {
    const e = errorEvent({
      request: { url: 'https://site/recovery?token=SECRET' }
    });

    expect(scrubUrls(e).request?.url).toBe('https://site/recovery');
  });

  // document.referrer is the page BEFORE this one, so a credential outlives
  // the page that held it: register, land on the homepage, throw there.
  it('strips the query from the Referer header', () => {
    const e = errorEvent({
      request: {
        url: 'https://site/',
        headers: {
          Referer: 'https://site/register?inviteKey=SECRET',
          'User-Agent': 'jest'
        }
      }
    });

    const { headers } = scrubUrls(e).request ?? {};
    expect(headers?.Referer).toBe('https://site/register');
    expect(headers?.['User-Agent']).toBe('jest');
  });

  it('strips the query from navigation and network breadcrumbs', () => {
    const e = errorEvent({
      breadcrumbs: [
        {
          category: 'navigation',
          data: { from: '/register?inviteKey=SECRET', to: '/?welcome=1' }
        },
        { category: 'fetch', data: { url: '/api/feeds/mine.xml?token=SECRET' } }
      ]
    });

    const [nav, net] = scrubUrls(e).breadcrumbs ?? [];
    expect(nav.data).toEqual({ from: '/register', to: '/' });
    expect(net.data).toEqual({ url: '/api/feeds/mine.xml' });
  });

  it('leaves a URL with no query alone, fragment included', () => {
    const e = errorEvent({
      request: { url: 'https://site/' },
      breadcrumbs: [{ category: 'navigation', data: { to: '/#news-5' } }]
    });

    const out = scrubUrls(e);
    expect(out.request?.url).toBe('https://site/');
    expect(out.breadcrumbs?.[0].data?.to).toBe('/#news-5');
  });

  // A string operation, not `new URL()`, which throws on a relative URL.
  it('handles relative URLs and an event carrying neither field', () => {
    expect(
      scrubUrls(errorEvent({ breadcrumbs: [{ data: { from: '/a?x=1' } }] }))
        .breadcrumbs?.[0].data?.from
    ).toBe('/a');
    expect(() => scrubUrls(errorEvent({}))).not.toThrow();
  });

  it('returns the same object, so beforeSend hands back what it was given', () => {
    const e = errorEvent({ request: { url: 'https://site/x?a=1' } });
    expect(scrubUrls(e)).toBe(e);
  });
});

describe('sentryBeforeSend scrubs before sending', () => {
  it('strips credentials from an error it keeps', () => {
    const e: ErrorEvent = {
      event_id: 'e',
      type: undefined,
      request: { url: 'https://site/recovery?token=SECRET' }
    };
    const hint = { originalException: new TypeError('boom') } as EventHint;

    expect(sentryBeforeSend(e, hint)?.request?.url).toBe(
      'https://site/recovery'
    );
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
