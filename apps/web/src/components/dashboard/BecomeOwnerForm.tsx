'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { OwnerContactFields } from '@/components/auth/OwnerContactFields';
import { PHONE_PREFIX, cleanPhone } from '@/components/profile/PhoneInput';
import { Button } from '@/components/ui/Button';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me } from '@/lib/api';
import { signupErrorFromCode, validateOwnerContact, type SignupError } from '@/lib/roles';

// The phone + consent step for a renter becoming an owner (or an owner who still lacks them).
// A renter becomes "both": they keep renting and can switch to the hosting view.
export function BecomeOwnerForm({ user, next }: { user: Me; next: string }) {
  const t = useTranslations('becomeOwner');
  const router = useRouter();
  const [phone, setPhone] = useState(user.phone ?? PHONE_PREFIX);
  const [consent, setConsent] = useState(user.whatsappShareConsent);
  const [error, setError] = useState<SignupError | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateOwnerContact(phone, consent);
    if (problem) return setError(problem);
    setSaving(true);
    setFailed(false);
    try {
      await api.upgradeRole({
        role: user.role === 'owner' ? 'owner' : 'both',
        phone: cleanPhone(phone),
        whatsappShareConsent: true,
      });
      router.replace(next);
      router.refresh();
    } catch (err) {
      const formError = err instanceof ApiError ? signupErrorFromCode(err.code) : undefined;
      if (formError) setError(formError);
      else setFailed(true);
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={(e) => void submit(e)} noValidate>
      <OwnerContactFields
        phone={phone}
        consent={consent}
        error={error}
        onChange={(p) => {
          if (p.phone !== undefined) setPhone(p.phone);
          if (p.consent !== undefined) setConsent(p.consent);
          setError(null);
        }}
      />
      {failed && (
        <p role="alert" className="form-error">
          {t('failed')}
        </p>
      )}
      <Button type="submit" block disabled={saving}>
        {saving ? t('saving') : t('submit')}
      </Button>
    </form>
  );
}
