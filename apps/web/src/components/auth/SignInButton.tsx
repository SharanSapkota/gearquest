'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { SignInPanel } from './SignInPanel';

// The panel (and its Google button) only mounts while the popover is open: Google Identity Services
// keeps a single active callback per page, so a hidden second button would hijack the visible one.
export function SignInButton({ label }: { label?: string }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  return (
    <details className="popover" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className={`${buttonClass()} popover__trigger`}>{label ?? t('nav.signIn')}</summary>
      <div className="popover__panel popover__panel--wide">{open && <SignInPanel />}</div>
    </details>
  );
}
