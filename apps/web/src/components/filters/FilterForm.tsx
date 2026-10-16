'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { CATEGORIES, CONDITIONS, GEAR_SORTS, RENTAL_MODES } from '@gearshare/shared';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { useRouter } from '@/i18n/navigation';
import type { SearchParams } from '@/lib/gearFilters';

const RADII_KM = [5, 10, 25, 50, 100];
const RATINGS = [1, 2, 3, 4, 5];

export const FILTER_FORM_ID = 'gear-filters';

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

type Props = {
  // Page the filters submit to (without locale), e.g. "/" or "/map".
  basePath: string;
  // Current URL search params, passed from the server page.
  values: SearchParams;
  // Params that are not filters but must survive Apply/Reset (e.g. the map position). They are
  // read from the live URL, which can be newer than `values` after client-side URL updates.
  preserve?: string[];
  onDone: () => void;
};

// The full filter set. The submit and reset buttons live in the sheet footer (FilterSheet) and
// reach this form through FILTER_FORM_ID. State is the URL: Apply pushes the params.
export function FilterForm({ basePath, values, preserve = [], onDone }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [geo, setGeo] = useState({ lat: str(values.lat), lng: str(values.lng) });
  const [geoError, setGeoError] = useState(false);
  const hasGeo = geo.lat !== '' && geo.lng !== '';

  const locate = () => {
    setGeoError(false);
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        setGeo({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }),
      () => setGeoError(true),
    );
  };

  const withPreserved = (params: URLSearchParams) => {
    const live = new URLSearchParams(window.location.search);
    for (const key of preserve) {
      const value = live.get(key);
      if (value !== null) params.set(key, value);
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget)) {
      if (typeof v === 'string' && v.trim() !== '') params.set(k, v.trim());
    }
    router.push(withPreserved(params));
    onDone();
  };

  const options = (group: string, list: readonly string[]) =>
    list.map((v) => (
      <option key={v} value={v}>
        {t(`${group}.${v}`)}
      </option>
    ));

  return (
    <form
      id={FILTER_FORM_ID}
      className="filters"
      onSubmit={submit}
      onReset={(e) => {
        e.preventDefault();
        router.push(withPreserved(new URLSearchParams()));
        onDone();
      }}
      aria-label={t('filters.title')}
      // Re-mount when the URL changes so inputs reflect the current params.
      key={JSON.stringify(values)}
    >
      <Field label={t('filters.search')}>
        <Input
          type="search"
          name="q"
          enterKeyHint="search"
          defaultValue={str(values.q)}
          placeholder={t('filters.searchPlaceholder')}
        />
      </Field>
      <Field label={t('filters.category')}>
        <Select name="category" defaultValue={str(values.category)}>
          <option value="">{t('filters.any')}</option>
          {options('categories', CATEGORIES)}
        </Select>
      </Field>
      <Field label={t('filters.condition')}>
        <Select name="condition" defaultValue={str(values.condition)}>
          <option value="">{t('filters.any')}</option>
          {options('conditions', CONDITIONS)}
        </Select>
      </Field>
      <Field label={t('filters.mode')}>
        <Select name="mode" defaultValue={str(values.mode)}>
          <option value="">{t('filters.any')}</option>
          {options('modes', RENTAL_MODES)}
        </Select>
      </Field>

      <fieldset className="field field--pair">
        <legend>{t('filters.price')}</legend>
        <Input
          type="number"
          name="minPrice"
          min={0}
          step="1"
          inputMode="decimal"
          defaultValue={str(values.minPrice)}
          placeholder={t('filters.min')}
          aria-label={t('filters.minPrice')}
        />
        <Input
          type="number"
          name="maxPrice"
          min={0}
          step="1"
          inputMode="decimal"
          defaultValue={str(values.maxPrice)}
          placeholder={t('filters.max')}
          aria-label={t('filters.maxPrice')}
        />
      </fieldset>

      <fieldset className="field field--pair">
        <legend>{t('filters.dates')}</legend>
        <Input type="date" name="from" defaultValue={str(values.from)} aria-label={t('filters.from')} />
        <Input type="date" name="to" defaultValue={str(values.to)} aria-label={t('filters.to')} />
      </fieldset>

      <fieldset className="field">
        <legend>{t('filters.distance')}</legend>
        {hasGeo ? (
          <>
            <input type="hidden" name="lat" value={geo.lat} />
            <input type="hidden" name="lng" value={geo.lng} />
            <Select
              name="radiusKm"
              defaultValue={str(values.radiusKm) || '25'}
              aria-label={t('filters.radius')}
            >
              {RADII_KM.map((km) => (
                <option key={km} value={km}>
                  {t('filters.withinKm', { km })}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => setGeo({ lat: '', lng: '' })}>
              {t('filters.clearLocation')}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={locate}>
            {t('filters.useLocation')}
          </Button>
        )}
        {geoError && <small role="alert">{t('filters.locationFailed')}</small>}
      </fieldset>

      <Field label={t('filters.minRating')}>
        <Select name="minOwnerRating" defaultValue={str(values.minOwnerRating)}>
          <option value="">{t('filters.any')}</option>
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {t('filters.ratingAtLeast', { rating: r })}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('filters.sort')}>
        <Select name="sort" defaultValue={str(values.sort)}>
          <option value="">{t('sorts.newest')}</option>
          {options(
            'sorts',
            GEAR_SORTS.filter((s) => s !== 'newest'),
          )}
        </Select>
      </Field>
    </form>
  );
}
