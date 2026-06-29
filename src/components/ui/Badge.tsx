import type { ReactNode } from 'react';

/**
 * The `chip` Role — a small bordered status token (account state, tag, flag).
 * `default` is the neutral muted chip; the status variants paint from the
 * `--st-warning/info/success/danger` tokens. `mono` renders format codes in the
 * mono face. Use this for the "Disabled"-style pills, not a hand-rolled
 * `bg-red-900/50` span (which goes illegible on a light theme).
 */
export type BadgeVariant =
  | 'default'
  | 'warning'
  | 'info'
  | 'success'
  | 'danger';

type BadgeProps = {
  variant?: BadgeVariant;
  mono?: boolean;
  className?: string;
  children: ReactNode;
};

const variantHook: Record<BadgeVariant, string | undefined> = {
  default: undefined,
  warning: 'data-st-warning',
  info: 'data-st-info',
  success: 'data-st-success',
  danger: 'data-st-danger'
};

const Badge = ({
  variant = 'default',
  mono,
  className,
  children
}: BadgeProps) => {
  const hook = variantHook[variant];
  return (
    <span
      data-st="chip"
      {...(hook ? { [hook]: '' } : {})}
      {...(mono ? { 'data-st-mono': '' } : {})}
      className={className}
    >
      {children}
    </span>
  );
};

export default Badge;
