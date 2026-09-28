# ADR-0011: The image serves the bundle from a snippet stellar-compose includes

**Status:** Accepted (2026-09-28). Decided in the grill of stellar-compose [#58](https://github.com/orphic-inc/stellar-compose/issues/58); built in [#400](https://github.com/orphic-inc/stellar-ui/issues/400).
**Date:** 2026-09-28
**Repos:** orphic-inc/stellar-ui, orphic-inc/stellar-compose
**Relates:** stellar-api [ADR-0027 — the publish vs deploy boundary](https://github.com/orphic-inc/stellar-api/blob/main/docs/adr/0027-publish-vs-deploy-boundary.md) · stellar-compose [#59](https://github.com/orphic-inc/stellar-compose/pull/59), [#61](https://github.com/orphic-inc/stellar-compose/pull/61)

---

## Context

This image served the bundle from a `server` block in `conf.d/default.conf`, which set gzip, etag and the SPA `try_files`.

stellar-compose serves the same image behind its own proxy. It mounted a whole `nginx.conf` of its own over the image's, in a plain and a TLS variant, each carrying a hand-copied `location /` and the `/api/` proxy. Neither variant included `conf.d/`, so **none of this repo's serving config ran in a compose deploy**:

- There was no gzip.
- The `try_files` was a shorter one copied by hand.
- The two compose copies had drifted from each other twice. The TLS variant proxied to the wrong api port (compose#59). It also lacked `include mime.types`, so it served the CSS as `text/plain`, which browsers refuse (compose#61).

So three files described how the bundle is served, and only the least complete of them ran in production.

## Decision

**stellar-ui owns how the bundle is served; stellar-compose owns routing and TLS.** The boundary is one file, `/etc/nginx/snippets/stellar-ui.conf`, built from `nginx/stellar-ui.conf`:

- This image's `default.conf` is `server { listen 80; include /etc/nginx/snippets/stellar-ui.conf; }`, so the image run on its own behaves as before.
- stellar-compose replaces that `default.conf` with its own server blocks, plain or TLS. Each `include`s the snippet beside its `/api/` block. It no longer replaces the image's `nginx.conf`.

### The contract

The snippet states these rules in its header. Both repos rely on them:

1. **Server context.** The snippet has no `listen` and no `server_name`; the including server owns those.
2. **It holds the only `location /`.** An including server adds its own locations beside it and never defines `location /`.
3. **No `add_header`.** nginx drops every inherited `add_header` in a block that declares its own. One here would silently remove compose's TLS `Strict-Transport-Security` header from every bundle response. stellar-compose's TLS smoke asserts that header, so a violation fails there too.
4. **`mime.types` is in scope.** The image's stock `nginx.conf` includes it, and after this decision neither repo replaces that file.

### What guards it

- **Here:** the `build` job boots the image and asserts:
  - the bundle's CSS arrives as `text/css`;
  - JS arrives gzipped when asked;
  - a deep link (`/communities/1`) falls back to the index.

  Negative controls for each (gzip off, no fallback, `mime.types` out of scope) fail it.

- **In stellar-compose:** the `e2e` job runs the Playwright suite through the plain server and a TLS smoke through the TLS one, against the pinned image.

## Consequences

- A change to how the bundle is served ships in the ui release that needs it, and reaches compose when compose pins that release. compose adopts the snippet only after pinning a ui image that carries it, because its server blocks fail to load without the file.
- **Gzip returns to compose deploys** once compose adopts the snippet.
- **The snippet's path is an interface.** Moving or renaming it breaks every compose deploy that pins the new image, so treat a change to it as breaking, and change compose in the same release.
- compose loses its hard-coded `worker_processes 4` / `worker_connections 4096` and gains the stock file's defaults (`auto` workers, an access log, `sendfile`, keepalive). That is recorded on stellar-compose#58.
