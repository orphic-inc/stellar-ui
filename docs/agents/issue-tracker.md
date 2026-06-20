# Issue tracker: GitHub

Issues for this repo live as GitHub issues at `orphic-inc/stellar-ui`. Use the `gh` CLI for all operations.

**External PRs are not a triage surface.** `/triage` processes GitHub Issues only; pull requests (including external/feature-request PRs) are left out of the triage queue.

## Target the upstream repo explicitly

`origin` here is the personal fork (`obrien-k/stellar-ui`); the canonical issue surface is the upstream `orphic-inc/stellar-ui`. `gh` infers the repo from `git remote -v` and will default to `origin` (the fork) — the wrong surface. **Pass `--repo orphic-inc/stellar-ui` explicitly** on every `gh issue` command rather than relying on remote inference.

## Conventions

- **Create an issue**: `gh issue create --repo orphic-inc/stellar-ui --title "..." --body "..."`. Use a heredoc for multi-line bodies; fill the issue template's Acceptance criteria section.
- **Read an issue**: `gh issue view <number> --repo orphic-inc/stellar-ui --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --repo orphic-inc/stellar-ui --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo orphic-inc/stellar-ui --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo orphic-inc/stellar-ui --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo orphic-inc/stellar-ui --comment "..."`

## Pairing with stellar-api

UI work that consumes a stellar-api surface should link the originating stellar-api issue/PR (the CONTEXT-MAP "contract hygiene" convention, ADR-0018 step 4). The stellar-api side does not auto-discover UI work; the link is what keeps the API↔UI seam honest in both directions.

## When a skill says "publish to the issue tracker"

Create a GitHub issue (`--repo orphic-inc/stellar-ui`).

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo orphic-inc/stellar-ui --comments`.
