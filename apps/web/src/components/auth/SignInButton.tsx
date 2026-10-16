'use client';

import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { SignInPanel } from './SignInPanel';

export function SignInButton({ label }: { label?: string }) {
  const t = useTranslations();
  return (
    <details className="popover">
      <summary className={`${buttonClass()} popover__trigger`}>{label ?? t('nav.signIn')}</summary>
      <div className="popover__panel popover__panel--wide">
        <SignInPanel />
      </div>
    </details>
  );
}
