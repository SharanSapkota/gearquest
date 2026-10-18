'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { LOCALES, toE164 } from '@gearshare/shared';
import { PhoneInput, PHONE_PREFIX, cleanPhone } from '@/components/profile/PhoneInput';
import { Button, buttonClass } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { BackpackIcon, CheckIcon, HandshakeIcon, LockIcon, TentIcon } from '@/components/ui/icons';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me, type UserRole } from '@/lib/api';
import { isOwnerRole } from '@/lib/onboarding';

type Step = 'role' | 'details' | 'gear';
type Locale = (typeof LOCALES)[number];
type DetailsError = 'phoneRequired' | 'phoneInvalid' | 'consentRequired' | 'generic';

// Shown once after signup. Step 1: role. Step 2: details (owners: phone + WhatsApp consent).
// Step 3 (owners only): add the first gear or skip. The API marks onboarding complete at step 2.
export function OnboardingFlow({
  user,
  locale,
  next,
  initialStep = 'role',
}: {
  user: Me;
  locale: Locale;
  next: string;
  initialStep?: Step;
}) {
  const t = useTranslations('onboarding');
  const tAll = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [role, setRole] = useState<UserRole | null>(user.role ?? null);
  const [roleMissing, setRoleMissing] = useState(false);
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState<Locale>(locale);
  const [phone, setPhone] = useState(user.phone ?? PHONE_PREFIX);
  const [consent, setConsent] = useState(user.whatsappShareConsent);
  const [error, setError] = useState<DetailsError | null>(null);
  const [saving, setSaving] = useState(false);

  const owner = isOwnerRole(role ?? undefined) || step === 'gear';
  const total = role && !owner ? 2 : 3;
  const stepNumber = step === 'role' ? 1 : step === 'details' ? 2 : 3;

  // Leaving onboarding: fresh server data so the header and tab bar pick up the new role.
  const leave = (path: string) => {
    router.replace(path);
    router.refresh();
  };

  const chooseRole = (e: FormEvent) => {
    e.preventDefault();
    if (!role) return setRoleMissing(true);
    setStep('details');
  };

  const submitDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError(null);
    const cleaned = cleanPhone(phone);
    if (owner) {
      if (!cleaned) return setError('phoneRequired');
      if (!toE164(cleaned)) return setError('phoneInvalid');
      if (!consent) return setError('consentRequired');
    }
    setSaving(true);
    try {
      await api.completeOnboarding({
        role,
        name: name.trim() || undefined,
        language,
        ...(owner && { phone: cleaned, whatsappShareConsent: true }),
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(
        code === 'users.invalidPhone'
          ? 'phoneInvalid'
          : code === 'users.phoneRequired'
            ? 'phoneRequired'
            : code === 'users.consentRequired'
              ? 'consentRequired'
              : 'generic',
      );
      setSaving(false);
      return;
    }
    // A language change switches the URL locale; owners land on step 3 in the new language.
    if (language !== locale) {
      const path = owner ? `/onboarding?step=gear&next=${encodeURIComponent(next)}` : next;
      router.replace(path, { locale: language });
      router.refresh();
      return;
    }
    if (owner) {
      setSaving(false);
      setStep('gear');
    } else {
      leave(next);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding__progress">
        <span className="note">{t('progress', { step: stepNumber, total })}</span>
        <div
          className="progress"
          role="progressbar"
          aria-label={t('progress', { step: stepNumber, total })}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={stepNumber}
        >
          <span style={{ width: `${(stepNumber / total) * 100}%` }} />
        </div>
      </div>

      {step === 'role' && (
        <form className="form" onSubmit={chooseRole} noValidate>
          <h2>{t('roleTitle')}</h2>
          <fieldset className="role-cards">
            <legend className="sr-only">{t('roleTitle')}</legend>
            {(
              [
                ['renter', <BackpackIcon key="i" size={26} />, t('roleRenter'), t('roleRenterBody')],
                ['owner', <TentIcon key="i" size={26} />, t('roleOwner'), t('roleOwnerBody')],
              ] as const
            ).map(([value, icon, title, body]) => (
              <label key={value} className="role-card">
                <input
                  type="radio"
                  name="role"
                  value={value}
                  className="sr-only"
                  checked={role === value}
                  onChange={() => {
                    setRole(value);
                    setRoleMissing(false);
                  }}
                />
                <span className="role-card__icon">{icon}</span>
                <strong>{title}</strong>
                <span>{body}</span>
                <CheckIcon size={22} className="role-card__check" />
              </label>
            ))}
          </fieldset>
          <label className="role-both">
            <input
              type="radio"
              name="role"
              value="both"
              checked={role === 'both'}
              onChange={() => {
                setRole('both');
                setRoleMissing(false);
              }}
            />
            <HandshakeIcon size={20} />
            {t('roleBoth')}
          </label>
          {role === 'both' && <p className="note">{t('roleBothSelected')}</p>}
          <p className="note">{t('roleHint')}</p>
          {roleMissing && (
            <p role="alert" className="form-error">
              {t('roleRequired')}
            </p>
          )}
          <div className="onboarding__actions">
            <Button type="submit">{t('continue')}</Button>
          </div>
        </form>
      )}

      {step === 'details' && (
        <form className="form" onSubmit={(e) => void submitDetails(e)} noValidate>
          <h2>{t('detailsTitle')}</h2>
          <Field label={tAll('profile.name')} hint={t('nameHint')}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoComplete="name"
            />
          </Field>
          <Field label={tAll('profile.language')}>
            <Select value={language} onChange={(e) => setLanguage(e.target.value as Locale)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {tAll(`language.${l}`)}
                </option>
              ))}
            </Select>
          </Field>
          {owner ? (
            <>
              <Field
                label={tAll('profile.phone')}
                hint={t('ownerPhoneHint')}
                error={
                  error === 'phoneRequired'
                    ? t('phoneRequired')
                    : error === 'phoneInvalid'
                      ? tAll('profile.phoneInvalid')
                      : undefined
                }
              >
                <PhoneInput value={phone} onValueChange={setPhone} required />
              </Field>
              <div className="privacy-note">
                <LockIcon size={20} />
                <div>
                  <strong>{t('privacyTitle')}</strong>
                  <p>{t('privacyBody')}</p>
                </div>
              </div>
              <label className="check check--top">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>{t('consent')}</span>
              </label>
              {error === 'consentRequired' && (
                <p role="alert" className="form-error">
                  {t('consentRequired')}
                </p>
              )}
            </>
          ) : (
            <p className="note">{t('renterPhoneNote')}</p>
          )}
          {error === 'generic' && (
            <p role="alert" className="form-error">
              {t('saveFailed')}
            </p>
          )}
          <div className="onboarding__actions">
            <Button variant="ghost" onClick={() => setStep('role')} disabled={saving}>
              {t('back')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('saving') : owner ? t('continue') : t('finish')}
            </Button>
          </div>
        </form>
      )}

      {step === 'gear' && (
        <div className="form">
          <h2>{t('gearTitle')}</h2>
          <p>{t('gearBody')}</p>
          <div className="onboarding__actions">
            <Link
              href="/gear/new"
              className={buttonClass()}
              onClick={(e) => {
                e.preventDefault();
                leave('/gear/new');
              }}
            >
              {t('addGear')}
            </Link>
            <Link
              href={next}
              onClick={(e) => {
                e.preventDefault();
                leave(next);
              }}
            >
              {t('skip')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
