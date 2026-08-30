import cn from 'classnames';

type PageNumbersProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

/**
 * A numbered pager — every page as its own button, current one marked.
 *
 * The sibling of `Pagination`, not a replacement for it. `Pagination` is
 * Prev/Next, which suits a queue you read front-to-back; the browse surfaces
 * want to jump straight to a page, so they had each grown their own numbered
 * pager instead. Six of them, in four different spellings:
 *
 * - Artists / Users / Releases — `data-st="control"` + `data-st-primary`, the
 *   contract-correct form this primitive standardises on.
 * - Wiki — the same hooks, but `gap-2 justify-center` and larger `px-3 py-1
 *   text-sm` buttons, with the page-param write inlined in `onClick`.
 * - Requests — themed, but by reaching for `var(--st-*)` in class strings
 *   rather than through the `data-st` hook vocabulary.
 * - Logs — raw `bg-indigo-600` / `bg-gray-800` / `text-gray-400`, which is not
 *   theme-reactive at all. That one was a live ADR-0005 contract break: the
 *   pager kept its colours no matter which theme was applied.
 *
 * This is the ADR-0007 case — the contract lands once per primitive rather than
 * once per page — and the exact drift ADR-0007's context section called out
 * ("two pagination styles") having quietly become four.
 *
 * Renders nothing for a single page, so callers can drop it in unconditionally,
 * matching `Pagination`.
 *
 * Known limitation, carried over unchanged and deliberately not fixed here: it
 * renders one button per page with no windowing, so a browse result running to
 * hundreds of pages renders hundreds of buttons. Every prior copy did this;
 * adding an ellipsis window is a UX decision rather than a consolidation, so it
 * belongs in its own change.
 */
const PageNumbers = ({
  page,
  totalPages,
  onChange,
  className
}: PageNumbersProps) => {
  if (totalPages <= 1) return null;
  return (
    <div className={cn('flex gap-1 flex-wrap', className)}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          data-st="control"
          data-st-primary={p === page ? '' : undefined}
          className="px-2.5 py-1 text-xs"
        >
          {p}
        </button>
      ))}
    </div>
  );
};

export default PageNumbers;
