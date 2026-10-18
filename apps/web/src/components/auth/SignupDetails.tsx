'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { OwnerContactFields } from './OwnerContactFields';
import { isOwnerRole, type SignupDraft, type SignupError } from '@/lib/roles';

// Step 2 of signup (and part of /signup/complete): intermediary disclaimer, required terms, and
// for owner/both the mandatory phone + WhatsApp consent.
export function SignupDetails({
  draft,
  onChange,
  error,
}: {
  draft: SignupDraft;
  onChange: (patch: Partial<SignupDraft>) => void;
  error: SignupError | null;
}) {
  const t = useTranslations();
  const owner = isOwnerRole(draft.role ?? undefined);
  return (
    <div className="form">
      <p className="note">{t('legal.disclaimer')}</p>
      <label className="check check--top">
        <input
          type="checkbox"
          required
          checked={draft.terms}
          onChange={(e) => onChange({ terms: e.target.checked })}
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
      {error === 'termsRequired' && (
        <p role="alert" className="form-error">
          {t('auth.acceptTermsFirst')}
        </p>
      )}
      {owner ? (
        <OwnerContactFields
          phone={draft.phone}
          consent={draft.consent}
          onChange={(p) => onChange({ phone: p.phone ?? draft.phone, consent: p.consent ?? draft.consent })}
          error={error}
        />
      ) : (
        <p className="note">{t('signup.renterPhoneNote')}</p>
      )}
    </div>
  );
}
