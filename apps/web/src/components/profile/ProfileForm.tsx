'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LOCALES, updateProfileSchema, type UpdateProfileInput } from '@gearshare/shared';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
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
      <Field label={t('profile.name')} error={errors.name ? t('profile.nameRequired') : undefined}>
        <Input {...register('name')} maxLength={100} autoComplete="name" />
      </Field>
      <Field label={t('profile.bio')}>
        <Textarea {...register('bio')} rows={4} maxLength={1000} />
      </Field>
      <Field
        label={t('profile.phone')}
        hint={t('profile.phoneNote')}
        error={error === 'phone' ? t('profile.phoneInvalid') : undefined}
      >
        <Input
          {...register('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+358 40 123 4567"
        />
      </Field>
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
