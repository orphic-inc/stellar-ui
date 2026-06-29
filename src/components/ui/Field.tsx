import type { InputHTMLAttributes, ReactNode } from 'react';
import cn from 'classnames';

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label?: ReactNode;
  /** Muted aside after the label, e.g. "(optional)". */
  hint?: ReactNode;
  /** Class on the `<input>` (the wrapper takes `containerClassName`). */
  className?: string;
  containerClassName?: string;
};

/**
 * A labeled form input — the `field` Role, with the label decomposed to `meta`
 * (per ADR-0006, labels don't get their own Role). `field` paints bg/border/
 * padding from tokens, so callers add only layout (`w-full` is the default).
 * The required `*` and hint paint from status/faint tokens so they stay legible
 * on a light theme.
 */
const Field = ({
  label,
  hint,
  id,
  required,
  className,
  containerClassName,
  ...rest
}: FieldProps) => (
  <div className={containerClassName}>
    {label && (
      <label htmlFor={id} data-st="meta" className="block text-xs mb-1">
        {label}
        {required && <span className="text-[var(--st-danger)]"> *</span>}
        {hint && <span className="text-[var(--st-text-faint)]"> {hint}</span>}
      </label>
    )}
    <input
      id={id}
      required={required}
      data-st="field"
      className={cn('w-full', className)}
      {...rest}
    />
  </div>
);

export default Field;
