'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { SignupData } from '@gearquest/shared';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type AuthResult } from '@/lib/api';
import { afterLoginPath, signupErrorFromCode, type SignupError } from '@/lib/roles';
import { nextParam } from '@/lib/safeRedirect';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const DEV = process.env.NODE_ENV === 'development';

// "Continue with Google" for both flows. The browser only ever hands Google's ID token to the API;
// the API verifies it. signin: an unknown Google account is NOT created and is sent on to
// /signup/complete. signup: the account is created with the role/terms/phone chosen before.
export function GoogleAuthButton({
  intent,
  signupData,
  next,
  onSignupError,
}: {
  intent: 'signin' | 'signup';
  signupData?: SignupData;
  // Safe locale-less path to return to after signing in.
  next?: string;
  // The API rejected the signup data (e.g. a rule the form missed): let the form show it inline.
  onSignupError?: (error: SignupError) => void;
}) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const finish = (res: AuthResult) => {
    if (res.status === 'NEW_USER') {
      router.push(`/signup/complete${next ? `?next=${nextParam(next)}` : ''}`);
      return;
    }
    router.replace(afterLoginPath(res.user, next));
    router.refresh();
  };

  const onCredential = async (idToken: string | undefined) => {
    if (!idToken) return setState('error');
    setState('loading');
    try {
      finish(await api.googleAuth(idToken, intent, signupData));
    } catch (err) {
      const formError = err instanceof ApiError ? signupErrorFromCode(err.code) : undefined;
      if (formError && onSignupError) {
        onSignupError(formError);
        setState('idle');
        return;
      }
      setState('error');
    }
  };

  const onGoogleError = () => {
    if (DEV) {
      console.warn(
        '[auth] Google sign-in failed. Check that this exact origin (e.g. http://localhost:3000) is an authorized JavaScript origin for NEXT_PUBLIC_GOOGLE_CLIENT_ID in Google Cloud.',
      );
    }
    setState('error');
  };

  if (!CLIENT_ID) {
    return (
      <p role="alert" className="form-error">
        {t('notConfigured')} {DEV && t('notConfiguredDev', { name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' })}
      </p>
    );
  }
  return (
    <div className="signin">
      <div className="signin__google" aria-busy={state === 'loading'}>
        {/* Google renders its own button text; follow the app language, not the browser's. */}
        <GoogleOAuthProvider clientId={CLIENT_ID} locale={locale} onScriptLoadError={onGoogleError}>
          <GoogleLogin
            onSuccess={(res) => void onCredential(res.credential)}
            onError={onGoogleError}
            text="continue_with"
            shape="pill"
            size="large"
          />
        </GoogleOAuthProvider>
      </div>
      {state === 'loading' && <p aria-live="polite">{t('signingIn')}</p>}
      {state === 'error' && (
        <p role="alert" className="form-error">
          {t('signInFailed')}
        </p>
      )}
    </div>
  );
}
