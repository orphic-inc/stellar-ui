# ADR-0006: Tables and form controls reuse the contract; `field` is the one net-new Role

**Status:** accepted (2026-06-26).
**Relates:** stellar-ui [ADR-0005](0005-injected-theme-contract.md) (the injected-theme contract this extends). Folds in the prior out-of-tree design draft (`theming-contract-tables-forms.md`).

## Context

ADR-0005 froze a small Tier-1 Role set proven on **div listings** (`panel`/`list`/`row`/`colhead`/`title`/`meta`/…), later joined by `prose`/`control` (D-6) once a live forum topic page proved them load-bearing. The migration's remaining surfaces add two layout primitives those Roles don't cover:

1. **Genuine `<table>`s** — roughly 50 surfaces (browse tables, top-10, reports/tickets, the big profile). The div `panel→list→row` shape is `display:flex`; a `<table>` defeats flex, and the `<thead>/<tr>/<td>` semantics carry column alignment that a flex row loses.
2. **Form controls** — every filtered/edit surface has inputs. No composition of listing Roles paints an `<input>`, so migrated forms had been leaving their controls on inline `bg-gray-*`/`text-gray-*`, which read as low-contrast text + dark "remainder" boxes under a **light** token theme.

The interim WS4·3/4·4 forum work had papered over (1) by **converting** topic-list `<table>`s into div `panel/list/row`. That is correct for genuinely list-shaped data, but it drops `<thead>` column labels and column alignment — unacceptable for the columnar data tables that dominate what's left. The §10 definition of done also requires that styling `row`/`panel`/`colhead` **once** re-skins _every_ surface, which fails the moment tables use different Role names.

## Decision

1. **Tables reuse `row` and `colhead`, not new Roles.** A `<thead>` is a `colhead`; a `<tr>` is a `row`; cells inherit. `<table>` defeats flex, so **tag-qualified** rules (`tr[data-st='row']`, `thead[data-st='colhead']`) swap layout to table semantics while the token paint (bg, borders, hover, `-open`/`-lead` modifiers) carries over unchanged. One layout-only helper, `data-st="grid"` on the `<table>`, sets `border-collapse`. A theme that restyles `row` thus reskins div lists **and** tables (the §10 gate holds).

2. **List-shaped data stays div; columnar data stays a table.** The two shapes coexist by intent, chosen by the data, not by uniformity. A topic _list_ is legitimately a `list` of `row`s (`ForumPage`); a _matrix_ of forums × stat-columns is legitimately a `<table>` whose alignment is the point (`ForumCategoryPage`). Neither is converted to the other.

3. **Form controls add exactly one Role: `field`.** Inputs/textareas/selects recur everywhere and no Role composition paints them, so `field` earns its place (§3.3). `control` (ADR-0005 D-6) already paints buttons and links, so **no `btn` Role is minted** — the earlier draft's `btn`/`-quiet` is dropped. **Labels decompose to `meta`** and do not get a Role.

4. **No new tokens.** Both reuse existing primitives (`--st-raised`, `--st-border*`, `--st-accent`, `--st-text*`, `--st-row-pad`, `--st-radius-sm`). Native radio/checkbox tint via `accent-color`; the focus ring is the shared `[data-st] :focus-visible` rule. Consequence: **every existing theme — Layer Cake, kuro, proton, postmod — themes tables and forms for free**, with zero additions.

## Scope — the proving ground

- **`ForumCategoryPage`** proves the table variant (keeps its `<table>` + `<colgroup>`; `panel`/`colhead`/`grid`/`thead`-`colhead`/`tr`-`row`/`title`/`meta`/`control`/`-num`).
- **`NewTopicForm`** proves `field` (inputs/textarea → `field`, labels → `meta`, buttons → `control`, submit → `control[data-st-primary]`).
- The enumerated table sweep (browse tables → messages → top-10 → reports/tickets → detail tables → profile) then proceeds mechanically against this vocabulary; see `docs/theming.md` §3 and the program handoff.

## Consequences

- **Tier-1 grows by one Role (`field`) + a handful of tag-qualified table rules and a `grid` helper** — the minimum. No Role-per-component; the §3.3 governance bar is respected.
- **Themes need no new token work**; the §10 "style once, re-skin everywhere" gate becomes reachable once the table sweep lands.
- **The `<table>` rules are tag-qualified** (`tr[data-st='row']`, 0-1-1), so they outrank the bare-attribute flex base rule (0-1-0) by specificity — safe to add unlayered alongside the existing CSS, order-independent.
- **Standing obligation:** a surface picks div vs. table by whether its data is list-shaped or columnar, and emits the same Roles either way. Form controls emit `field`; buttons emit `control`. A future contributor must not mint a per-table or per-input Role.
- **Limit:** `accent-color` covers native radio/checkbox/range tint but not OS-drawn `<select>` option lists — the same limit every theme already has.

## Amendment (2026-09-26) — the forms plugin had defeated native checkboxes (#368)

Decision 4's "native radio/checkbox tint via `accent-color`" never held in this repo. `@tailwindcss/forms` sets `appearance: none` on checkboxes and radios and draws the checked state itself: a `currentColor` fill plus a ✓ background image. Tinting does nothing on a control the browser no longer draws. The plugin's rules are layered, and `[data-st='field']`'s `background:` shorthand is not, so on every `field` checkbox the unlayered rule erased the plugin's drawing. No checkbox or radio carrying `field` showed whether it was ticked. The ones without `field` showed the plugin's box in fixed colours that no theme reached.

**The decision stands; its implementation moves.** One unlayered element rule in `src/index.css`, directly after the `@plugin` line, restores native controls for **every** checkbox and radio, whether or not it carries `field`:

- `appearance: auto` and `accent-color: var(--st-accent)`;
- `background`, `border`, `padding` and `box-shadow` reset, which clears the plugin's box and its fixed-blue focus ring;
- `:focus-visible` takes the shared themed outline (`2px solid var(--st-accent-ring)`), so focus looks the same inside and outside a `data-st` surface.

At 0-1-1 the rule outranks `[data-st='field']` (0-1-0), so `field` needs no carve-out. `field` stays on checkboxes and radios as the form-control marker, but the element rule, not `field`, is what styles them. A theme that wants to restyle them targets `[data-st='field'][type='checkbox']` or the element with enough specificity.

It lives in `index.css`, not `global.css`, because it undoes a plugin loaded there. `global.css` stays the `data-st` hook contract. `src/__tests__/nativeControls.test.ts` pins the rule's declarations and placement. It also fails if a checkbox or radio regains a class that only styled the plugin's box.
