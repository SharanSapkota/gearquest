'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { ApiError, api } from '@/lib/api';
import { afterLoginPath } from '@/lib/onboarding';
import { nextParam } from '@/lib/safeRedirect';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const DEV = process.env.NODE_ENV === 'development';
console.log(CLIENT_ID, 'CLIENT_ID');
// Sign in and sign up are the same Google flow. Signup additionally requires accepting the terms,
// which the API records; a login by someone without an account is sent to the signup page.
// Used by the login/signup pages, the header popover and the phone sign-in sheet.
export function SignInPanel({
  mode = 'login',
  next,
  onSignedIn,
}: {
  mode?: 'login' | 'signup';
  // Locale-less path to return to. Defaults to the current page.
  next?: string;
  onSignedIn?: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const returnTo = () => next ?? `${pathname}${window.location.search}`;

  const onCredential = async (idToken: string | undefined) => {
    if (!idToken) return setState('error');
    setState('loading');
    try {
      const { user } = await api.loginWithGoogle(idToken, mode === 'signup' && accepted);
      onSignedIn?.();
      router.replace(afterLoginPath(user, returnTo()));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'auth.termsRequired') {
        onSignedIn?.();
        router.push(`/signup?next=${nextParam(returnTo())}&terms=1`);
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

  const canContinue = mode === 'login' || accepted;
  const otherHref = `${mode === 'login' ? '/signup' : '/login'}${next ? `?next=${nextParam(next)}` : ''}`;

  return (
    <div className="signin">
      <p className="popover__note">{t('legal.disclaimer')}</p>
      {mode === 'signup' && (
        <label className="check check--top">
          <input
            type="checkbox"
            required
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            {t.rich('auth.acceptTerms', {
              terms: (chunks) => (
                <Link href="/terms" target="_blank">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
      )}
      {!CLIENT_ID ? (
        <p role="alert" className="form-error">
          {t('auth.notConfigured')}{' '}
          {DEV && t('auth.notConfiguredDev', { name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' })}
        </p>
      ) : canContinue ? (
        <div className="signin__google">
          <GoogleOAuthProvider clientId={CLIENT_ID} onScriptLoadError={onGoogleError}>
            <GoogleLogin
              onSuccess={(res) => void onCredential(res.credential)}
              onError={onGoogleError}
              text={mode === 'signup' ? 'signup_with' : 'signin_with'}
            />
          </GoogleOAuthProvider>
        </div>
      ) : (
        <>
          <Button variant="outline" block disabled aria-describedby="signin-terms-hint">
            {t('auth.continueWithGoogle')}
          </Button>
          <small id="signin-terms-hint" className="note">
            {t('auth.acceptTermsFirst')}
          </small>
        </>
      )}
      {state === 'loading' && <p aria-live="polite">{t('auth.signingIn')}</p>}
      {state === 'error' && (
        <p role="alert" className="form-error">
          {t('auth.signInFailed')}
        </p>
      )}
      <p className="note">
        {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
        <Link href={otherHref}>{mode === 'login' ? t('auth.signUpLink') : t('auth.logInLink')}</Link>
      </p>
    </div>
  );
}
