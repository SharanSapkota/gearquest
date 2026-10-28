import type { ButtonHTMLAttributes } from 'react';

// accent = red, the single attention colour ("Add gear", "Request"). Everything else is primary.
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

// Class names for anything that must look like a button (e.g. a <Link>).
export const buttonClass = ({ variant = 'primary', size = 'md', block }: StyleProps = {}) =>
  ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', block && 'btn--block']
    .filter(Boolean)
    .join(' ');

export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return (
    <button
      type={type}
      className={[buttonClass({ variant, size, block }), className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

// Icon-only button: `label` is required because it is the accessible name.
export function IconButton({
  label,
  variant = 'outline',
  className,
  children,
  type = 'button',
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string;
  variant?: ButtonVariant | 'float';
}) {
  const style = variant === 'float' ? 'btn btn--float btn--icon' : `${buttonClass({ variant })} btn--icon`;
  return (
    <button
      type={type}
      className={[style, className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
