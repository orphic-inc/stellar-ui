# ADR-0007: A UI primitive kit (the React component layer) atop the token contract

**Status:** accepted (2026-06-30).
**Relates:** stellar-ui [ADR-0001](0001-record-ui-architecture-decisions.md) (the ADR structure this follows), [ADR-0005](0005-injected-theme-contract.md) (the injected-theme `--st-*`/`data-st` contract the kit emits), [ADR-0006](0006-table-and-form-contract.md) (the table/`field` contract the kit emits). Supersedes the per-file `data-st` plan in the out-of-tree `theming-admin-staff.md` for the staff/admin surfaces.

## Context

ADR-0005 and ADR-0006 froze a **CSS-level** contract: a small Role vocabulary
(`panel`/`list`/`row`/`colhead`/`title`/`meta`/`prose`/`control`/`field`/…) that
themes repaint by redefining tokens. The contract says what a surface should
*emit*; it says nothing about the **React layer** that emits it. Nothing stopped
each page from re-deciding its own wrapper, width, and class strings around those
hooks.

The staff/admin **Toolbox** (~40 tools) is where that gap showed. It grew
organically out of the legacy tracker app — pre-componentization markup, copied
page to page. By the time the theming migration reached it, the surface was a
disjointed mess on every axis a user or maintainer notices:

- **Five different page max-widths** (`max-w-2xl`…`max-w-6xl`, plus a legacy
  `.thin`) for structurally identical tool pages.
- **The same data shape rendered two ways** — a `<table>` on one page, `grid`
  divs on the next — so column alignment and theming behaved differently for no
  reason.
- **Two pagination styles**, several **drifting form-input class strings**
  (`bg-gray-700 border-gray-600 …` retyped with small variations), and ad-hoc
  status pills.
- **An inconsistent "← Toolbox" back-link** — top-left on some pages, a
  top-right button on others, missing on a few, occasionally duplicated.

Migrating each surface by hand-applying `data-st` would have re-skinned them but
**frozen the structural drift in place** and duplicated ~26 near-identical page
wrappers. The theming "style once, re-skin everywhere" gate (ADR-0005 §10) is
about *paint*; it does not make the React layer consistent or navigable.

## Decision

Introduce a small kit of presentational primitives in **`src/components/ui/`**
(barrel `index.ts`) that **each own their `data-st` hooks**. The contract lands
**once per primitive**, not once per page. The kit is the site-wide template;
the staff/admin tools are its first proving ground.

1. **Primitives, each emitting the ADR-0005/0006 contract:** `PageShell`
   (page wrapper — `prose -strong` title, the back-link, an actions slot, one
   width scale `sm…2xl`), `Panel` (`panel`), `Button` (`control` + variants
   `primary`/`success`/`warning`/`danger`/`link`/`link-danger`), `Field`
   (labeled input → `field` + `meta` label), `DataTable` (ADR-0006
   `grid`/`colhead`/`row`), `Badge` (`chip` + status variants), `Pagination`
   (link `control`s), `SectionHeading` (uppercase `prose -strong` label).

2. **Adopting a primitive *completes* that surface's theming migration.** Because
   each primitive emits the hooks, a page that moves onto the kit gets its
   ADR-0005/0006 migration for free — no separate per-file `data-st` pass.

3. **Consistency over premature abstraction.** The goal is that every tool page
   *reads the same*, not that every line is shared exactly once. Some duplication
   across adopters is accepted in preference to a single over-parameterized
   mega-component — this is *not* deliberate WET; it is declining to abstract
   until a pattern has genuinely recurred (see the `Tabs` discussion below).

4. **Collapse genuine twins.** When two tools differ only in configuration —
   IP-address bans vs. email blacklist are the same add-form + table + remove —
   express the shared shape once (`staff/Blacklist.tsx`) and make the tools thin
   config over it. The kit makes this cheap; it is a stated direction, not a
   one-off (see Consequences → roadmap).

5. **No new tokens or Roles.** The kit is a React layer only; it composes the
   frozen contract. The single addition to date is `Button`'s `warning` variant,
   which **composes** the existing `-primary -warning` status modifier — no new
   token, no new Role. Any genuinely new Role/token still goes through ADR-0005/
   0006 governance.

6. **Cross-cutting affordances are owned by the kit, not re-decided per page.**
   The "← Toolbox" back-link is the first: `PageShell` renders it **default-on**
   in one fixed location, so a tool page cannot forget it or place it
   differently. Consistency arrives **as pages adopt `PageShell`** — we do not
   retrofit the bespoke heavyweights, which keep their own hand-rolled link for
   now (a known, accepted exception, not a forced change).

## Scope — what adopts the kit, what stays bespoke

> **Amended 2026-06-30.** The three heavyweight admin managers
> (`CommunityManager`, `ForumControlPanel`, `ForumCategoryControlPanel`) — first
> parked as "stays bespoke" below — were migrated after all. On inspection they
> are the same list + inline-edit + create-form shape already proven on
> `RulesManager`/`TagAliases`, just larger; the "would distort the kit" concern
> didn't hold. `GenerateTestDataPage` (dev-only) is now the sole bespoke
> exception. The list below is updated to match.

- **Adopts the kit:** the log/stats/queue tables, the CRUD forms, the simple
  read-only list pages, and the admin managers — effectively the whole Toolbox.
  Proven across the migration on `Blacklist`, the logs, stats, queues, CRUD forms
  (clean-fit + inline-edit), the admin managers, and the three heavyweight
  managers (`CommunityManager`, `ForumControlPanel`, `ForumCategoryControlPanel`).
- **Stays bespoke** (own markup; migrate leaf colors to tokens only if touched):
  `GenerateTestDataPage` (dev-only) — a one-off developer utility, not a tool
  page, so it keeps its own hand-rolled markup and back-link.
- **Candidate primitives, not yet minted:** `Tabs` (and `FormRow`). Extract only
  on **real recurrence** (≥2 adopters) — see Consequences.

## Consequences

**Reward**

- One definition per affordance: width, back-link, table, form input, status
  pill. The Toolbox becomes consistent and navigable instead of per-page guesswork.
- Theming comes for free on adoption; the ADR-0005 §10 gate stays reachable.
- Consolidation gets cheap: collapsing twins into one tool (and later, one tool
  with internal tabs) is a config change, not a rewrite.
- Tests assert *hooks-present* once per surface against a known primitive shape,
  so the contract is regression-guarded cheaply.

**Risk / cost (and mitigations)**

- *A new React layer to learn and maintain.* Mitigated by keeping primitives
  small and documented, and by the recipes/gotchas captured in the migration
  handoff.
- *Premature abstraction.* "Consistency over DRY" plus eager primitive-minting
  could over-fit. Mitigation: extract a primitive only on real recurrence
  (≥2 adopters); `Tabs`/`FormRow` stay candidates until then.
- *Ref-forwarding gap.* `Field`/`Button` are plain function components (no
  `forwardRef`), so react-hook-form `register()`, `<select>`, and `<textarea>`
  use the **`field` Role direct** rather than `Field`. This is a documented edge,
  not a defect.
- *Tolerated duplication can rot.* Mitigation: the kit is the single template new
  tools compose from; drift is caught in review against the primitive set.

**Standing obligations**

- New tools compose the kit; they do not re-roll a page wrapper, table, or
  back-link. New Roles/tokens still route through ADR-0005/0006.
- **Organization roadmap (audit findings, deferred).** The high-value, low-risk
  consolidation — **code-level twin merges** — is largely done: IP-ban + email
  blacklist collapsed to one `Blacklist.tsx` + thin config. What remains is
  **information architecture, not code**, and is gated, so it is *not* taken this
  pass:
  - Those blacklist twins still ship as two Toolbox tools/routes; the read-only
    families (audit logs; admin stats dashboards) are scattered across sections.
  - Collapsing tools into one **tabbed** surface is blocked by **per-tool
    permission differences** (`ip_bans_manage` ≠ `email_blacklist_manage`; the
    four logs each gate on a different view permission) — a single-permission
    user would see the tabs collapse to one pane, i.e. today's behavior. So a
    `Tabs` primitive has **no clean adopter yet** and is not minted speculatively
    (per D-3).
  - The heterogeneous admin **stats** dashboards share one permission but suit a
    **hub/landing** pattern, not tabs.
  - Both groupings are ultimately **section-taxonomy** changes (the 11 overlapping
    `StaffToolSection`s), which are **deferred by decision**. *Invite pool/tree*
    are placeholders pending redesign and are out of scope.

  These candidates live in the migration handoff as a roadmap, not frozen here.
