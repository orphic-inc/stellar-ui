# ADR-0003: Stylesheet-injection boundary (UI half)

**Status:** Accepted (2026-06-25). Records the UI realization of stellar-api [ADR-0003](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0003-stylesheet-injection-isolation.md), shipped in [#73](https://github.com/orphic-inc/stellar-ui/issues/73).
**Date:** 2026-06-25
**Repos:** orphic-inc/stellar-ui
**Relates:** stellar-api ADR-0003 (the platform decision + its 2026-06-23 amendment dropping chrome isolation); stellar-api PRD-03

---

## Context

stellar-ui injects user-controlled theming site-wide: a member's `externalStylesheet` URL (and, later, adopted author CSS) is applied to the real DOM via `StylesheetInjector`. That is a trust boundary. The platform decision (stellar-api ADR-0003) settled, after its 2026-06-23 amendment, that the **only** boundary is code injection (XSS / exfiltration) — visual override of app chrome is explicitly _not_ defended, because maximal theming freedom is the feature and CSS cannot enforce a chrome lock against `!important` anyway.

That decision assigns the UI a specific, narrow job. This ADR records how the UI holds its half so a future change doesn't silently widen the surface.

## Decision

The injector stays a **plain `<link href>`** for URL themes, and the boundary is held by scheme-gating plus a Content-Security-Policy — never by trying to sanitize or lock the cascade in the UI.

- **`StylesheetInjector` injects a `<link rel="stylesheet" href>`**, not inline CSS text. The browser treats `href` as a URL, never as CSS source, so the element itself carries no CSS-injection surface.
- **Scheme gate.** The user-controlled external URL is admitted only if its protocol is `http:` or `https:` (`isInjectableUrl`). No `javascript:`, `data:`, or other exotic schemes.
  - **Amended 2026-10-02 (#195):** the gate admits `https:` only, as `isInjectableUrl` does. stellar-api stores only `https` URLs (ADR-0024 §3), and an `http` sheet would be blocked as mixed content anyway.
- **No chrome lock.** Per the amendment, the UI does **not** render `@layer` chrome guards or `all: revert` reset containers. Themes may restyle anything; that is intended.
- **CSP is the execution gate.** Production builds ship a CSP (via HtmlWebpackPlugin) that is permissive on resource axes (`style-src`/`img-src`/`font-src`/`connect-src`, to keep theming freedom) but strict on execution (`script-src 'self'`, `object-src 'none'`, `base-uri`/`form-action 'self'`). The CSP, not the injector, is the execution backstop.
  - **Amended by #402 (stellar-api#457):** `img-src`, `font-src` and `connect-src` are now closed to `'self'` (plus `data:` images, and the Sentry ingest origin). Only `style-src` stays open, for a member's external stylesheet, and that sheet can no longer pull a remote image or font. The policy and its reasons are in `webpack.csp.js`.
  - **Amended 2026-10-02 (#195):** this bullet first called the CSP "the real XSS/exfiltration backstop". stellar-api [ADR-0031 §6](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0031-injected-css-threat-model.md) replaced that claim: the CSP is a partial backstop, and is described that way here. It blocks script execution and closes the image and font axes. It leaves `style-src` open to `https:`, so it does not cover everything a stylesheet can do.
- **Author raw CSS (when adopted) arrives pre-sanitized.** `AuthorStylesheet.source` is sanitized at store time on the API (`lib/cssSanitize.ts`); the UI injects it as already-clean `<style>`. The UI does not re-sanitize and must not treat unsanitized source as safe.
  - **Amended 2026-10-02 (#195):** stellar-api's ADR-0031 replaced the sanitizer with `lib/cssValidate.ts`, which rejects a sheet that breaks its rules and stores an accepted one verbatim. An adopted sheet reaches the UI as a `<link>` to `/api/stylesheet/author-stylesheet/<id>/css` (ADR-0024 §1), the same as an external URL, not as inline `<style>` text.

## Consequences

- A defense-in-depth posture: a bypass must defeat both the store-time sanitizer (API) and the inject-time CSP (UI). The injector's `<link>`/scheme-gate shape adds no new execution surface.
- Anyone extending the injector (e.g. wiring up author-stylesheet adoption, [#108](https://github.com/orphic-inc/stellar-ui/issues/108)) must keep raw CSS on the already-sanitized path and must not reintroduce a chrome-lock illusion — the boundary is code-injection only.
- `frame-ancestors` needs a response header rather than a `<meta>` CSP and is tracked separately from this UI boundary.
