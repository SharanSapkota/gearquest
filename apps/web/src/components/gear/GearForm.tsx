'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { CATEGORIES, CONDITIONS } from '@gearshare/shared';
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
      <label className="field">
        {t('title')}
        <input value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={120} />
        {err('title') && <span role="alert">{err('title')}</span>}
      </label>
      <label className="field">
        {t('description')}
        <textarea
          rows={5}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={5000}
        />
        {err('description') && <span role="alert">{err('description')}</span>}
      </label>
      <label className="field">
        {t('category')}
        <select value={values.category} onChange={(e) => set('category', e.target.value as never)}>
          <option value="" disabled>
            {t('choose')}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tAll(`categories.${c}`)}
            </option>
          ))}
        </select>
        {err('category') && <span role="alert">{err('category')}</span>}
      </label>
      <label className="field">
        {t('condition')}
        <select value={values.condition} onChange={(e) => set('condition', e.target.value as never)}>
          <option value="" disabled>
            {t('choose')}
          </option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {tAll(`conditions.${c}`)}
            </option>
          ))}
        </select>
        {err('condition') && <span role="alert">{err('condition')}</span>}
      </label>

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
        <label className="check">
          <input
            type="checkbox"
            checked={values.hourly}
            onChange={(e) => set('hourly', e.target.checked)}
          />
          {t('pricing.hourly')}
        </label>
        {values.hourly && (
          <>
            <label className="field">
              {t('pricing.hourlyPrice')}
              <input
                inputMode="decimal"
                value={values.hourlyPrice}
                onChange={(e) => set('hourlyPrice', e.target.value)}
                placeholder="5.00"
              />
              {err('hourlyPrice') && <span role="alert">{err('hourlyPrice')}</span>}
            </label>
            <label className="field">
              {t('pricing.minHours')}
              <input
                inputMode="numeric"
                value={values.minHours}
                onChange={(e) => set('minHours', e.target.value)}
                placeholder="1"
              />
              <small>{t('pricing.minHoursHint')}</small>
              {err('minHours') && <span role="alert">{err('minHours')}</span>}
            </label>
          </>
        )}
        <label className="check">
          <input type="checkbox" checked={values.daily} onChange={(e) => set('daily', e.target.checked)} />
          {t('pricing.daily')}
        </label>
        {values.daily && (
          <label className="field">
            {t('pricing.dailyPrice')}
            <input
              inputMode="decimal"
              value={values.dailyPrice}
              onChange={(e) => set('dailyPrice', e.target.value)}
              placeholder="20.00"
            />
            {err('dailyPrice') && <span role="alert">{err('dailyPrice')}</span>}
          </label>
        )}
        {err('pricing') && <span role="alert">{err('pricing')}</span>}
      </fieldset>

      <button type="submit" disabled={submitting || photos.busy}>
        {submitting ? t('saving') : gear ? t('save') : t('create')}
      </button>
      {failed && <p role="alert">{t('saveFailed')}</p>}
    </form>
  );
}
