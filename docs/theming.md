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

> **React layer (ADR-0007).** A surface need not emit the hooks by hand. A small primitive kit in `src/components/ui/` (`PageShell`/`Panel`/`Button`/`Field`/`DataTable`/`Badge`/`Pagination`/`SectionHeading`) **owns the hooks**, so the contract lands **once per primitive, not once per page** — adopting a primitive *completes* that surface's migration. The CSS contract below is unchanged; the kit is purely the React layer that emits it.

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
| `prose`   | body / heading copy inside a surface                 | `--st-text` (`-strong` → `--st-text-strong`; `-muted` → `--st-text-muted`)       |
| `control` | an interactive affordance (button or link)           | `--st-link` / `--st-link-hover` (`-primary` → `--st-accent` fill; `-danger` → `--st-danger` on hover) |
| `field`   | a form control (input / textarea / select)           | `--st-raised`, `--st-border`, `--st-text` (`accent-color` → `--st-accent`; placeholder → `--st-text-faint`) |

> **Table variant of `colhead` + `row` (WS5, ADR-0006).** The same two Roles paint a genuine `<table>`: a `<thead>` is a `colhead`, a `<tr>` is a `row`, cells inherit. Tag-qualified rules (`tr[data-st='row']`, `thead[data-st='colhead']`) swap flex→table layout while the token paint carries over, so styling `row`/`colhead` once reskins div listings _and_ data tables. `grid` is a layout-only helper on the `<table>` (sets `border-collapse`). List-shaped data stays div `panel`/`list`/`row` (e.g. `ForumPage`); columnar data keeps its `<table>` and column alignment (e.g. `ForumCategoryPage`).

> **Applied in WS1:** `release-list → list`, `release-row → row`, `tag → chip`, `category-icon → icon`; the release-specific slots (`release-title/artist/year`) dropped and re-expressed as the generic `title` + `meta` Roles inside `row` (D-1) — no entity-named slots, no generic `cell`. `bar` — previously trapped as a contributor pseudo-element — is now a first-class Tier-1 hook. `global.css` matches this table.

> **Added in WS4 (forum topic page):** `prose` and `control`. Live-rendering a real topic + poll proved both load-bearing (D-6): prose copy on a token-painted `panel` was going light-on-light without a hook, and inline-gray buttons/links went illegible on a light theme. Same pass added the `colhead[data-st-title]` modifier — the header bar carrying a _content_ title (a thread/post subject) drops the uppercase/tracking a structural label wants — and gave `bar[data-st-lead]` a leading accent edge so the leader reads on a light theme. `global.css` matches this table.

> **Added in WS5 (forum category page + new-topic form):** `field` (D-7, ADR-0006). Text inputs recur on every filtered/edit surface and no composition of listing Roles paints one, so it earns a Role; labels still decompose to `meta`. `control` already covered buttons, so no `btn` Role was minted. The same pass ratified the table variant of `colhead`/`row` (above) — no new table Roles, no new tokens, so every existing theme themes tables and forms for free. Modifiers extended: `-num` now also right-aligns table cells; `-open`/`-lead` cover pinned/sticky table rows. `global.css` matches this table.

> **Applied in WS6 (release browser):** `ReleaseBrowsePage` migrated with **no new Roles, Parts, or tokens** — proof the WS5 vocabulary already covers a whole surface end-to-end (the release listing, item 2 of the §7 order). The filter form is a `panel` of `field` inputs with `meta` labels and `control`(`-primary`) buttons; the results are the `grid`/`colhead`/`row` table variant with `title`/`meta`(`-em`)/`chip` cells; pagination is `control`(`-primary` for the current page). First surface to carry native checkboxes/radios: they take `data-st="field"` for its `accent-color` tint — `field`'s box rules (bg/border/padding) are inert on an `appearance:auto` control, so no checkbox Role is needed. The `edition-*`/`coverart-*` Parts stay unwired here: rip-quality is in no readable schema (§5), and a per-row cover thumbnail is not the mosaic Part's job.

> **Added in WS7 (user profile + staff panel):** **status modifiers** on `chip` and `control` — `-warning` / `-success` / `-info` (and `-danger`, which `control` already had as a text-link hue). They paint from the existing `--st-warning/success/info/danger` status tokens, so **no new tokens** were minted; the growth is two Roles gaining modifiers, justified like prose/control in WS4 by a real surface that encodes meaning in colour. A `chip` carries the hue for a ticket status / account state; a filled `control -primary` swaps its fill to the status hue (Warn = warning, Enable = success, Disable = danger) via a `--st-fill` var the modifier retargets — the `-primary` base rules still paint, so the model stays compositional. The `-danger` text-link rule is now `:not([data-st-primary])` so a filled danger button keeps its strong label. `UserProfile` migrated end-to-end on this (panel/colhead/row/grid/field/control/chip/prose/meta); its **donor-presentation block keeps its pink brand flair** unmigrated by design (user-customised flair, not app chrome). `global.css` matches this.

> **Applied in WS8 (settings forms):** `Settings` + `DonorSettingsTab` + `IrcNickSettings` migrated with **no new Roles or tokens** — three tabbed forms built from `panel`/`field`/`control`(`-primary`/`-danger`)/`meta`/`prose`. Two patterns worth recording: (1) the **tab strip** is not a Role — its active/inactive border + text paint from token utilities (`border-[var(--st-accent)]`, `text-[var(--st-text-muted)]`, …) keyed off `activeTab`, the same leaf-color escape hatch §3.2 allows where no Role spans the element; using `control` would fight the Role's own color. (2) DonorSettingsTab's **locked perks** keep `field`/`meta` (so they theme) and signal the locked state with `opacity`/`cursor-not-allowed` layout utilities, not a dimmer color — the shared `inputClass`/`labelClass`/`lockedClass` consts were reduced to layout-only and the paint moved to per-site `data-st` hooks. The IRC verification callout decomposes to a neutral `panel` (it carried an indigo info tint that doesn't theme).

> **Applied in WS9 (invite surfaces):** `InviteForm` + `InviteTree`, **no new Roles or tokens**. `InviteTree` is a textbook ADR-0006 table migration — the invitee adjacency tree keeps its `<table>` (column alignment is the point) as `grid`/`colhead`/`row`, numeric stat columns carry `data-st-num`, the per-row member link is a `title` (or `meta` + `line-through` when the account is disabled), and the summary rollup is a `panel` of stat `panel`s with by-rank `chip`s. `InviteForm` is the first migrated surface built on **legacy tracker classes** (`box`/`pad`/`field_div`/`label`) rather than Tailwind grays: those classes are inert under Sublime and carry layout under legacy themes, so they stay and the `data-st` hooks (`panel`/`field`/`control`/`meta`/`prose`) layer on top to supply the token paint — nothing to strip, just hooks to add.

> **Applied in WS10 (ratio surfaces — completes the Profile section):** `RatioStats` + `RatioRulesPage`, **no new Roles or tokens**. `RatioStats` is a display `panel` with a `colhead` cap and `meta` label/value rows; `RatioRulesPage` is a prose-heavy page (`prose` on the wrapper, `prose -strong` headings, `--st-text-strong` leaf utility on the inline `<strong>`s) with the bracket reference table as a `grid`/`colhead`/`row` variant and the user's active bracket flagged with `data-st-open` (the open-row accent wash). The notable call is **status colour without chip/control**: the WATCH / LEECH banners and the conditional ratio / coverage values are full-width banners and inline figures, not chips or buttons, so they paint straight from the `--st-success/warning/danger` status tokens via leaf utilities (`text-[var(--st-danger)]`, plus a `color-mix(... 12% transparent)` tint for the banner fill that mirrors the chip-status border recipe). This is the §3.2 leaf-colour escape hatch carrying *semantic* status colour where no Role spans the element — the status tokens are shared, only their delivery differs from WS7's chip/control modifiers.

> **Applied in WS11 (app chrome — the visible header + dropdowns, §7 item 4):** `PrivateHeader` + `UserMenu` + `NotificationCorner` + `QuickSearch`, **no new Roles or tokens**. This surface is mostly **token leaf utilities, not Roles** — chrome is structural bars and state-keyed nav, which §3.2's escape hatch covers and which `control`/`panel` would fight. `PrivateHeader`'s bars repaint via `bg-[var(--st-backdrop)]`/`-base` + `border-[var(--st-border-subtle)]`; the primary nav is the WS8 **tab-strip** pattern (active `border-[var(--st-accent)] text-[var(--st-text-strong)]`, inactive muted→text, keyed off `NavLink`'s `isActive`) — not a Role; the faint stats/quicklinks strip stays `--st-text-faint`→`-text` on hover; unread count badges fill from `--st-accent` (inbox) / `--st-warning` (staff). `UserMenu` keeps its **padded pill** menu items, which rules out `control` (it zeroes padding for text-links): items paint `--st-text-muted`→`-text-strong` with a `--st-raised` hover wash, the username at `--st-link`, logout reddening to `--st-danger`. `NotificationCorner` is the one Role-bearing piece: the dropdown is a `panel` with a `colhead` cap, the feed is a `list` of `row`s (`data-st-open` for the unread accent wash), "Mark all read" is a `control`, while the quiet ✕ icon buttons stay `--st-text-faint`→`-text`/`-danger` leaf utilities (a bright `control` ✕ on every row would be noisy). The PM call-to-action and the floating bell paint from `--st-accent`/`color-mix` and the surface tokens. `QuickSearch` inputs take `field`. Test note: the layout suites mock `Link`/`NavLink` to strip extra props (the §7 gotcha), so hooks-present assertions target real elements (the `panel`/`colhead`/`list`/`row` in the notification dropdown, the `field` input, the logout `<button>` className, the nav active-class token) rather than the mocked anchors.

> **Applied in WS12 (app chrome — shells, footer, banners; completes §7 item 4):** `PublicLayout` + `PrivateLayout` + `PrivateFooter` + `GlobalNoticeBanner` + `Alert`, **no new Roles or tokens** (`PrivateContent` is route wiring with zero colour utilities — nothing to migrate). The shells and footer repaint via surface/text leaf utilities (`bg-[var(--st-backdrop)]`/`-base`, `text-[var(--st-text)]`/`-faint`, `--st-border-subtle` dividers); `PublicLayout`'s Register CTA is the one Role — a `control -primary` filled button-link (it has no padded-pill conflict, so unlike `UserMenu` it can take the Role). The two **notice surfaces reuse the WS10 status-colour-without-chip recipe**: `GlobalNoticeBanner` (a full-width `--st-warning` banner) and `Alert` (a per-`alertType` toast) are notices, not chips/controls, so each paints straight from the `--st-success/warning/danger/info` tokens via the shared leaf pattern — `bg-[color-mix(in_oklch,var(--st-X)_12%,transparent)]` fill, `_40%` border, solid `text-[var(--st-X)]` — mirroring `RatioStats`. With WS11 + WS12 the **app-chrome section (§7 item 4) is complete.**

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

## 4. Authoring a theme (the guide)

A theme is one CSS file, injected as a `<link>` after the bundled `global.css`
(ADR-0003). Both `:root` blocks are unlayered, so the theme's values win by
source order — **no `!important`, no selectors to chase.**

- **Recolor theme — the common case: a `:root { --st-* }` block, nothing else.**
  Redefine the **primitive** role tokens (surfaces, text, accent/link, borders,
  status). The **derived** tokens follow automatically — they reference the
  primitives via `var()` and resolve lazily, so you never restate them:
  `--st-lossy → var(--st-text-faint)`, `--st-weight → var(--st-accent-ring)`,
  `--st-weight-track → color-mix(… var(--st-raised) …)`. Geometry/type
  (`--st-radius`, `--st-gap`, `--st-mono`) inherit unless you want to retune
  density. Token catalogue: §3.1.
  - **Worked example:** `src/stylesheets/layer-cake/style.css` — the classic-gray
    theme, expressed as ~20 primitive token redefinitions and **zero** utility
    overrides (WS3). It is the reference every recolor should look like.
- **Structural theme:** the recolor block, plus overrides on **Roles**
  (`[data-st="row"] { … }`) and, rarely, **Parts**. Still one stylesheet, still
  no chasing utility classes.
- **During the migration:** a token-only theme only re-skins surfaces already on
  the hook contract (the Collage today; more as WS4+ migrates). A theme that must
  also cover not-yet-migrated surfaces keeps its old utility overrides until
  those surfaces convert.
- Member-authored CSS arrives **pre-sanitized from the API** (ADR-0003); the UI
  does not re-sanitize.

---

## 5. Data readiness (WS2 finding)

This section's original optimism — that editions could lazy-load "from the release-workbench endpoint, no API change" — is **wrong**, a WS2 finding. The contributor and cover-mosaic enrichments need no API; the **edition disclosure does**:

- **No read path exposes rip-quality.** `bitrate` / `media` / `hasLog` / `hasCue` / `isScene` are absent from every UI-readable response in the vendored contract: `getReleaseById` → `Release.contributions` (`ReleaseContribution`) is lean (`user`, `sizeInBytes`, `collaborators`); `/contributions` → `Contribution` omits quality; and `/communities/{id}/releases/{id}/contributions` is `get?: never`. Quality exists only as POST inputs and release-**search filters** — never read back. So the **edition stack is blocked on a stellar-api change** (expose quality in a release-scoped contributions response), out of the UI-only scope. The `edition-*` Part CSS stays as the pre-wired target.
- **Contributor weights are computable now.** The detail endpoint returns the full entry set with per-entry `user`; the UI groups by user to derive the power-law weights. No API dependency. _(Shipped in WS2.)_
- **Cover mosaic is identity-only** — `entry.release.image` is enough for the weighted 2×2 mosaic. _(Shipped in WS2.)_

## 6. Workstreams (the `/to-issues` seam)

Each is independently grabbable; clear context between them.

- **WS0 — Wire the contract.** Import `common/global.css` into the build (it is currently **unimported** — it does nothing yet), confirm the unlayered cascade, no visual change. Acceptance: tokens resolve in devtools; a hand-set `data-st="panel"` paints.
- **WS1 — Finalize the Tier-1 inventory + re-sort `global.css`.** Apply §3.2 renames; resolve the `contributor`/`collector` collapse question; land the Role table as CSS. Acceptance: §3.2/§3.3 match the file; no Part lacks justification.
- **WS2 — Collage pilot (UI-only).** `CollageDetail.tsx` renders from Roles + Parts + tokens (no inline paint, no regression), adding the contributor power-law block (`bar` Role) and the weighted 2×2 cover mosaic. The edition disclosure is **deferred** — its quality data is in no read schema (§5); the `edition-*` Part stays defined-but-unwired pending a stellar-api change. _Done._
- **WS3 — Author guide + token-only reference theme.** Convert one existing theme to _tokens only_ to prove a recolor is "just tokens." Acceptance: that theme carries zero utility-class overrides. _Done — Layer Cake is now a ~20-token recolor with zero overrides (§4); the guide lives in §4._
- **WS4…n — Per-surface migration.** One issue per surface, in the order below. Each: move the surface's look out of inline utilities into Roles/Parts, no regression.

## 7. Migration order (per surface)

This is the **stable migration order** — the cluster sequence and its rationale.
It is **not** a status tracker: do not annotate it with per-surface "Done: WSx…"
notes in feature PRs (that rewrites the same lines on every branch and makes this
section a serial merge-conflict magnet). **Per-surface progress lives in the
rolling handoff, not here.**

1. **Collage** (WS2 pilot — validate the contract).
2. **High-reuse listings** — Community release listing, Search results, Forum topic/post lists. (Max leverage: they share `panel`/`list`/`row`/`colhead`.)
3. **Profile** surfaces.
4. **App chrome** — Navbar, Sidebar, UserMenu.
5. **Long tail** — admin/staff pages last (least theme-facing), via the UI primitive kit (ADR-0007).

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
- **D-6 — `prose` and `control` join Tier-1; chrome and copy are Roles, not inline utilities.** WS4 grew the set by two, against the "rare and deliberate" bar, because a real forum topic page proved them load-bearing: prose copy on a token `panel` (post body, poll question/answer, vote labels) needs a text-token hook or it stays light-on-light, and interactive buttons/links (moderation actions, vote, byline) need a token hook or they keep a fixed gray that goes illegible on a light theme. Both replace inline `var()`/utility bridges rather than adding new structure. The same pass split content titles from structural labels via the `colhead[data-st-title]` modifier (no uppercase) and added a leading accent edge to `bar[data-st-lead]` so the leader reads on any theme. (The form-input non-goal noted here was lifted in D-7.)
- **D-7 — Tables and forms reuse the contract; `field` is the one net-new Role (ADR-0006).** Two layout primitives the div-listing Roles didn't cover — genuine `<table>`s (~50 surfaces) and form controls (every filtered/edit surface) — are folded in **without** new Roles per element. Tables reuse `row`/`colhead` via tag-qualified rules (`tr[data-st='row']`, `thead[data-st='colhead']`) plus a layout-only `grid` helper, so list-shaped data stays div `panel`/`list`/`row` and columnar data keeps its `<table>` + alignment — both painted by the same Roles (the §10 gate). Form controls add exactly **`field`** (input/textarea/select); `control` (D-6) already paints buttons, so no `btn` Role; labels decompose to `meta`. **No new tokens** — both reuse existing primitives, so Layer Cake/kuro/proton/postmod theme tables and forms for free. Proven on `ForumCategoryPage` (table) + `NewTopicForm` (form).

## 10. Success criteria

- A recolor theme is expressible as **token values only** — proven: `layer-cake/style.css` is ~20 primitive token redefinitions, zero overrides (WS3).
- The Collage renders entirely from Roles/Parts + tokens, no inline paint, no regression (WS2).
- A power-user theme can restyle `row`/`panel`/`colhead` once and visibly re-skin every migrated surface.
- Tier-1 stays small; every Tier-2 Part in `global.css` has a one-line justification.
