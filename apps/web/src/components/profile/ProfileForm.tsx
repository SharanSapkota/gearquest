'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LOCALES, updateProfileSchema, type UpdateProfileInput } from '@gearshare/shared';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type Me } from '@/lib/api';

export function ProfileForm({ user }: { user: Me }) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<'phone' | 'generic' | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? '',
      phone: user.phone ?? '',
      language: user.language,
    },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    setError(null);
    try {
      await api.updateMe(values);
      router.push(`/users/${user.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'users.invalidPhone' ? 'phone' : 'generic');
    }
  };

  return (
    <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
      <label className="field">
        {t('profile.name')}
        <input {...register('name')} maxLength={100} autoComplete="name" />
        {errors.name && <span role="alert">{t('profile.nameRequired')}</span>}
      </label>
      <label className="field">
        {t('profile.bio')}
        <textarea {...register('bio')} rows={4} maxLength={1000} />
      </label>
      <label className="field">
        {t('profile.phone')}
        <input
          {...register('phone')}
          type="tel"
          autoComplete="tel"
          placeholder="+358 40 123 4567"
        />
        <small>{t('profile.phoneNote')}</small>
        {error === 'phone' && <span role="alert">{t('profile.phoneInvalid')}</span>}
      </label>
      <label className="field">
        {t('profile.language')}
        <select {...register('language')}>
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {t(`language.${l}`)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('profile.saving') : t('profile.save')}
      </button>
      {error === 'generic' && <p role="alert">{t('profile.saveFailed')}</p>}
    </form>
  );
}
