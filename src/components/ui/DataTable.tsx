import type { Key, ReactNode } from 'react';
import cn from 'classnames';
import Spinner from '../layout/Spinner';
import Panel from './Panel';

export type Column<T> = {
  header: ReactNode;
  cell: (item: T) => ReactNode;
  /** Right-aligns + tabular-nums the column and tints it faint (`data-st-num`). */
  numeric?: boolean;
  thClassName?: string;
  /** Per-cell layout (width, `font-mono`, `truncate`); paint comes from `row`. */
  tdClassName?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (item: T) => Key;
  isLoading?: boolean;
  empty?: ReactNode;
  /** Washes the row with the accent (`data-st-open`) — e.g. the active bracket. */
  rowActive?: (item: T) => boolean;
  className?: string;
};

/**
 * A genuine columnar `<table>` on the ADR-0006 `grid`/`colhead`/`row` token
 * variant — one component for the data tables that were split across hand-rolled
 * `<table>`s and `grid-cols-[…]` divs. The contract paints header/cell padding,
 * the uppercase column labels, dividers, and hover; columns supply only content
 * and per-cell layout. Wrapped in a `Panel` (which clips its corners) for the
 * card chrome.
 */
function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  empty = 'No records.',
  rowActive,
  className
}: DataTableProps<T>) {
  const span = columns.length;
  return (
    <Panel className={cn('overflow-hidden', className)}>
      <table data-st="grid">
        <thead data-st="colhead">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                data-st-num={col.numeric ? '' : undefined}
                className={col.thClassName}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={span} className="p-6">
                <Spinner />
              </td>
            </tr>
          ) : !rows?.length ? (
            <tr>
              <td
                colSpan={span}
                className="px-4 py-6 text-center text-[var(--st-text-faint)]"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((item) => (
              <tr
                key={rowKey(item)}
                data-st="row"
                data-st-open={rowActive?.(item) ? '' : undefined}
              >
                {columns.map((col, i) => (
                  <td
                    key={i}
                    data-st-num={col.numeric ? '' : undefined}
                    className={col.tdClassName}
                  >
                    {col.cell(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Panel>
  );
}

export default DataTable;
