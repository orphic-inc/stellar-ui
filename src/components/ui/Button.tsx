import type { ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

/**
 * - `primary` — filled accent CTA (`control -primary`; carries its own padding).
 * - `success` — filled affirmative CTA (`control -primary -success`).
 * - `warning` — filled cautionary CTA (`control -primary -warning`; e.g. a
 *   broadcast-to-all "Send" that wants the amber hue, not red or indigo).
 * - `danger` — filled destructive CTA (`control -primary -danger`).
 * - `link` — text-link button (plain `control`; the contract zeroes padding).
 * - `link-danger` — destructive text-link (`control -danger`, red on hover).
 *
 * The padded variants come from `-primary`; `link`/`link-danger` are deliberately
 * unpadded — don't add `px-*`/`py-*`, the contract's `padding:0` would beat it.
 */
export type ButtonVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'link'
  | 'link-danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantHooks: Record<ButtonVariant, Record<string, string>> = {
  primary: { 'data-st': 'control', 'data-st-primary': '' },
  success: {
    'data-st': 'control',
    'data-st-primary': '',
    'data-st-success': ''
  },
  warning: {
    'data-st': 'control',
    'data-st-primary': '',
    'data-st-warning': ''
  },
  danger: { 'data-st': 'control', 'data-st-primary': '', 'data-st-danger': '' },
  link: { 'data-st': 'control' },
  'link-danger': { 'data-st': 'control', 'data-st-danger': '' }
};

const Button = ({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={cn('transition-colors', className)}
    {...variantHooks[variant]}
    {...rest}
  />
);

export default Button;
