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
- **No chrome lock.** Per the amendment, the UI does **not** render `@layer` chrome guards or `all: revert` reset containers. Themes may restyle anything; that is intended.
- **CSP is the execution gate.** Production builds ship a CSP (via HtmlWebpackPlugin) that is permissive on resource axes (`style-src`/`img-src`/`font-src`/`connect-src`, to keep theming freedom) but strict on execution (`script-src 'self'`, `object-src 'none'`, `base-uri`/`form-action 'self'`). The CSP — not the injector — is the real XSS/exfiltration backstop.
- **Author raw CSS (when adopted) arrives pre-sanitized.** `AuthorStylesheet.source` is sanitized at store time on the API (`lib/cssSanitize.ts`); the UI injects it as already-clean `<style>`. The UI does not re-sanitize and must not treat unsanitized source as safe.

## Consequences

- A defense-in-depth posture: a bypass must defeat both the store-time sanitizer (API) and the inject-time CSP (UI). The injector's `<link>`/scheme-gate shape adds no new execution surface.
- Anyone extending the injector (e.g. wiring up author-stylesheet adoption, [#108](https://github.com/orphic-inc/stellar-ui/issues/108)) must keep raw CSS on the already-sanitized path and must not reintroduce a chrome-lock illusion — the boundary is code-injection only.
- `frame-ancestors` needs a response header rather than a `<meta>` CSP and is tracked separately from this UI boundary.
