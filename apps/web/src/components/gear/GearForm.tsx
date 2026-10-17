'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { CATEGORIES, CONDITIONS } from '@gearshare/shared';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api, type OwnerGear } from '@/lib/api';
import {
  centsToEuros,
  validateGearForm,
  type GearFormErrors,
  type GearFormField,
  type GearFormValues,
} from '@/lib/gearForm';
import { LocationPicker } from './LocationPicker';
import { PhotoUploader, type PhotoState } from './PhotoUploader';

const initialValues = (gear?: OwnerGear): GearFormValues => ({
  title: gear?.title ?? '',
  description: gear?.description ?? '',
  category: gear?.category ?? '',
  condition: gear?.condition ?? '',
  city: gear?.city ?? '',
  location: gear?.exactLocation ?? null,
  hourly: gear?.pricing.hourlyCents !== undefined,
  daily: gear?.pricing.dailyCents !== undefined,
  hourlyPrice: gear?.pricing.hourlyCents !== undefined ? centsToEuros(gear.pricing.hourlyCents) : '',
  dailyPrice: gear?.pricing.dailyCents !== undefined ? centsToEuros(gear.pricing.dailyCents) : '',
  minHours: gear?.pricing.minHours !== undefined ? String(gear.pricing.minHours) : '',
});

// Same form for creating and editing. In edit mode `gear` is the owner's own listing.
export function GearForm({ gear }: { gear?: OwnerGear }) {
  const t = useTranslations('gearForm');
  const tAll = useTranslations();
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(gear));
  const [photos, setPhotos] = useState<PhotoState>({ urls: gear?.images ?? [], busy: false, hasError: false });
  const [errors, setErrors] = useState<GearFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const onPhotosChange = useCallback((state: PhotoState) => setPhotos(state), []);
  const set = <K extends keyof GearFormValues>(key: K, value: GearFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const err = (field: GearFormField) => (errors[field] ? t(`errors.${field}`) : undefined);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailed(false);
    if (photos.busy || photos.hasError) {
      setErrors({ images: 'images' });
      return;
    }
    const result = validateGearForm(values, photos.urls);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (gear) {
        // Only send the location when it moved, so the stored approximate pin is not re-rolled.
        const { location, ...rest } = result.data;
        const moved =
          location.lng !== gear.exactLocation?.lng || location.lat !== gear.exactLocation?.lat;
        await api.updateGear(gear.id, moved ? result.data : rest);
        router.push(`/gear/${gear.id}`);
      } else {
        const created = await api.createGear(result.data);
        router.push(`/gear/${created.id}`);
      }
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'gear.invalidImageUrl') {
        setErrors({ images: 'images' });
      } else {
        setFailed(true);
      }
      setSubmitting(false);
    }
  };

  return (
    <form className="form gear-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <Field label={t('title')} error={err('title')}>
        <Input value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={120} />
      </Field>
      <Field label={t('description')} error={err('description')}>
        <Textarea
          rows={5}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={5000}
        />
      </Field>
      <Field label={t('category')} error={err('category')}>
        <Select value={values.category} onChange={(e) => set('category', e.target.value as never)}>
          <option value="" disabled>
            {t('choose')}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tAll(`categories.${c}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('condition')} error={err('condition')}>
        <Select value={values.condition} onChange={(e) => set('condition', e.target.value as never)}>
          <option value="" disabled>
            {t('choose')}
          </option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {tAll(`conditions.${c}`)}
            </option>
          ))}
        </Select>
      </Field>

      <PhotoUploader
        initialUrls={gear?.images ?? []}
        onChange={onPhotosChange}
        errorText={errors.images ? (photos.busy || photos.hasError ? t('photos.pending') : t('errors.images')) : undefined}
      />

      <LocationPicker
        position={values.location}
        onPositionChange={(p) => set('location', p)}
        city={values.city}
        onCityChange={(c) => set('city', c)}
        locationError={err('location')}
        cityError={err('city')}
      />

      <fieldset className="field">
        <legend>{t('pricing.label')}</legend>
        <Switch
          checked={values.hourly}
          onChange={(e) => set('hourly', e.target.checked)}
          label={t('pricing.hourly')}
        />
        {values.hourly && (
          <>
            <Field label={t('pricing.hourlyPrice')} error={err('hourlyPrice')}>
              <Input
                inputMode="decimal"
                value={values.hourlyPrice}
                onChange={(e) => set('hourlyPrice', e.target.value)}
                placeholder="5.00"
              />
            </Field>
            <Field label={t('pricing.minHours')} hint={t('pricing.minHoursHint')} error={err('minHours')}>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={values.minHours}
                onChange={(e) => set('minHours', e.target.value)}
                placeholder="1"
              />
            </Field>
          </>
        )}
        <Switch
          checked={values.daily}
          onChange={(e) => set('daily', e.target.checked)}
          label={t('pricing.daily')}
        />
        {values.daily && (
          <Field label={t('pricing.dailyPrice')} error={err('dailyPrice')}>
            <Input
              inputMode="decimal"
              value={values.dailyPrice}
              onChange={(e) => set('dailyPrice', e.target.value)}
              placeholder="20.00"
            />
          </Field>
        )}
        {err('pricing') && <span role="alert">{err('pricing')}</span>}
      </fieldset>

      <Button type="submit" block disabled={submitting || photos.busy}>
        {submitting ? t('saving') : gear ? t('save') : t('create')}
      </Button>
      {failed && (
        <p role="alert" className="form-error">
          {t('saveFailed')}
        </p>
      )}
    </form>
  );
}
