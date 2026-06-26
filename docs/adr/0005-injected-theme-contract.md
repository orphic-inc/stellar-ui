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
