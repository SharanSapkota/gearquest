'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { SignInPanel } from './SignInPanel';

export function SignInButton({ label }: { label?: string }) {
  const t = useTranslations();
  const popover = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (popover.current) popover.current.open = false;
  };
  return (
    <details className="popover" ref={popover}>
      <summary className={`${buttonClass()} popover__trigger`}>{label ?? t('nav.signIn')}</summary>
      <div
        className="popover__panel popover__panel--wide"
        onClick={(e) => (e.target as HTMLElement).closest('a') && close()}
      >
        <SignInPanel onSignedIn={close} />
      </div>
    </details>
  );
}
