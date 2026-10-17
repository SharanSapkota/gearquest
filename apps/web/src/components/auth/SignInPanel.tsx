'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { API_URL, ApiError, api } from '@/lib/api';
import { safeRedirect } from '@/lib/safeRedirect';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const DEV = process.env.NODE_ENV !== 'production';

type Status = { kind: 'idle' | 'loading' } | { kind: 'error'; devHint?: string };

// The current page (locale-less), read at click time so this works in server-rendered popovers.
const currentPath = () => safeRedirect(`${window.location.pathname}${window.location.search}`);

// Disclaimer + Google sign-in. Sign in and sign up are the same Google flow; in signup mode the
// Terms checkbox must be ticked first, and the API only creates an account when it was.
// Used by the header popover, the phone sign-in sheet, /login and /signup.
export function SignInPanel({
  mode = 'signin',
  next,
  onSignedIn,
}: {
  mode?: 'signin' | 'signup';
  // Where to go afterwards. Without it (popover/sheet) the user stays on the current page.
  next?: string;
  onSignedIn?: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [accepted, setAccepted] = useState(false);
  const signup = mode === 'signup';

  const fail = (devHint?: string) => setStatus({ kind: 'error', devHint: DEV ? devHint : undefined });

  const onCredential = async (idToken: string | undefined) => {
    if (!idToken) return fail();
    if (signup && !accepted) return fail();
    setStatus({ kind: 'loading' });
    const target = next ?? currentPath();
    try {
      const { user } = await api.loginWithGoogle(idToken, signup && accepted);
      onSignedIn?.();
      if (!user.onboardingCompleted) {
        router.push({ pathname: '/onboarding', query: { next: target } });
      } else if (next !== undefined) {
        router.push(next);
      }
      router.refresh();
    } catch (err) {
      // A new account must come through the signup page (Terms acceptance).
      if (err instanceof ApiError && err.code === 'auth.termsRequired') {
        onSignedIn?.();
        router.push({ pathname: '/signup', query: { next: target } });
        return;
      }
      fail(
        err instanceof ApiError
          ? t('auth.dev.apiRejected', { code: err.code ?? String(err.status) })
          : t('auth.dev.apiUnreachable', { url: API_URL }),
      );
    }
  };

  const otherHref = (pathname: string) => (next ? { pathname, query: { next } } : pathname);

  return (
    <div className="signin">
      <p className="popover__note">{t('legal.disclaimer')}</p>
      {signup && (
        <label className="check signin__terms">
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
      {CLIENT_ID ? (
        <div className="signin__google" inert={signup && !accepted} aria-disabled={signup && !accepted}>
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <GoogleLogin
              text={signup ? 'signup_with' : 'signin_with'}
              onSuccess={(res) => void onCredential(res.credential)}
              onError={() => fail(t('auth.dev.googleError', { origin: window.location.origin }))}
            />
          </GoogleOAuthProvider>
        </div>
      ) : (
        <p role="alert" className="form-error">
          {t('auth.notConfigured')}
        </p>
      )}
      {signup && !accepted && <p className="note">{t('auth.acceptTermsFirst')}</p>}
      {status.kind === 'loading' && <p aria-live="polite">{t('auth.signingIn')}</p>}
      {status.kind === 'error' && (
        <p role="alert" className="form-error">
          {t('auth.signInFailed')}
          {status.devHint && <small className="signin__dev">{status.devHint}</small>}
        </p>
      )}
      <p className="note signin__switch">
        {signup ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
        <Link href={otherHref(signup ? '/login' : '/signup')} onClick={onSignedIn}>
          {signup ? t('auth.signInLink') : t('auth.signUpLink')}
        </Link>
      </p>
    </div>
  );
}
