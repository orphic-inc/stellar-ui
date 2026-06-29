import cn from 'classnames';
import Button from './Button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

/**
 * Prev / "page / total" / Next, as text-link controls. Converges the two
 * hand-rolled footers (bare links vs gray buttons) the staff logs had drifted
 * into. Renders nothing for a single page, so callers can drop it in
 * unconditionally.
 */
const Pagination = ({
  page,
  totalPages,
  onChange,
  className
}: PaginationProps) => {
  if (totalPages <= 1) return null;
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 text-sm',
        className
      )}
    >
      <Button
        variant="link"
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      >
        Prev
      </Button>
      <span data-st="meta">
        {page} / {totalPages}
      </span>
      <Button
        variant="link"
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
