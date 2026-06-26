# Stellar UI

React/TypeScript frontend for the Stellar platform. This glossary captures the
ubiquitous language of the **theming subsystem** — the part of the UI a future
reader is most likely to misname. Implementation details live in
`docs/adr/0005-injected-theme-contract.md` and `docs/theming.md`, not here.

## Language

**Theme**:
A named visual identity a user can select for the whole app (Sublime, Anorex,
Kuro, Layer Cake, Proton, Postmod, Dark Ambient). Each theme is a complete
re-skin, not a tweak.
_Avoid_: skin, style, stylesheet (the file is not the theme)

**Injected Stylesheet**:
The single `<link>` element swapped at runtime to apply the active Theme's CSS.
There is exactly one; switching themes re-points it.
_Avoid_: theme file, css override, custom css

**Sublime**:
The baseline Theme. It injects nothing — it is the app's intrinsic Tailwind
appearance, and the canonical source of the default Theme Token values every
other Theme overrides.
_Avoid_: default theme css, base stylesheet

**Theme Token**:
A role-named CSS custom property (e.g. surface, accent, danger) that a Theme
sets and the components read. Named by the role it plays, never by its colour or
by a Tailwind scale step.
_Avoid_: colour variable, palette entry, design token (too broad)

**Semantic Hook**:
A stable, domain-named handle a component exposes so a Theme can target a surface
without touching its markup or utilities. On a themeable surface the hook also
_carries that surface's default appearance_ (painted from Theme Tokens), rather
than leaving the look inline. Two tiers: a **Role** is a generic, app-wide handle
(panel, row, column header) reused everywhere; a **Part** is scoped inside a Role
and added only when no composition of Roles can express the structure (a collage's
edition stack). Identifies _what a region is_, never how it is painted.
_Avoid_: theme class, css hook, selector

## Domain language (owned by stellar-api)

The catalogue entities below are defined in `stellar-api/CONTEXT.md`; they appear
here only because Semantic Hooks are named after them. Use these words — never
the deprecated torrent-era vocabulary.

**Community / Release / Contribution**:
A Community groups Releases; a Release is contributed to via Contributions.
_Avoid_: **Torrent** (deprecated everywhere — a Release/Contribution is never a
"torrent"), group, snatch
