'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  LOCALES,
  USER_ROLES,
  toE164,
  updateProfileSchema,
  type UpdateProfileInput,
} from '@gearshare/shared';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { LockIcon } from '@/components/ui/icons';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me } from '@/lib/api';
import { isOwnerRole } from '@/lib/onboarding';
import { PhoneInput, cleanPhone } from './PhoneInput';

type FormError = 'phoneInvalid' | 'phoneRequired' | 'consentRequired' | 'phoneInUse' | 'generic';

const API_ERRORS: Record<string, FormError> = {
  'users.invalidPhone': 'phoneInvalid',
  'users.phoneRequired': 'phoneRequired',
  'users.consentRequired': 'consentRequired',
  'users.phoneInUse': 'phoneInUse',
};

// `becomeOwner` preselects the owner role (from "Become an owner" and the add-gear gate).
// Owners (and "both") need a phone and WhatsApp consent; the API enforces the same rule.
export function ProfileForm({
  user,
  becomeOwner = false,
  next,
}: {
  user: Me;
  becomeOwner?: boolean;
  next: string;
}) {
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
      role: becomeOwner && !isOwnerRole(user.role) ? 'owner' : (user.role ?? 'renter'),
      whatsappShareConsent: user.whatsappShareConsent,
    },
  });
  const owner = isOwnerRole(useWatch({ control, name: 'role' }));

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
      <Field label={t('profile.role')} hint={t('profile.roleOwnerNeeds')}>
        <Select {...register('role')}>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={t('profile.phone')}
        hint={owner ? t('onboarding.ownerPhoneHint') : t('profile.phoneNote')}
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
              <strong>{t('onboarding.privacyTitle')}</strong>
              <p>{t('onboarding.privacyBody')}</p>
            </div>
          </div>
          <label className="check check--top">
            <input type="checkbox" {...register('whatsappShareConsent')} />
            <span>{t('onboarding.consent')}</span>
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
