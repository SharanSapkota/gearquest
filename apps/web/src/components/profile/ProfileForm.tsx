'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { LOCALES, USER_ROLES, updateProfileSchema, type UpdateProfileInput } from '@gearshare/shared';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me, type UserRole } from '@/lib/api';
import { cleanPhone, toE164 } from '@/lib/phone';
import { PhoneField, PhonePrivacyNote } from './PhoneField';

type FormError = 'phone' | 'ownerPhone' | 'consent' | 'phoneInUse' | 'generic' | null;

const isOwnerRole = (role?: UserRole) => role === 'owner' || role === 'both';

export function ProfileForm({ user, initialRole }: { user: Me; initialRole?: UserRole }) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<FormError>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? '',
      phone: user.phone ?? '',
      language: user.language,
      role: initialRole ?? user.role ?? 'renter',
      whatsappShareConsent: user.whatsappShareConsent,
    },
  });
  const owner = isOwnerRole(useWatch({ control, name: 'role' }));
  const phoneValue = useWatch({ control, name: 'phone' }) ?? '';

  const onSubmit = async (values: UpdateProfileInput) => {
    setError(null);
    const phone = cleanPhone(values.phone ?? '');
    // Same rules as the API (which enforces them): owners need a valid phone and consent.
    if (phone && !toE164(phone)) return setError('phone');
    if (owner && !phone) return setError('ownerPhone');
    if (owner && !values.whatsappShareConsent) return setError('consent');
    try {
      await api.updateMe({ ...values, phone });
      router.push(`/users/${user.id}`);
      router.refresh();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(
        code === 'users.invalidPhone'
          ? 'phone'
          : code === 'owner.phoneRequired'
            ? 'ownerPhone'
            : code === 'owner.consentRequired'
              ? 'consent'
              : code === 'users.phoneInUse'
                ? 'phoneInUse'
                : 'generic',
      );
    }
  };

  const phoneError =
    error === 'phone'
      ? t('profile.phoneInvalid')
      : error === 'ownerPhone'
        ? t('profile.ownerPhoneRequired')
        : undefined;

  return (
    <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
      <Field label={t('profile.name')} error={errors.name ? t('profile.nameRequired') : undefined}>
        <Input {...register('name')} maxLength={100} autoComplete="name" />
      </Field>
      <Field label={t('profile.bio')}>
        <Textarea {...register('bio')} rows={4} maxLength={1000} />
      </Field>
      <Field label={t('profile.role')}>
        <Select {...register('role')}>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`profile.roles.${r}`)}
            </option>
          ))}
        </Select>
      </Field>
      <PhoneField
        label={t('profile.phone')}
        error={phoneError}
        value={phoneValue}
        onChange={(v) => setValue('phone', v)}
        required={owner}
      />
      {owner && (
        <>
          <PhonePrivacyNote text={t('profile.privacyText')} />
          <label className="check check--top">
            <input type="checkbox" {...register('whatsappShareConsent')} />
            <span>{t('profile.consent')}</span>
          </label>
          {error === 'consent' && (
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
      {error === 'phoneInUse' && <p role="alert" className="form-error">{t('profile.phoneInUse')}</p>}
      {error === 'generic' && <p role="alert" className="form-error">{t('profile.saveFailed')}</p>}
    </form>
  );
}
