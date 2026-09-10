/**
 * Resolve the cover art to show for a release.
 *
 * A release belonging to a `ReleaseGroup` has two candidate covers: the group's
 * canonical one, and the release's own. Prefer the group's, so two communities'
 * copies of one album stop looking like two different records — that visible
 * sameness is half of what the identity node was built for
 * (stellar-api ADR-0037 §3).
 *
 * **The fallback is the common path, not a defensive afterthought.** `image` is
 * null on any group with no `CoverArt` row, and grouping is opt-in and never
 * backfilled, so most releases have no group at all. Three inputs must stay
 * distinguishable and all resolve to the release's own art:
 *
 *   - `group` absent      — the response predates the field, or is a shape that
 *                           never carries it
 *   - `group` null        — an ungrouped release, which is most of them
 *   - `group.image` null  — a real group that has no cover art yet
 *
 * Note the api picks a group's cover by *convention*: `CoverArt` carries no
 * primary flag, so it is the oldest row, resolved at read time. A member cannot
 * choose it. Requests to pick a different one are an api-side schema change (an
 * `isPrimary` flag), not something to work around here.
 */
export const releaseCover = (
  group?: { image?: string | null } | null,
  release?: { image?: string | null } | null
): string | null => group?.image ?? release?.image ?? null;
