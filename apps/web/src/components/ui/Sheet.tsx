'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './Button';
import { CloseIcon } from './icons';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Bottom sheet on phones, side panel on desktop, centred dialog with variant="center" (or "wide").
// Escape and the scrim close it; focus is kept inside and restored on close.
export function Sheet({
  open,
  onClose,
  title,
  footer,
  variant = 'sheet',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: ReactNode;
  variant?: 'sheet' | 'center' | 'wide';
  children: ReactNode;
}) {
  const t = useTranslations('ui');
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  // Portalled to <body> so no ancestor stacking context (e.g. the full-screen map) can cover it.
  return createPortal(
    <div className={variant === 'center' ? 'sheet sheet--center' : variant === 'wide' ? 'sheet sheet--center sheet--wide' : 'sheet'}>
      <div className="sheet__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <h2 id={titleId}>{title}</h2>
          <IconButton label={t('close')} variant="ghost" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
