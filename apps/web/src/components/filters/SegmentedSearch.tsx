'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Calendar } from '@/components/rentals/Calendar';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { CalendarIcon, PinIcon, SearchIcon } from '@/components/ui/icons';
import { Popover } from '@/components/ui/Popover';
import { Sheet } from '@/components/ui/Sheet';
import { getNow, helsinkiDayStartUtc, helsinkiYmd } from '@/lib/format';
import type { SearchParams } from '@/lib/gearFilters';
import { useFilterNav } from './useFilterNav';

const RADII_KM = [5, 10, 25, 50, 100];
const MONTHS_AHEAD = 12;

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const ymdOk = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');

type Seg = 'where' | 'when' | null;

// Where: "near me" (browser location + radius). When: a date range. What: free text; categories
// are the chips below. State is the URL: Search pushes q, from/to and lat/lng/radiusKm.
function useSearchState(values: SearchParams) {
  const [q, setQ] = useState(str(values.q));
  const [geo, setGeo] = useState({ lat: str(values.lat), lng: str(values.lng) });
  const [radius, setRadius] = useState(str(values.radiusKm) || '25');
  const [from, setFrom] = useState(ymdOk(str(values.from)));
  const [to, setTo] = useState(ymdOk(str(values.to)));
  const [geoError, setGeoError] = useState(false);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setGeoError(false);
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setGeo({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
      },
      () => {
        setLocating(false);
        setGeoError(true);
      },
      { timeout: 10_000, maximumAge: 60_000 },
    );
  };
  return { q, setQ, geo, setGeo, radius, setRadius, from, setFrom, to, setTo, geoError, locating, locate };
}
type SearchState = ReturnType<typeof useSearchState>;

function WherePanel({ s }: { s: SearchState }) {
  const t = useTranslations();
  const near = s.geo.lat !== '' && s.geo.lng !== '';
  return (
    <div className="seg__panel">
      <Button
        variant={near ? 'secondary' : 'outline'}
        block
        onClick={near ? () => s.setGeo({ lat: '', lng: '' }) : s.locate}
        disabled={s.locating}
      >
        <PinIcon size={18} />
        {near ? t('search.nearMeOn') : s.locating ? t('map.locating') : t('search.nearMe')}
      </Button>
      {near && (
        <Select value={s.radius} onChange={(e) => s.setRadius(e.target.value)} aria-label={t('filters.radius')}>
          {RADII_KM.map((km) => (
            <option key={km} value={km}>
              {t('filters.withinKm', { km })}
            </option>
          ))}
        </Select>
      )}
      {s.geoError && (
        <p role="alert" className="form-error">
          {t('filters.locationFailed')}
        </p>
      )}
    </div>
  );
}

function WhenPanel({ s }: { s: SearchState }) {
  const t = useTranslations('search');
  const today = helsinkiYmd(new Date(getNow()));
  const minMonth = today.slice(0, 7);
  const [y = 0, m = 1] = minMonth.split('-').map(Number);
  const end = new Date(Date.UTC(y, m - 1 + MONTHS_AHEAD, 1));
  const maxMonth = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState((s.from || today).slice(0, 7));

  const pick = (ymd: string) => {
    if (s.from && !s.to && ymd >= s.from) s.setTo(ymd);
    else {
      s.setFrom(ymd);
      s.setTo('');
    }
  };
  return (
    <div className="seg__panel seg__panel--cal">
      <p className="note">{s.from && !s.to ? t('pickEnd') : t('pickStart')}</p>
      <Calendar
        month={month}
        onMonthChange={setMonth}
        isDisabled={(ymd) => ymd < today}
        start={s.from || null}
        end={s.to || null}
        onPick={pick}
        minMonth={minMonth}
        maxMonth={maxMonth}
      />
      {(s.from || s.to) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            s.setFrom('');
            s.setTo('');
          }}
        >
          {t('clearDates')}
        </Button>
      )}
    </div>
  );
}

function useLabels(s: SearchState) {
  const t = useTranslations('search');
  const locale = useLocale();
  const fmt = (ymd: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'Europe/Helsinki' }).format(
      helsinkiDayStartUtc(ymd),
    );
  const whenLabel = s.from ? (s.to && s.to !== s.from ? `${fmt(s.from)} – ${fmt(s.to)}` : fmt(s.from)) : null;
  const whereLabel = s.geo.lat !== '' ? t('nearMe') : null;
  return { whenLabel, whereLabel };
}

export function SegmentedSearch({ values }: { values: SearchParams }) {
  // Re-mount when the URL changes so the fields reflect it.
  return <SearchInner values={values} key={JSON.stringify([values.q, values.from, values.to, values.lat, values.lng, values.radiusKm])} />;
}

function SearchInner({ values }: { values: SearchParams }) {
  const t = useTranslations('search');
  const push = useFilterNav('/');
  const s = useSearchState(values);
  const { whenLabel, whereLabel } = useLabels(s);
  const [open, setOpen] = useState<Seg>(null);
  const [sheet, setSheet] = useState(false);
  const [stuck, setStuck] = useState(false);
  const band = useRef<HTMLDivElement>(null);
  const qInput = useRef<HTMLInputElement>(null);

  // Collapse into the compact sticky bar once the search has scrolled out of view.
  useEffect(() => {
    const el = band.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry?.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const near = s.geo.lat !== '' && s.geo.lng !== '';
    push({
      q: s.q.trim(),
      from: s.from,
      to: s.to || s.from,
      lat: near ? s.geo.lat : undefined,
      lng: near ? s.geo.lng : undefined,
      radiusKm: near ? s.radius : undefined,
    });
    setOpen(null);
    setSheet(false);
  };

  const summary = (
    <>
      <span>{s.q.trim() || t('whatPlaceholder')}</span>
      <i aria-hidden="true" />
      <span>{whereLabel ?? t('wherePlaceholder')}</span>
      <i aria-hidden="true" />
      <span>{whenLabel ?? t('whenPlaceholder')}</span>
    </>
  );

  const expand = () => {
    if (!window.matchMedia('(min-width: 768px)').matches) return setSheet(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => qInput.current?.focus({ preventScroll: true }), 350);
  };

  return (
    <>
      <div ref={band}>
        <>
          <form className="seg seg--desktop" role="search" onSubmit={submit}>
            <label className="seg__item seg__item--what">
              <span className="seg__label">{t('what')}</span>
              <input
                ref={qInput}
                type="search"
                value={s.q}
                onChange={(e) => s.setQ(e.target.value)}
                placeholder={t('whatPlaceholder')}
                enterKeyHint="search"
                maxLength={100}
              />
            </label>
            <Popover
              open={open === 'where'}
              onClose={() => setOpen((o) => (o === 'where' ? null : o))}
              label={t('where')}
              trigger={
                <button
                  type="button"
                  className="seg__item seg__item--btn"
                  data-popover-trigger
                  aria-haspopup="dialog"
                  aria-expanded={open === 'where'}
                  onClick={() => setOpen(open === 'where' ? null : 'where')}
                >
                  <span className="seg__label">{t('where')}</span>
                  <span className={whereLabel ? 'seg__value' : 'seg__value seg__value--ph'}>
                    {whereLabel ?? t('wherePlaceholder')}
                  </span>
                </button>
              }
            >
              <WherePanel s={s} />
            </Popover>
            <Popover
              open={open === 'when'}
              onClose={() => setOpen((o) => (o === 'when' ? null : o))}
              label={t('when')}
              align="end"
              trigger={
                <button
                  type="button"
                  className="seg__item seg__item--btn"
                  data-popover-trigger
                  aria-haspopup="dialog"
                  aria-expanded={open === 'when'}
                  onClick={() => setOpen(open === 'when' ? null : 'when')}
                >
                  <span className="seg__label">{t('when')}</span>
                  <span className={whenLabel ? 'seg__value' : 'seg__value seg__value--ph'}>
                    {whenLabel ?? t('whenPlaceholder')}
                  </span>
                </button>
              }
            >
              <WhenPanel s={s} />
            </Popover>
            <button type="submit" className="seg__go" aria-label={t('go')}>
              <SearchIcon size={22} />
              <span className="seg__go-label">{t('go')}</span>
            </button>
          </form>
          <button type="button" className="seg seg--mobile" onClick={() => setSheet(true)} aria-haspopup="dialog">
            <SearchIcon size={20} />
            <span className="seg__summary">{summary}</span>
          </button>
        </>
      </div>

      {stuck && (
        <div className="compactbar">
          <button type="button" className="compactbar__pill" onClick={expand} aria-label={t('edit')}>
            <SearchIcon size={18} />
            <span className="seg__summary">{summary}</span>
          </button>
        </div>
      )}

      {sheet && (
        <Sheet
          open
          onClose={() => setSheet(false)}
          title={t('title')}
          footer={
            <Button type="submit" form="mobile-search" block>
              <SearchIcon size={18} />
              {t('go')}
            </Button>
          }
        >
          <form id="mobile-search" className="seg__stack" onSubmit={submit} role="search">
            <label className="field">
              {t('what')}
              <input
                type="search"
                value={s.q}
                onChange={(e) => s.setQ(e.target.value)}
                placeholder={t('whatPlaceholder')}
                enterKeyHint="search"
                maxLength={100}
              />
            </label>
            <fieldset className="field">
              <legend>
                <PinIcon size={16} /> {t('where')}
              </legend>
              <WherePanel s={s} />
            </fieldset>
            <fieldset className="field">
              <legend>
                <CalendarIcon size={16} /> {t('when')}
              </legend>
              <WhenPanel s={s} />
            </fieldset>
          </form>
        </Sheet>
      )}
    </>
  );
}
