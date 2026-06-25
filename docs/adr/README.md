# Architecture Decision Records — stellar-ui

UI-owned architectural decisions, in the lightweight format stellar-api uses
(`# ADR-NNNN: Title`, then Status / Context / Decision / Consequences).

**Numbering is local to this repo and independent of stellar-api's register.**
See [ADR-0001](0001-record-ui-architecture-decisions.md) for the reference rule:
a bare `ADR-00NN` in UI code denotes a **stellar-api** decision; a UI-local one
is cited as `stellar-ui ADR-00NN`. Cross-system decisions live in stellar-api.

| ADR                                                          | Decision                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| [0001](0001-record-ui-architecture-decisions.md)             | Record UI architectural decisions here; numbering & reference rule |
| [0002](0002-vendored-openapi-contract-and-freshness-gate.md) | Vendored OpenAPI contract + CI freshness gate (#94)                |
| [0003](0003-stylesheet-injection-ui-boundary.md)             | Stylesheet-injection boundary, UI half (#73)                       |

To add one: copy the heading/header shape of an existing ADR, take the next
number, and link it from the table above.
