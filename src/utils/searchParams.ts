/**
 * URL-search-param helpers for the browse surfaces.
 *
 * Every browse and list page keeps its filter state in the query string rather
 * than in component state, so the two operations below were written out longhand
 * on each of them: bump the `page` param, and copy a form field into the params
 * only when the user actually filled it in.
 *
 * Only these two are shared. The rest of each page's submit handler — which
 * fields exist, which default values are worth omitting from the URL — is
 * genuinely per-page, and folding that into a common helper would be the
 * premature abstraction ADR-0007 warns against. These are the two pieces that
 * were textually identical everywhere.
 */

/**
 * The existing params with `page` set to `p`.
 *
 * Returns a new `URLSearchParams` rather than mutating: the instance react-router
 * hands back from `useSearchParams()` is the live one, and writing to it directly
 * mutates state that React is not tracking.
 */
export const withPage = (
  searchParams: URLSearchParams,
  p: number
): URLSearchParams => {
  const next = new URLSearchParams(searchParams);
  next.set('page', String(p));
  return next;
};

/**
 * A setter that copies `key` from `fd` into `params` when it holds a non-blank
 * value, trimmed — so an empty or whitespace-only filter box leaves the query
 * string clean instead of adding `?q=`.
 */
export const formParamSetter =
  (fd: FormData, params: URLSearchParams) =>
  (key: string): void => {
    const v = fd.get(key);
    if (v && String(v).trim()) params.set(key, String(v).trim());
  };
