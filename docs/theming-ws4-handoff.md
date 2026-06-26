# WS4 Handoff — per-surface migration

Runbook for continuing the injected-theme migration (Epic [#127], ADR-0005,
`docs/theming.md`). WS0–WS3 are done and live-verified; **WS4 is the bulk work**:
move each remaining surface's look out of inline Tailwind utilities into the
`data-st` Role/Part hooks, so themes reskin it from tokens alone.

## Where things stand

| WS | What | State | Issue |
|----|------|-------|-------|
| WS0 | Wire `global.css` into the build (unlayered cascade) | ✅ done | [#123] |
| WS1 | Finalize Tier-1 Roles + re-sort `global.css` | ✅ done | [#124] |
| WS2 | Collage pilot — `CollageDetail` from Roles/Parts | ✅ done | [#125] |
| WS3 | Token-only reference theme (Layer Cake) + author guide | ✅ done | [#126] |
| — | Edition disclosure | ⛔ blocked on stellar-api | [#129] |
| **WS4+** | **Per-surface migration** | **⬜ this handoff** | — |

Foundation in place: the contract (`src/stylesheets/common/global.css`) is
imported and live; `CollageDetail.tsx` is the **worked example** of a migrated
surface; Layer Cake (`src/stylesheets/layer-cake/style.css`) is a token-only
theme that reskins any hooked surface. The package branch is
`feat/theming-ws3-token-theme` (WS0→WS3 stacked off the merged contract).

## The contract you're migrating *to*

Tier-1 Roles (paint from tokens; §3.2): `panel` `colhead` `list` `row` `title`
`meta` `chip` `icon` `rollup` `bar`. Tier-2 Parts (§3.3): `edition-*` (unwired,
[#129]) and `coverart-*`. Modifiers are boolean `data-st-*` attributes:
`data-st-open`, `data-st-lead`, `data-st-selected`, `data-st-em`, `data-st-num`,
`data-st-lossless`. Full token catalogue: `docs/theming.md` §3.1.

## Migration order (§7) — do high-leverage first

1. **High-reuse listings** — community release listing, search results, forum
   topic/post lists. Max leverage: they share `panel`/`list`/`row`/`colhead`.
2. **Profile** surfaces.
3. **App chrome** — Navbar, Sidebar, UserMenu.
4. **Long tail** — admin/staff pages last (least theme-facing).

One surface (or one tight cluster) per branch/PR. Title PRs `Theming WS4: <surface>`.

## The conversion pattern (from `CollageDetail.tsx`)

For each surface, move **color/border/background** utilities onto hooks; **keep
layout** utilities (flex, grid, spacing, sizing). Mechanical mapping:

| Was (Tailwind) | Becomes |
|---|---|
| `div.bg-gray-900.border.rounded-lg` (card) | `data-st="panel"` |
| `div.bg-gray-800…uppercase` (section header) | `data-st="colhead"` |
| a vertical stack of records | `data-st="list"` of `data-st="row"` |
| a row's primary label / click target | `data-st="title"` |
| secondary/muted field | `data-st="meta"` (+ `data-st-em` italic, `data-st-num` tabular) |
| a tag / format / flag token | `data-st="chip"` (+ `data-st-mono`, `data-st-selected`) |
| a proportional fill (weight/progress) | `data-st="bar"` (set `--st-w` 0–100) |
| an aggregate label+count list | `data-st="rollup"` |

## Gotchas (learned in WS1–WS3 — read before starting)

- **`title` carries `flex:1`** (fills a horizontal `row`). For a *stacked*
  title-over-subtitle cell, wrap `title`+`meta` in a `flex-1 min-w-0` **block**
  div — the `flex:1` goes inert in a block parent and the original two-line
  layout is preserved. (CollageDetail entry rows do exactly this.)
- **`icon` is a 20px glyph slot** (category sprite), **not** a cover thumbnail.
  Leave real thumbnails as plain `<img>` with their sizing utilities.
- **Drop inline `hover:` paint** where a Role provides it (`row` has its own
  hover). Keep transient JS-state highlights (e.g. scroll-to highlight).
- **`colhead` unifies headers** to one uppercase style. Converting makes
  previously-inconsistent headers consistent — that's the contract working, not
  a regression. Expect it.
- **Boolean modifiers in JSX:** `data-st-lead={cond ? '' : undefined}` (empty
  string renders the attr; `undefined` omits it). CSS matches `[data-st-lead]`.
- **`--st-w` custom property:** `style={{ '--st-w': n } as CSSProperties}`
  (`import { type CSSProperties } from 'react'`).
- **Rules of hooks:** any derived `useMemo` (e.g. contributor weights) goes
  **above** the loading/error early-returns, guarding on optional data inside.
- **Theme authors** only redefine the *primitive* tokens; derived tokens
  (`--st-lossy/weight/weight-track`) follow via `var()` (see Layer Cake).

## Verification recipe (per surface)

1. Gate: `npm run format` → `npm run lint` → `npx tsc --noEmit` →
   `npm test -- --no-coverage`. Existing tests query by **role/text**, so
   preserving rendered text/links/controls keeps them green. Add: hooks-present
   assertions + any new derived UI.
2. `npm run build` — compiles; grep the bundle to confirm the surface's hooks
   resolve unlayered.
3. **Live (the real check)** — dev server on `:9000`, login `i@korin.pink` /
   `password`. Switch appearance to **Layer Cake** (Settings → Appearance), open
   the migrated surface, and confirm via devtools / `browser_evaluate`:
   - computed `--st-panel` ≈ `#eaeaea` and the surface recolors from tokens;
   - the `data-st` hooks are present and **markup is otherwise unchanged**;
   - flip back to **Sublime** → reverts. Restore the account's theme when done.
   - Dev-server eslint overlay can intercept clicks — remove it first:
     `document.getElementById('webpack-dev-server-client-overlay')?.remove()`.

## Branch / PR conventions

- Branch off the latest merged theming state (or the package head while it's
  unmerged). PRs target **`orphic-inc/main`**, head **`obrien-k:<branch>`**
  (fork workflow). Run the full commit gate before pushing.

## Transitional reality

A token-only theme (Layer Cake) only reskins **migrated** surfaces. Until WS4
completes, such a theme leaves un-migrated surfaces at the Sublime default —
expected. Each WS4 PR shrinks that gap. Themes that must cover everything now
(kuro/proton/postmod) keep their utility overrides until their surfaces convert.

[#123]: https://github.com/orphic-inc/stellar-ui/issues/123
[#124]: https://github.com/orphic-inc/stellar-ui/issues/124
[#125]: https://github.com/orphic-inc/stellar-ui/issues/125
[#126]: https://github.com/orphic-inc/stellar-ui/issues/126
[#127]: https://github.com/orphic-inc/stellar-ui/issues/127
[#129]: https://github.com/orphic-inc/stellar-ui/issues/129
