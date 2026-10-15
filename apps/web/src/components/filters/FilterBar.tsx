'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { CATEGORIES, CONDITIONS, GEAR_SORTS, RENTAL_MODES } from '@gearshare/shared';
import { useRouter } from '@/i18n/navigation';
import type { SearchParams } from '@/lib/gearFilters';

const RADII_KM = [5, 10, 25, 50, 100];
const RATINGS = [1, 2, 3, 4, 5];

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

type Props = {
  // Page the filters submit to (without locale), e.g. "/" or "/map".
  basePath: string;
  // Current URL search params, passed from the server page.
  values: SearchParams;
  // Params that are not filters but must survive Apply/Clear (e.g. the map position). They are
  // read from the live URL, which can be newer than `values` after client-side URL updates.
  preserve?: string[];
};

export function FilterBar({ basePath, values, preserve = [] }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  const field = (label: string, control: React.ReactNode) => (
    <label className="field">
      <span>{label}</span>
      {control}
    </label>
  );

  const options = (group: string, list: readonly string[]) =>
    list.map((v) => (
      <option key={v} value={v}>
        {t(`${group}.${v}`)}
      </option>
    ));

  return (
    <>
      <button type="button" className="filters-toggle" onClick={() => setOpen(true)}>
        {t('filters.title')}
      </button>
      {open && <div className="overlay" onClick={() => setOpen(false)} aria-hidden="true" />}
      <form
        className={open ? 'filters filters--open' : 'filters'}
        onSubmit={submit}
        aria-label={t('filters.title')}
        // Re-mount when the URL changes so inputs reflect the current params.
        key={JSON.stringify(values)}
      >
        <div className="filters__head">
          <h2>{t('filters.title')}</h2>
          <button type="button" className="filters__close" onClick={() => setOpen(false)}>
            {t('filters.close')}
          </button>
        </div>

        {field(
          t('filters.search'),
          <input
            type="search"
            name="q"
            defaultValue={str(values.q)}
            placeholder={t('filters.searchPlaceholder')}
          />,
        )}
        {field(
          t('filters.category'),
          <select name="category" defaultValue={str(values.category)}>
            <option value="">{t('filters.any')}</option>
            {options('categories', CATEGORIES)}
          </select>,
        )}
        {field(
          t('filters.condition'),
          <select name="condition" defaultValue={str(values.condition)}>
            <option value="">{t('filters.any')}</option>
            {options('conditions', CONDITIONS)}
          </select>,
        )}
        {field(
          t('filters.mode'),
          <select name="mode" defaultValue={str(values.mode)}>
            <option value="">{t('filters.any')}</option>
            {options('modes', RENTAL_MODES)}
          </select>,
        )}

        <fieldset className="field field--pair">
          <legend>{t('filters.price')}</legend>
          <input
            type="number"
            name="minPrice"
            min={0}
            step="1"
            inputMode="decimal"
            defaultValue={str(values.minPrice)}
            placeholder={t('filters.min')}
            aria-label={t('filters.minPrice')}
          />
          <input
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
          <input
            type="date"
            name="from"
            defaultValue={str(values.from)}
            aria-label={t('filters.from')}
          />
          <input type="date" name="to" defaultValue={str(values.to)} aria-label={t('filters.to')} />
        </fieldset>

        <fieldset className="field">
          <legend>{t('filters.distance')}</legend>
          {hasGeo ? (
            <>
              <input type="hidden" name="lat" value={geo.lat} />
              <input type="hidden" name="lng" value={geo.lng} />
              <select
                name="radiusKm"
                defaultValue={str(values.radiusKm) || '25'}
                aria-label={t('filters.radius')}
              >
                {RADII_KM.map((km) => (
                  <option key={km} value={km}>
                    {t('filters.withinKm', { km })}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => setGeo({ lat: '', lng: '' })}>
                {t('filters.clearLocation')}
              </button>
            </>
          ) : (
            <button type="button" onClick={locate}>
              {t('filters.useLocation')}
            </button>
          )}
          {geoError && <small role="alert">{t('filters.locationFailed')}</small>}
        </fieldset>

        {field(
          t('filters.minRating'),
          <select name="minOwnerRating" defaultValue={str(values.minOwnerRating)}>
            <option value="">{t('filters.any')}</option>
            {RATINGS.map((r) => (
              <option key={r} value={r}>
                {t('filters.ratingAtLeast', { rating: r })}
              </option>
            ))}
          </select>,
        )}
        {field(
          t('filters.sort'),
          <select name="sort" defaultValue={str(values.sort)}>
            <option value="">{t('sorts.newest')}</option>
            {options(
              'sorts',
              GEAR_SORTS.filter((s) => s !== 'newest'),
            )}
          </select>,
        )}

        <div className="filters__actions">
          <button type="submit">{t('filters.apply')}</button>
          <button
            type="button"
            onClick={() => {
              router.push(withPreserved(new URLSearchParams()));
              setOpen(false);
            }}
          >
            {t('filters.reset')}
          </button>
        </div>
      </form>
    </>
  );
}
