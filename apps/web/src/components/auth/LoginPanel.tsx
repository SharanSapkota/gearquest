'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { nextParam } from '@/lib/safeRedirect';
import { GoogleAuthButton } from './GoogleAuthButton';

// /login: Google only. A Google account without a GearQuest account is not created here.
export function LoginPanel({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const tLegal = useTranslations('legal');
  return (
    <div className="signin">
      <p className="popover__note">{tLegal('disclaimer')}</p>
      <GoogleAuthButton intent="signin" next={next} />
      <p className="note">
        {t('noAccount')}{' '}
        <Link href={`/signup${next ? `?next=${nextParam(next)}` : ''}`}>{t('signUpLink')}</Link>
      </p>
    </div>
  );
}
