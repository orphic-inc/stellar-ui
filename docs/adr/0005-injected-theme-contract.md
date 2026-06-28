# ADR-0005: Themeable surfaces carry their look in role Theme Tokens + `data-st` Semantic Hooks

**Status:** accepted (2026-06-25). Supersedes the earlier mis-numbered draft of this ADR (it briefly shared `0001` with _Record UI architectural decisions_); content expanded with the look-lives-in-the-hook and two-tier-vocabulary decisions.
**Relates:** stellar-ui [ADR-0003](0003-stylesheet-injection-ui-boundary.md) (how a theme is injected and where the trust boundary sits).

## Context

A Theme is injected at runtime as a plain `<link>` (ADR-0003) and may be authored by **both** core developers (files under `src/stylesheets/`) and members (CSS adopted through the stylesheet manager). The design goal is reach: a Theme should be able to do anything from a **recolor** (the dabbler — change the accent, retint a surface) up to a **full structural re-skin** (the power user — re-lay a whole region), all from one stylesheet against a small, learnable contract.

Two facts about the app block that goal today:

1. **The shipped Themes chase Tailwind utilities.** They re-skin by overriding raw utility classes with `!important` (`.bg-gray-800 { background: … !important }`), and several carry selectors that match **nothing** the React app emits. This is brittle by construction: an override breaks the moment a component's utility classes change, and a utility class carries no meaning, so it cannot express _structure_ (a distinct panel band, a release-listing column).

2. **The appearance lives inline, scattered across the JSX.** Every element is styled with inline utilities (`className="bg-gray-800 border …"`). There is no central handle for a Theme to grab — the look of any given surface is smeared across thousands of `className` strings. Far-reaching theming is impossible while the look lives inline: a single stylesheet cannot re-skin what has no stable target.

The mature precedent for the model we want is **daisyUI-style**: semantic component roles (and their parts) that _carry their own default appearance_, painted by role-named design tokens, with themes swapping the tokens and, when needed, overriding the role. We adopt that model, using `data-st` attributes as the hook syntax.

## Decision

A Theme targets two stable contracts instead of Tailwind utilities, and themeable surfaces are restructured so the contract — not the JSX — owns their look.

1. **Role Theme Tokens** — a fixed `--st-*` set named by role (surface, panel, accent, danger…), seeded with Sublime's Tailwind-default values. A Theme redefines token _values_, never selectors.

2. **`data-st` Semantic Hooks** — attributes a component emits (`data-st="panel"`, `data-st="row"`, `data-st="colhead"`), named in Stellar's domain language (Release / Contribution / Community — never "torrent").

3. **The default appearance lives in the hook, not in inline utilities.** For any surface a Theme should reach, the hook + token pair is the _single_ representation of its look; the contract CSS paints it from tokens. Sublime (the baseline) is therefore just the default token values — it is not special-cased, and every Theme including Sublime is symmetric. Inline utilities are reserved for non-themeable, one-off layout; they are not used to paint a surface a Theme is expected to restyle. (This is the daisyUI-style move: the role carries the look.)

4. **The hook vocabulary is two-tier.**

   - **Tier 1 — generic roles.** A small, fixed, app-wide set (`panel`, `colhead`, `row`, `meta`, `media`, `sidebar`, `chip`, `rollup`, …) that means the same thing on every page. A Theme styles these once and re-skins the whole app.
   - **Tier 2 — parts.** Scoped _inside_ a Tier-1 role, added **only** when no composition of Tier-1 roles can express the structure (e.g. the Collage's `edition-stack`, `coverart-mosaic`, and contributor weight bar).
   - **Governance.** Tier 1 is fixed and grows rarely and deliberately. Tier 2 must earn its place — a new part is justified only by structure that Tier-1 composition cannot express. This rule is what stops per-feature hook sprawl from rebuilding the old brittleness in a new namespace.

5. **The contract CSS is unlayered, so hooks win over Tailwind utilities.** This is deliberate: a stray utility on a hooked surface cannot silently override the themed paint. (Tailwind utilities sit in `@layer utilities`; unlayered rules beat any layered rule regardless of specificity.)

Assets split into a shared `src/stylesheets/common/` (cross-theme sprites such as the category icons) plus per-Theme directories for logos and theme-specific imagery.

## v1 scope — the proving ground

- **Collage is the pilot.** Prove the contract end-to-end on the Collage surface: move its appearance out of inline utilities into Tier-1 roles plus justified Tier-2 parts, with no visual regression. Edition/quality data the richer Collage needs lazy-loads from the existing release-workbench endpoint — **no API change required**.
- The full token set, the enumerated hook taxonomy, and the per-surface migration order live in `docs/theming.md` (to be written); this ADR fixes the _contract shape_, that document carries the _inventory_.

## Consequences

- **Retrofit cost is per-surface, not per-theme.** Each themeable surface moves its look out of `className` into hook + token once; thereafter any number of Themes reskin it for free.
- **Sublime collapses to "the default token values."** No baseline-specific CSS; all Themes are token redefinitions plus optional role/part overrides.
- **Far-reaching theming becomes possible** because the app's look finally has central, stable handles.
- **A standing obligation:** every component that owns a themeable surface must emit the appropriate Tier-1 role (and only justified Tier-2 parts). The two-tier governance rule is the thing a future contributor must respect.
- **Deliberately hard to undo:** reversing to utility-overrides would orphan every `data-st` hook and re-scatter the look back into the JSX.

## Addendum (2026-06-27): Sublime's token defaults are sourced from Tailwind `@theme`

Refinement of decision #3 ("the default appearance lives in the hook") and the consequence "Sublime collapses to the default token values." Does **not** change the contract shape; records _where_ Sublime's default `--st-*` values come from.

**Context.** The original `--st-*` seed in `common/global.css` hand-copied Tailwind's oklch literals (e.g. `--st-panel: oklch(27.8% 0.033 256.848)` = `--color-gray-800`). That is a parallel copy of Tailwind's palette kept in sync by discipline — the same "brittle by construction" failure this ADR set out to kill (selector-chasing), relocated to the token layer. The shipped `sublime/style.css` header even documents the manual-sync chore.

**Decision.** Sublime's **primitive** color tokens are defined in a Tailwind `@theme static` block in `src/index.scss`, sourced **by reference** to the palette (`--st-panel: var(--color-gray-800)`), not by copying literals. Sublime is now literally "Tailwind's theme, renamed to roles" — making the "Sublime = the default token values" consequence true by construction rather than by maintenance. `common/global.css` keeps the **derived** tokens (`--st-lossy/weight/weight-track`, which `var()` onto primitives) and geometry/type tokens, next to the hooks that consume them. Injected themes are unchanged — they still redefine `--st-*` in a `<link>` `:root` that wins by source order.

- **`@theme static` is load-bearing twice.** It forces the `--st-*` tokens to emit (default `@theme` tree-shakes unused vars), and a cross-reference **self-pins its anchor**: referencing `var(--color-gray-800)` marks gray-800 "used", so Tailwind keeps emitting it even after the WS4+ migration deletes the last `bg-gray-800` utility. Verified with an isolated probe: a `@theme static` block referencing an otherwise-unused palette color (`var(--color-…)`), compiled with `source(none)` (no content scan, no utility usage anywhere), still emits that color's `--color-…` var to `:root` purely from the reference — confirmed stable across `tailwindcss` 4.2.4 (the pinned version) and 4.3.1/latest. Run this through the project's `@tailwindcss/postcss`, **not** the webpack build or `npx @tailwindcss/cli`, both of which produce misleading reads: the v4 content scanner reads *every* non-ignored file — including prose like this ADR — so writing a literal `bg-…`/`--color-…` class anywhere silently emits its var (the gotcha that confounded the first attempts here), and `npx` may resolve a different Tailwind version. The contract therefore does not depend on component utility classes surviving migration.

**Considered and rejected — semantic paint utilities.** Tailwind `@theme` _could_ name these tokens in the `--color-*` namespace, which would also generate `bg-panel` / `text-muted` utilities (the "daisyUI v5" shape where one token drives both utilities and component CSS). **Rejected** to hold decision #3: paint on a themeable surface has **one** representation — the `data-st` hook + token. A `bg-panel` utility would be a second painter competing with the hook, re-opening the "look smeared across `className` strings" problem in a semantic disguise. The robustness argument for it (anchor pinning) is moot — `@theme static` already self-pins anchors. So semantic paint utilities stay out of scope; if they ever return it is a deliberate decision #3 amendment, not an incremental convenience.

**Consequence.** The `sublime/style.css` palette comment is now a redundant second copy of the same values; fold it into a pointer to the `@theme` block (or delete) so the manual-sync warning it carries can't come true.
