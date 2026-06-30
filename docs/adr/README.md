# Architecture Decision Records — stellar-ui

UI-owned architectural decisions, in the lightweight format stellar-api uses
(`# ADR-NNNN: Title`, then Status / Context / Decision / Consequences).

**Numbering is local to this repo and independent of stellar-api's register.**
See [ADR-0001](0001-record-ui-architecture-decisions.md) for the reference rule:
a bare `ADR-00NN` in UI code denotes a **stellar-api** decision; a UI-local one
is cited as `stellar-ui ADR-00NN`. Cross-system decisions live in stellar-api.

| ADR                                                          | Decision                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [0001](0001-record-ui-architecture-decisions.md)             | Record UI architectural decisions here; numbering & reference rule                                       |
| [0002](0002-vendored-openapi-contract-and-freshness-gate.md) | Vendored OpenAPI contract + CI freshness gate (#94)                                                      |
| [0003](0003-stylesheet-injection-ui-boundary.md)             | Stylesheet-injection boundary, UI half (#73)                                                             |
| [0004](0004-peer-api-contract-version-coupling.md)           | Couple UI version to the vendored API contract                                                           |
| [0005](0005-injected-theme-contract.md)                      | Themes target role tokens + `data-st` hooks; surfaces carry their look in the hook (two-tier vocabulary) |
| [0006](0006-table-and-form-contract.md)                      | Tables reuse `row`/`colhead`; `field` is the one net-new Role for form controls                          |
| [0007](0007-ui-primitive-kit.md)                             | A React UI primitive kit (`src/components/ui/`) that emits the contract; favors consistency, tolerating some duplication over premature abstraction |

To add one: copy the heading/header shape of an existing ADR, take the next
number, and link it from the table above.
