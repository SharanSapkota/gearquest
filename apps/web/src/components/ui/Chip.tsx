import type { ButtonHTMLAttributes } from 'react';

// Toggle chip: `pressed` drives both the style and aria-pressed.
export function Chip({
  pressed,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      className={['chip', className].filter(Boolean).join(' ')}
      aria-pressed={pressed}
      {...rest}
    />
  );
}
