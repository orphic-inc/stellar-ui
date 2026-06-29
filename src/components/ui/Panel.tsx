import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type PanelProps = {
  children: ReactNode;
  className?: string;
  /** Render as a different element (e.g. `form`, `section`). */
  as?: ElementType;
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'>;

/**
 * The `panel` Role — a surface card. Drops bg/border/rounded onto the token
 * contract so themes repaint it; callers keep layout (padding, spacing) via
 * `className`. Does NOT force `overflow-hidden` — a table panel wants it to clip
 * corners, a dropdown host does not, so the caller decides.
 */
const Panel = ({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: PanelProps) => (
  <Tag data-st="panel" className={className} {...rest}>
    {children}
  </Tag>
);

export default Panel;
