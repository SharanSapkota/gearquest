'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { emptyDraft, toSignupData, validateDraft, type SignupDraft, type SignupError } from '@/lib/roles';
import { nextParam } from '@/lib/safeRedirect';
import { GoogleAuthButton } from './GoogleAuthButton';
import { RoleCards } from './RoleCards';
import { SignupDetails } from './SignupDetails';

type Step = 1 | 2 | 3;

// /signup. 1: role, 2: terms (+ phone and consent for owners), 3: Google. Nothing is sent to the
// API until Google has produced an ID token; the account is created only after the API verifies it.
export function SignupFlow({ next }: { next?: string }) {
  const t = useTranslations();
  const locale = useLocale() as 'fi' | 'en';
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
  const [error, setError] = useState<SignupError | null>(null);

  const patch = (p: Partial<SignupDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setError(null);
  };

  const toDetails = () => {
    if (!draft.role) return setError('roleRequired');
    setError(null);
    setStep(2);
  };
  const toGoogle = () => {
    const problem = validateDraft(draft);
    if (problem) return setError(problem);
    setStep(3);
  };

  return (
    <div className="onboarding">
      <div className="onboarding__progress">
        <span className="note">{t('signup.progress', { step, total: 3 })}</span>
        <div
          className="progress"
          role="progressbar"
          aria-label={t('signup.progress', { step, total: 3 })}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
        >
          <span style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div className="form">
          <h2>{t('signup.roleTitle')}</h2>
          <RoleCards
            value={draft.role}
            onChange={(role) => patch({ role })}
            error={error === 'roleRequired'}
          />
          <p className="note">{t('signup.roleHint')}</p>
          <div className="onboarding__actions">
            <Button onClick={toDetails}>{t('signup.continue')}</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="form">
          <h2>{t('signup.detailsTitle')}</h2>
          <SignupDetails draft={draft} onChange={patch} error={error} />
          <div className="onboarding__actions">
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t('signup.back')}
            </Button>
            <Button onClick={toGoogle}>{t('signup.continue')}</Button>
          </div>
        </div>
      )}

      {step === 3 && draft.role && (
        <div className="form">
          <h2>{t('signup.googleTitle')}</h2>
          <p>{t('signup.googleBody', { role: t(`roles.${draft.role}`) })}</p>
          <GoogleAuthButton
            intent="signup"
            signupData={toSignupData(draft, locale)}
            next={next}
            onSignupError={(e) => {
              setError(e);
              setStep(e === 'roleRequired' ? 1 : 2);
            }}
          />
          <div className="onboarding__actions">
            <Button variant="ghost" onClick={() => setStep(2)}>
              {t('signup.back')}
            </Button>
          </div>
        </div>
      )}

      <p className="note">
        {t('auth.haveAccount')}{' '}
        <Link href={`/login${next ? `?next=${nextParam(next)}` : ''}`}>{t('auth.logInLink')}</Link>
      </p>
    </div>
  );
}
