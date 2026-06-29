import type { ReactNode } from 'react';
import cn from 'classnames';

type SectionHeadingProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The uppercase section label that sits above a panel/table on multi-section
 * pages (stats, queues). A `prose -strong` heading keeping the uppercase
 * tracking — so every section label reads the same instead of each page
 * re-deciding its `text-gray-300 uppercase` recipe.
 */
const SectionHeading = ({ children, className }: SectionHeadingProps) => (
  <h3
    data-st="prose"
    data-st-strong
    className={cn('text-sm font-semibold uppercase tracking-wider', className)}
  >
    {children}
  </h3>
);

export default SectionHeading;
