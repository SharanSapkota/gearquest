'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Anchored panel under its trigger (desktop). Closes on outside press and Escape; focus returns
// to the trigger. Callers switch to <Sheet> on phones.
export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = 'start',
  label,
  className,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  label: string;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onClose();
      root.current?.querySelector<HTMLElement>('[data-popover-trigger]')?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={['popwrap', className].filter(Boolean).join(' ')} ref={root}>
      {trigger}
      {open && (
        <div className={`pop pop--${align}`} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
}
