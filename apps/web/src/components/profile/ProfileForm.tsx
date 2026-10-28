'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  LOCALES,
  toE164,
  updateProfileSchema,
  type UpdateProfileInput,
} from '@gearquest/shared';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { LockIcon } from '@/components/ui/icons';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me } from '@/lib/api';
import { isOwnerRole } from '@/lib/roles';
import { PhoneInput, cleanPhone } from './PhoneInput';

type FormError = 'phoneInvalid' | 'phoneRequired' | 'consentRequired' | 'phoneInUse' | 'generic';

const API_ERRORS: Record<string, FormError> = {
  'users.invalidPhone': 'phoneInvalid',
  PHONE_REQUIRED: 'phoneRequired',
  CONSENT_REQUIRED: 'consentRequired',
  'users.phoneInUse': 'phoneInUse',
};

// Owners (and "both") need a phone and WhatsApp consent; the API enforces the same rule. The role
// itself is not edited here: becoming an owner goes through /become-owner.
export function ProfileForm({ user, next }: { user: Me; next: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<FormError | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? '',
      phone: user.phone ?? '',
      language: user.language,
      whatsappShareConsent: user.whatsappShareConsent,
    },
  });
  const owner = isOwnerRole(user.role);

  const onSubmit = async (values: UpdateProfileInput) => {
    setError(null);
    const phone = cleanPhone(values.phone ?? '');
    if (owner && !phone) return setError('phoneRequired');
    if (phone && !toE164(phone)) return setError('phoneInvalid');
    if (owner && !values.whatsappShareConsent) return setError('consentRequired');
    try {
      await api.updateMe({
        ...values,
        phone,
        // Consent is only asked from owners; renters keep whatever is on file.
        whatsappShareConsent: owner ? values.whatsappShareConsent : undefined,
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err instanceof ApiError && err.code && API_ERRORS[err.code]) || 'generic');
    }
  };

  const phoneError =
    error === 'phoneInvalid'
      ? t('profile.phoneInvalid')
      : error === 'phoneRequired'
        ? t('profile.phoneRequired')
        : error === 'phoneInUse'
          ? t('profile.phoneInUse')
          : undefined;

  return (
    <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
      <Field label={t('profile.name')} error={errors.name ? t('profile.nameRequired') : undefined}>
        <Input {...register('name')} maxLength={100} autoComplete="name" />
      </Field>
      <Field label={t('profile.bio')}>
        <Textarea {...register('bio')} rows={4} maxLength={1000} />
      </Field>
      <Field
        label={t('profile.phone')}
        hint={owner ? t('signup.ownerPhoneHint') : t('profile.phoneNote')}
        error={phoneError}
      >
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              name={field.name}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              required={owner}
            />
          )}
        />
      </Field>
      {owner && (
        <>
          <div className="privacy-note">
            <LockIcon size={20} />
            <div>
              <strong>{t('signup.privacyTitle')}</strong>
              <p>{t('signup.privacyBody')}</p>
            </div>
          </div>
          <label className="check check--top">
            <input type="checkbox" {...register('whatsappShareConsent')} />
            <span>{t('signup.consent')}</span>
          </label>
          {error === 'consentRequired' && (
            <p role="alert" className="form-error">
              {t('profile.consentRequired')}
            </p>
          )}
        </>
      )}
      <Field label={t('profile.language')}>
        <Select {...register('language')}>
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {t(`language.${l}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? t('profile.saving') : t('profile.save')}
      </Button>
      {error === 'generic' && <p role="alert" className="form-error">{t('profile.saveFailed')}</p>}
    </form>
  );
}
