'use client';

import { useTranslations } from 'next-intl';
import { PhoneInput } from '@/components/profile/PhoneInput';
import { Field } from '@/components/ui/Field';
import { LockIcon } from '@/components/ui/icons';
import type { SignupError } from '@/lib/roles';

// The mandatory owner contact step: phone (+358 default, E.164, type=tel) and the WhatsApp
// consent. Shared by signup, signup/complete and "Become an owner".
export function OwnerContactFields({
  phone,
  consent,
  onChange,
  error,
}: {
  phone: string;
  consent: boolean;
  onChange: (patch: { phone?: string; consent?: boolean }) => void;
  error: SignupError | null;
}) {
  const t = useTranslations();
  const phoneError =
    error === 'phoneRequired'
      ? t('signup.phoneRequired')
      : error === 'phoneInvalid'
        ? t('profile.phoneInvalid')
        : undefined;
  return (
    <>
      <Field label={t('profile.phone')} hint={t('signup.ownerPhoneHint')} error={phoneError}>
        <PhoneInput value={phone} onValueChange={(value) => onChange({ phone: value })} required />
      </Field>
      <div className="privacy-note">
        <LockIcon size={20} />
        <div>
          <strong>{t('signup.privacyTitle')}</strong>
          <p>{t('signup.privacyBody')}</p>
        </div>
      </div>
      <label className="check check--top">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
        />
        <span>{t('signup.consent')}</span>
      </label>
      {error === 'consentRequired' && (
        <p role="alert" className="form-error">
          {t('signup.consentRequired')}
        </p>
      )}
    </>
  );
}
