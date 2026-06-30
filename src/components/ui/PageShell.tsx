import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';

export type PageWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const widthClass: Record<PageWidth, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl'
};

type PageShellProps = {
  title: ReactNode;
  /** Right-aligned header slot — typically an add/toggle `Button`. */
  actions?: ReactNode;
  /**
   * Back-link target above the title. Defaults to the staff Toolbox so every
   * tool page carries the same return affordance — pass a different path to
   * retarget, or `null` to omit the link entirely (non-tool pages).
   */
  backTo?: string | null;
  backLabel?: ReactNode;
  width?: PageWidth;
  className?: string;
  children: ReactNode;
};

/**
 * The standard page wrapper for staff/admin tools: centered column at a chosen
 * width, the title as `prose -strong`, a "← Toolbox" back-link (on by default so
 * the return affordance is consistent and can't be forgotten), and a header
 * actions slot. Replaces the per-page hand-rolled shell (which drifted across
 * five different max-widths and an inconsistent back-link) so every tool page
 * reads the same.
 */
const PageShell = ({
  title,
  actions,
  backTo = '/private/staff/tools',
  backLabel = '← Toolbox',
  width = 'md',
  className,
  children
}: PageShellProps) => (
  <div
    className={cn('mx-auto px-4 py-6 space-y-4', widthClass[width], className)}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        {backTo && (
          <Link to={backTo} data-st="control" className="text-sm">
            {backLabel}
          </Link>
        )}
        <h2
          data-st="prose"
          data-st-strong
          className={cn('text-2xl font-bold', backTo && 'mt-1')}
        >
          {title}
        </h2>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export default PageShell;
