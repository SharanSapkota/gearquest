'use client';

import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/Sheet';
import { SignInPanel } from './SignInPanel';

// Phone sign-in (opened from the bottom tab bar).
export default function SignInSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations('nav');
  return (
    <Sheet open onClose={onClose} title={t('signIn')}>
      <SignInPanel onSignedIn={onClose} />
    </Sheet>
  );
}
