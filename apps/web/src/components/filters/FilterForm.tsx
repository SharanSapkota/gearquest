'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { CONDITIONS, GEAR_SORTS, RENTAL_MODES } from '@gearquest/shared';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Field';
import { StarIcon } from '@/components/ui/icons';
import { useRouter } from '@/i18n/navigation';
import type { SearchParams } from '@/lib/gearFilters';
import { PillGroup } from './PillGroup';
import { PriceRange } from './PriceRange';

const RADII_KM = [5, 10, 25, 50, 100];
const RATINGS = [3, 4, 5];

export const FILTER_FORM_ID = 'gear-filters';

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// Search text, category and dates are edited in the search bar and chips; the form carries them
// through as hidden fields so Apply keeps them.
const CARRIED = ['q', 'category', 'from', 'to'] as const;

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

// The detailed filters. The submit and reset buttons live in the panel footer and reach this
// form through FILTER_FORM_ID. State is the URL: Apply pushes the params.
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

  const choice = (group: string, list: readonly string[]) => [
    { value: '', label: t('filters.any') },
    ...list.map((v) => ({ value: v, label: t(`${group}.${v}`) })),
  ];

  return (
    <form
      id={FILTER_FORM_ID}
      className="filters"
      onSubmit={submit}
      onReset={(e) => {
        e.preventDefault();
        // Reset clears the detailed filters only; what the search bar and chips show stays.
        const keep = new URLSearchParams();
        for (const key of CARRIED) if (str(values[key])) keep.set(key, str(values[key]));
        router.push(withPreserved(keep));
        onDone();
      }}
      aria-label={t('filters.title')}
      // Re-mount when the URL changes so inputs reflect the current params.
      key={JSON.stringify(values)}
    >
      {CARRIED.map((key) =>
        str(values[key]) ? <input key={key} type="hidden" name={key} value={str(values[key])} /> : null,
      )}

      <fieldset className="field">
        <legend>{t('filters.price')}</legend>
        <PriceRange initialMin={str(values.minPrice)} initialMax={str(values.maxPrice)} />
      </fieldset>

      <fieldset className="field">
        <legend>{t('filters.mode')}</legend>
        <PillGroup name="mode" defaultValue={str(values.mode)} options={choice('modes', RENTAL_MODES)} />
      </fieldset>

      <fieldset className="field">
        <legend>{t('filters.condition')}</legend>
        <PillGroup
          name="condition"
          defaultValue={str(values.condition)}
          options={choice('conditions', CONDITIONS)}
        />
      </fieldset>

      <fieldset className="field">
        <legend>{t('filters.minRating')}</legend>
        <PillGroup
          name="minOwnerRating"
          defaultValue={str(values.minOwnerRating)}
          options={[
            { value: '', label: t('filters.any') },
            ...RATINGS.map((r) => ({
              value: String(r),
              label: (
                <>
                  {r}
                  <StarIcon size={14} />
                  {t('filters.andUp')}
                </>
              ),
            })),
          ]}
        />
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
