'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function SignInButton({ label }: { label?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const onCredential = async (idToken: string | undefined) => {
    if (!idToken) return setState('error');
    setState('loading');
    try {
      await api.loginWithGoogle(idToken);
      router.refresh();
    } catch {
      setState('error');
    }
  };

  return (
    <details className="popover">
      <summary className="popover__trigger">{label ?? t('nav.signIn')}</summary>
      <div className="popover__panel popover__panel--wide">
        <p className="popover__note">{t('legal.disclaimer')}</p>
        {CLIENT_ID ? (
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <GoogleLogin
              onSuccess={(res) => void onCredential(res.credential)}
              onError={() => setState('error')}
            />
          </GoogleOAuthProvider>
        ) : (
          <p role="alert">{t('auth.notConfigured')}</p>
        )}
        {state === 'loading' && <p aria-live="polite">{t('auth.signingIn')}</p>}
        {state === 'error' && <p role="alert">{t('auth.signInFailed')}</p>}
      </div>
    </details>
  );
}
