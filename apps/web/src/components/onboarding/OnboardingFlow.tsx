'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { LOCALES } from '@gearshare/shared';
import { PhoneField, PhonePrivacyNote } from '@/components/profile/PhoneField';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { CompassIcon, HandshakeIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me, type UserRole } from '@/lib/api';
import { PHONE_PREFIX, toE164 } from '@/lib/phone';

type Step = 1 | 2 | 3;
type Errors = Partial<Record<'role' | 'phone' | 'consent' | 'form', string>>;

const isOwnerRole = (role: UserRole | null) => role === 'owner' || role === 'both';

function RoleCard({
  checked,
  onSelect,
  icon,
  title,
  text,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <label className={checked ? 'role-card role-card--checked' : 'role-card'}>
      <input type="radio" name="role" checked={checked} onChange={onSelect} className="sr-only" />
      <span className="role-card__icon">{icon}</span>
      <span className="role-card__title">{title}</span>
      <span className="role-card__text">{text}</span>
    </label>
  );
}

// Mandatory first-run flow: 1) role, 2) details (owners: phone + WhatsApp consent), 3) owners: first gear.
// Onboarding is marked complete when step 2 is saved; step 3 only offers the next action.
export function OnboardingFlow({ user, next }: { user: Me; next: string }) {
  const t = useTranslations('onboarding');
  const tAll = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole | null>(user.role ?? null);
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState(locale);
  const [phone, setPhone] = useState(user.phone ?? PHONE_PREFIX);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const owner = isOwnerRole(role);
  const total = role === 'renter' ? 2 : 3;

  // Refresh so the header and tab bar pick up the new role.
  const leave = (href: string) => {
    router.push(href);
    router.refresh();
  };

  const chooseRole = () => {
    if (!role) return setErrors({ role: t('roleHint') });
    setErrors({});
    setStep(2);
  };

  const save = async () => {
    if (!role) return;
    const e164 = owner ? toE164(phone) : null;
    const nextErrors: Errors = {};
    if (owner && !e164) nextErrors.phone = t('phoneInvalid');
    if (owner && !consent) nextErrors.consent = t('consentRequired');
    if (!name.trim()) nextErrors.form = tAll('profile.nameRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await api.completeOnboarding(
        owner
          ? { role, name: name.trim(), phone: e164 ?? '', whatsappShareConsent: consent }
          : { role, name: name.trim(), language: language as (typeof LOCALES)[number] },
      );
      // No refresh here: the page would redirect a finished user away before step 3 shows.
      if (owner) {
        setStep(3);
      } else {
        router.replace(next, { locale: language });
        router.refresh();
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'users.invalidPhone' || code === 'owner.phoneRequired') {
        setErrors({ phone: t('phoneInvalid') });
      } else if (code === 'owner.consentRequired') {
        setErrors({ consent: t('consentRequired') });
      } else {
        setErrors({ form: t('saveFailed') });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding__progress">
        <p className="note">{t('progress', { current: step, total })}</p>
        <ol className="steps" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <li key={i} className={i < step ? 'steps__item steps__item--done' : 'steps__item'} />
          ))}
        </ol>
      </div>

      {step === 1 && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            chooseRole();
          }}
        >
          <fieldset className="field">
            <legend>
              <h2>{t('roleTitle')}</h2>
            </legend>
            <div className="role-cards">
              <RoleCard
                checked={role === 'renter'}
                onSelect={() => setRole('renter')}
                icon={<CompassIcon size={32} />}
                title={t('renterTitle')}
                text={t('renterText')}
              />
              <RoleCard
                checked={role === 'owner'}
                onSelect={() => setRole('owner')}
                icon={<HandshakeIcon size={32} />}
                title={t('ownerTitle')}
                text={t('ownerText')}
              />
            </div>
            <label className="check">
              <input
                type="radio"
                name="role"
                checked={role === 'both'}
                onChange={() => setRole('both')}
              />
              {t('both')}
            </label>
            <small>{t('roleHint')}</small>
            {errors.role && <span role="alert">{errors.role}</span>}
          </fieldset>
          <Button type="submit" block disabled={!role}>
            {t('continue')}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form
          className="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2>{owner ? t('contactTitle') : t('detailsTitle')}</h2>
          <Field label={t('displayName')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
          </Field>
          {owner ? (
            <>
              <PhoneField
                label={t('phone')}
                hint={t('phoneHint')}
                error={errors.phone}
                value={phone}
                onChange={setPhone}
                required
              />
              <PhonePrivacyNote title={t('privacyTitle')} text={t('privacyText')} />
              <label className="check check--top">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={errors.consent ? true : undefined}
                />
                <span>{t('consent')}</span>
              </label>
              {errors.consent && <p role="alert" className="form-error">{errors.consent}</p>}
            </>
          ) : (
            <>
              <Field label={t('language')}>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {tAll(`language.${l}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="note">{t('renterPhoneNote')}</p>
            </>
          )}
          {errors.form && <p role="alert" className="form-error">{errors.form}</p>}
          <div className="onboarding__actions">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={saving}>
              {t('back')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('saving') : owner ? t('continue') : t('finish')}
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="onboarding__done">
          <span className="state__art">
            <ShieldCheckIcon size={34} />
          </span>
          <h2>{t('gearTitle')}</h2>
          <p>{t('gearText')}</p>
          <Button block onClick={() => leave('/gear/new')}>
            {t('addGear')}
          </Button>
          <Button variant="ghost" onClick={() => leave(next)}>
            {t('skip')}
          </Button>
        </div>
      )}
    </div>
  );
}
