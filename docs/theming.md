# Theming — Token & Hook Contract (PRD + Inventory)

**Status:** Draft (2026-06-25). Plan of record for the theming migration.
**Decisions:** [ADR-0005](adr/0005-injected-theme-contract.md) (the contract shape — role tokens + `data-st` hooks, look-lives-in-the-hook, two-tier vocabulary) and [ADR-0003](adr/0003-stylesheet-injection-ui-boundary.md) (how a theme is injected + the trust boundary). This document is the _inventory and migration plan_; the ADRs fix the _why_.
**Parked / out of scope:** the ReleaseGroup / cross-community identity seam (stellar-api ADR-0023) — independent of theming, do not block on it.

---

## 1. Goal & audiences

A Theme — injected at runtime as a `<link>`, authored by **core devs and members** — must reach from a one-line **recolor** to a full **structural re-skin**, all from one stylesheet against a small, learnable contract.

| Audience       | Wants                                                     | Path                                                               |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| **Dabbler**    | retint the accent, darken a surface, on their own profile | redefine a handful of **Role Theme Tokens** — no selectors         |
| **Power user** | re-skin a whole region's geometry across the app          | restyle **Tier-1 Roles** (and Parts) — the look has stable handles |

The progression is continuous: the dabbler's tokens and the power user's role overrides are the _same_ system at two depths, not two disjoint mechanisms.

---

## 2. The contract, in one paragraph

A themeable surface emits a `data-st` **hook** and (almost) no inline utilities; the contract CSS (`src/stylesheets/common/global.css`) paints that hook from `--st-*` **role tokens**. **Sublime is just the default token values.** A Theme = redefined token values + optional role/part overrides. The contract CSS is **unlayered**, so hooks win over any stray Tailwind utility. Hooks come in **two tiers**: a small fixed set of app-wide **Roles**, and **Parts** scoped inside a Role that must _earn their place_.

---

## 3. Inventory

### 3.1 Role Theme Tokens

Seeded with Sublime's Tailwind-default values (oklch authoritative). A Theme redefines values only.

| Group                      | Tokens                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **Surfaces**               | `--st-backdrop` · `--st-base` · `--st-panel` · `--st-raised`                               |
| **Text**                   | `--st-text-strong` · `--st-text` · `--st-text-muted` · `--st-text-faint`                   |
| **Accent / Link**          | `--st-accent` · `--st-accent-hover` · `--st-accent-ring` · `--st-link` · `--st-link-hover` |
| **Borders**                | `--st-border` · `--st-border-subtle` · `--st-border-strong`                                |
| **Status**                 | `--st-danger` · `--st-success` · `--st-warning` · `--st-info`                              |
| **Quality** _(core — D-3)_ | `--st-lossless` · `--st-lossy` · `--st-weight` · `--st-weight-track`                       |
| **Geometry / Type**        | `--st-radius` · `--st-radius-sm` · `--st-gap` · `--st-row-pad` · `--st-mono`               |

**Runtime variable (not a theme token):** `--st-w` — set per-row by the component (0–100) to size the contribution weight bar. A Theme never sets it.

### 3.2 Tier-1 Roles — generic, app-wide, fixed set

The learnable core. Each means the same thing on every page; styling it once re-skins the app. **Growing this set is rare and deliberate.**

| Role      | What it is                                           | Default paint (tokens)                                                           |
| --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `panel`   | a bounded surface (card / box)                       | `--st-panel`, `--st-border`, `--st-radius`                                       |
| `colhead` | a column / section header bar                        | `--st-base`, `--st-text-muted`, `--st-border`                                    |
| `list`    | a vertical stack of rows                             | layout only                                                                      |
| `row`     | one record in a list; may be a disclosure            | `--st-row-pad`, `--st-border-subtle`, hover/open via `--st-raised`/`--st-accent` |
| `title`   | the primary label / click-target of a row or panel   | `--st-link` / `--st-text-strong`, `--st-link-hover`                              |
| `meta`    | secondary / muted metadata run                       | `--st-text-muted`, `--st-text-faint`                                             |
| `chip`    | a small bordered token (tag, flag, format)           | `--st-raised`, `--st-border`, `--st-text-muted`                                  |
| `icon`    | a fixed glyph slot (e.g. category sprite)            | `--st-raised`, `--st-radius-sm`                                                  |
| `rollup`  | an aggregate list (label + count) — top tags/artists | `--st-link`, `--st-text-faint`, `--st-mono`                                      |
| `bar`     | a proportional fill bar (weight / progress)          | `--st-weight`, `--st-weight-track`                                               |

> **Applied in WS1:** `release-list → list`, `release-row → row`, `tag → chip`, `category-icon → icon`; the release-specific slots (`release-title/artist/year`) dropped and re-expressed as the generic `title` + `meta` Roles inside `row` (D-1) — no entity-named slots, no generic `cell`. `bar` — previously trapped as a contributor pseudo-element — is now a first-class Tier-1 hook. `global.css` matches this table.

### 3.3 Tier-2 Parts — scoped inside a Role, must earn their place

A Part is justified **only** when no composition of Tier-1 Roles expresses the structure. Each Part names the Role it lives in.

| Part (in Role)                                                                     | Why it can't be Tier-1 composition                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `edition-stack` / `edition` / `edition-format` / `edition-flag` (in `panel`/`row`) | the format-and-quality disclosure under a release row — nested grid + lossless emphasis that `row` alone can't carry. **Shared release Part (D-2)** — also used by the release workbench, not Collage-owned. Speculative sub-slots (`edition-size`, `edition-availability`) reconcile to real fields in WS2; the torrent-era `edition-seeders` was renamed to `edition-availability` in WS1 (CONTEXT.md). |
| `coverart-mosaic` / `coverart-cell` (in `panel`)                                   | a weighted gap-less grid with a 2×2 lead cell — geometry no `list`/`row` gives. Empty state per **D-4**: missing covers render a placeholder cell; the mosaic panel is omitted only when the whole collage has zero art.                                                                                                                                                                  |

**Resolved in WS1 (D-5) — both candidates decomposed; neither is a Part:**

- `contributor*` → `list` + `row` + `bar` + `title` (name) + `meta` (weight). The weight bar became the Tier-1 `bar` Role (extracted from the old contributor pseudo-element); the leader emphasis is `[data-st-lead]` on the `row`.
- `collector*` → a `panel` region of `chip`s. The format picker is `chip[data-st-mono]` with the new `chip[data-st-selected]` modifier; no container hook is needed (chips flow inline).

The table above (`edition*`, `coverart*`) is therefore the complete Part set. These two were the worked examples that gave the governance rule teeth — a named feature does not buy a Part.

---

## 4. Authoring model (informative)

- **Recolor theme:** a `:root { --st-accent: …; --st-panel: …; }` block. Nothing else. Re-skins every hooked surface.
- **Structural theme:** the above, plus overrides on Roles (`[data-st="row"] { … }`) and, rarely, Parts. Still one stylesheet, still no chasing utility classes.
- Member-authored CSS arrives **pre-sanitized from the API** (ADR-0003); the UI does not re-sanitize.

---

## 5. Data readiness (WS0 verification)

The Collage pilot does **not** wait on a stellar-api milestone. The model is faithful and already richer than the pilot needs — `Release → Edition → Contribution → ReleaseFile` with full rip-quality (`bitrate`, `hasLog`, `hasCue`, `isScene`), media, and edition metadata, all serialized and present in the vendored contract. The fidelity gap is therefore **UI rendering**, with exactly one scoped data choice:

- **Collage read path is identity-only.** `GET /api/collages/:id` selects each entry's `release` as `id, title, image, year, communityId, releaseType, credits` — no `editions` / `contributions` / `releaseFile`. To render the edition stack, either extend that one handler's `release` select, **or** lazy-load editions per release on row-expand from the release-workbench endpoint (no API change). Resolved in WS2.
- **Contributor weights are computable now.** The detail endpoint returns the full entry set with per-entry `user`; the UI groups by user to derive the power-law weights. No API dependency.
- **Sequence:** contributor Parts are buildable immediately; edition Parts need the include-extension-or-lazy-load decision first.

## 6. Workstreams (the `/to-issues` seam)

Each is independently grabbable; clear context between them.

- **WS0 — Wire the contract.** Import `common/global.css` into the build (it is currently **unimported** — it does nothing yet), confirm the unlayered cascade, no visual change. Acceptance: tokens resolve in devtools; a hand-set `data-st="panel"` paints.
- **WS1 — Finalize the Tier-1 inventory + re-sort `global.css`.** Apply §3.2 renames; resolve the `contributor`/`collector` collapse question; land the Role table as CSS. Acceptance: §3.2/§3.3 match the file; no Part lacks justification.
- **WS2 — Collage pilot.** Convert `CollageDetail.tsx` to Roles + justified Parts; lazy-load edition/quality from the release-workbench endpoint (**no API change**); no visual regression. The end-to-end proof.
- **WS3 — Author guide + token-only reference theme.** Convert one existing theme to _tokens only_ to prove a recolor is "just tokens." Acceptance: that theme carries zero utility-class overrides.
- **WS4…n — Per-surface migration.** One issue per surface, in the order below. Each: move the surface's look out of inline utilities into Roles/Parts, no regression.

## 7. Migration order (per surface)

1. **Collage** (WS2 pilot — validate the contract).
2. **High-reuse listings** — Community release listing, Search results, Forum topic/post lists. (Max leverage: they share `panel`/`list`/`row`/`colhead`.)
3. **Profile** surfaces.
4. **App chrome** — Navbar, Sidebar, UserMenu.
5. **Long tail** — admin/staff pages last (least theme-facing).

---

## 8. Non-goals

- **Tier-3 reflow** — a theme emitting _different DOM_ (cards↔rows, moving a region to a sidebar). CSS over a fixed DOM cannot do this; out of scope. If ever needed, it's a separate structural-variant decision, not this contract.
- **API / data-model changes** — none. The Collage pilot reads existing endpoints.
- **The ReleaseGroup / cross-community seam** — parked (stellar-api ADR-0023); orthogonal to theming.
- **Chrome lock / sanitization** — owned by the API + CSP (ADR-0003), not here.

## 9. Resolved design decisions

- **D-1 — Row content uses Tier-1 vocabulary; no entity slots.** `release-title/artist/year` are dropped; a row's primary label is the new Tier-1 `title` Role, secondary fields are `meta`. No per-entity slots (they'd re-sprawl one level down) and no generic `cell` (too meaningless to paint). A field needing distinct treatment (e.g. tabular year) takes a small modifier on `meta`, not a new Role.
- **D-2 — `edition*` is a _shared_ release Part.** It earns Part status (nested grid + lossless tiering isn't `row`+`meta`) but is not Collage-owned — the release workbench uses it too, so it lives in `common/`. The torrent-era `edition-seeders` slot was renamed to `edition-availability` in WS1; the slot stays speculative until WS2 reconciles it to a real release-workbench field.
- **D-3 — Quality tokens are core.** `--st-lossless/lossy` (quality-tier cue, recurs in listings/search/workbench) and `--st-weight/weight-track` (the app-wide `bar` Role) stay in the core token set, not a Collage scope.
- **D-4 — Coverart empty state: placeholder, then omit.** Missing covers render a placeholder cell (keeps the region's identity, no layout jolt); the mosaic panel is omitted entirely only when the whole collage has zero art.
- **D-5 — `contributor` and `collector` decompose; they are not Parts.** Applying the §3.3 rule to the two worked examples: `contributor*` is `list`+`row`+`bar`+`title`+`meta` (the weight bar extracted into the Tier-1 `bar` Role; the leader is `[data-st-lead]` on the `row`), and `collector*` is a `panel` region of `chip`s (`chip[data-st-mono]` + the new `chip[data-st-selected]` modifier). Only `edition*` (D-2) and `coverart*` (D-4) earn Part status — the governance rule's worked proof that a named feature does not buy a Part.

## 10. Success criteria

- A recolor theme is expressible as **token values only** (WS3 proves it).
- The Collage renders entirely from Roles/Parts + tokens, no inline paint, no regression (WS2).
- A power-user theme can restyle `row`/`panel`/`colhead` once and visibly re-skin every migrated surface.
- Tier-1 stays small; every Tier-2 Part in `global.css` has a one-line justification.
