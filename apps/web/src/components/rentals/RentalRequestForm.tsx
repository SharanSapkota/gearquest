'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MAX_RENTAL_DAYS } from '@gearshare/shared';
import { Button, buttonClass } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api, type PublicGear } from '@/lib/api';
import {
  addDaysYmd,
  formatMoney,
  formatTime,
  getNow,
  helsinkiDayStartUtc,
  helsinkiToUtc,
  helsinkiYmd,
} from '@/lib/format';
import { apiErrorKey, needsPhone } from '@/lib/rentalErrors';
import {
  isDayFullyBlocked,
  overlapsBlocked,
  quoteRental,
  type BlockedRange,
  type RentalMode,
} from '@/lib/rentalPricing';
import { Calendar } from './Calendar';

const MONTHS_AHEAD = 12;
const pad = (n: number) => String(n).padStart(2, '0');
// Hour h (0-24) of a Helsinki calendar day; 24 is the next midnight.
const slot = (ymd: string, h: number) => (h === 24 ? helsinkiToUtc(addDaysYmd(ymd, 1)) : helsinkiToUtc(ymd, `${pad(h)}:00`));

export function RentalRequestForm({
  gear,
  signedIn,
}: {
  gear: Pick<PublicGear, 'id' | 'pricing'>;
  signedIn: boolean;
}) {
  const t = useTranslations('rentalForm');
  const tAll = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { hourlyCents, dailyCents, minHours } = gear.pricing;

  const modes = (['hourly', 'daily'] as const).filter((m) =>
    m === 'hourly' ? hourlyCents !== undefined : dailyCents !== undefined,
  );
  const [mode, setMode] = useState<RentalMode>(modes[0] ?? 'daily');

  const today = helsinkiYmd(new Date(getNow()));
  const minMonth = today.slice(0, 7);
  const maxMonth = addDaysYmd(`${minMonth}-01`, MONTHS_AHEAD * 31).slice(0, 7);
  const [month, setMonth] = useState(minMonth);

  // Daily: first/last day. Hourly: one date plus start/end hour (strings; '' = unset).
  const [startDay, setStartDay] = useState<string | null>(null);
  const [endDay, setEndDay] = useState<string | null>(null);
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [message, setMessage] = useState('');

  const [blocked, setBlocked] = useState<BlockedRange[]>([]);
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const loaded = useRef(new Set<string>());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Blocked ranges for the visible month, fetched on demand (the API allows 90-day windows).
  useEffect(() => {
    if (loaded.current.has(month)) return;
    loaded.current.add(month);
    const from = helsinkiDayStartUtc(addDaysYmd(`${month}-01`, -1));
    const to = helsinkiDayStartUtc(addDaysYmd(`${month}-01`, 40));
    api
      .getAvailability(gear.id, from.toISOString(), to.toISOString())
      .then((res) => {
        setAvailabilityFailed(false);
        setBlocked((prev) => {
          const seen = new Set(prev.map((b) => b.startAt + b.endAt));
          return [...prev, ...res.blocked.filter((b) => !seen.has(b.startAt + b.endAt))];
        });
      })
      .catch(() => {
        loaded.current.delete(month);
        setAvailabilityFailed(true);
      });
  }, [month, gear.id, retryKey]);

  const now = new Date(getNow());
  const sh = startHour === '' ? null : Number(startHour);
  const eh = endHour === '' ? null : Number(endHour);

  const range = useMemo(() => {
    if (mode === 'daily') {
      return {
        startAt: startDay ? helsinkiDayStartUtc(startDay) : null,
        endAt: endDay ? helsinkiDayStartUtc(endDay) : null,
      };
    }
    return {
      startAt: startDay && sh !== null ? slot(startDay, sh) : null,
      endAt: startDay && eh !== null ? slot(startDay, eh) : null,
    };
  }, [mode, startDay, endDay, sh, eh]);

  const quote = quoteRental({ mode, ...range }, gear.pricing, now, blocked);

  const selectMode = (next: RentalMode) => {
    setMode(next);
    setStartDay(null);
    setEndDay(null);
    setStartHour('');
    setEndHour('');
    setError(null);
  };

  const dayDisabled = (ymd: string) => {
    if (ymd < today) return true;
    const dayStart = helsinkiDayStartUtc(ymd);
    if (mode === 'hourly') return isDayFullyBlocked(ymd, blocked);
    // Daily, choosing the end day: the rental runs from the start day up to this midnight.
    if (startDay && !endDay && ymd > startDay) {
      const days = Math.round((dayStart.getTime() - helsinkiDayStartUtc(startDay).getTime()) / 86_400_000);
      return days > MAX_RENTAL_DAYS || overlapsBlocked(helsinkiDayStartUtc(startDay), dayStart, blocked);
    }
    // Choosing the start day: it must be in the future and free for its own day.
    return dayStart <= now || overlapsBlocked(dayStart, helsinkiDayStartUtc(addDaysYmd(ymd, 1)), blocked);
  };

  const pickDay = (ymd: string) => {
    setError(null);
    if (mode === 'hourly') {
      setStartDay(ymd);
      setStartHour('');
      setEndHour('');
    } else if (!startDay || endDay || ymd <= startDay) {
      setStartDay(ymd);
      setEndDay(null);
    } else {
      setEndDay(ymd);
    }
  };

  const hourLabel = (h: number) => (startDay ? formatTime(slot(startDay, h), locale) : '');
  const startHourDisabled = (h: number) =>
    !startDay || slot(startDay, h) <= now || overlapsBlocked(slot(startDay, h), slot(startDay, h + 1), blocked);
  const endHourDisabled = (h: number) =>
    !startDay ||
    sh === null ||
    h < sh + (minHours ?? 1) ||
    overlapsBlocked(slot(startDay, sh), slot(startDay, h), blocked);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.ok || !range.startAt || !range.endAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const rental = await api.createRental({
        gearId: gear.id,
        mode,
        startAt: range.startAt.toISOString(),
        endAt: range.endAt.toISOString(),
        ...(message.trim() && { message: message.trim() }),
      });
      router.push(`/rentals/${rental.id}`);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const unit = mode === 'hourly' ? hourlyCents : dailyCents;
  const hint =
    mode === 'daily' ? (startDay && !endDay ? t('pickEnd') : t('pickStart')) : t('pickDate');

  return (
    <form className="rental-form" onSubmit={(e) => void submit(e)} noValidate>
      <h2>{t('title')}</h2>

      {modes.length > 1 && (
        <fieldset className="field">
          <legend>{t('mode')}</legend>
          <div className="pillgroup" role="radiogroup">
            {modes.map((m) => (
              <label key={m} className="pillgroup__item">
                <input
                  type="radio"
                  name="mode"
                  checked={m === mode}
                  onChange={() => selectMode(m)}
                />
                {tAll(`modes.${m}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className="note">{hint}</p>
      <Calendar
        month={month}
        onMonthChange={setMonth}
        isDisabled={dayDisabled}
        start={startDay}
        end={mode === 'daily' ? endDay : null}
        onPick={pickDay}
        minMonth={minMonth}
        maxMonth={maxMonth}
      />
      {availabilityFailed && (
        <p role="alert" className="form-error">
          {t('availabilityFailed')}{' '}
          <Button variant="outline" size="sm" onClick={() => setRetryKey((k) => k + 1)}>
            {tAll('errors.retry')}
          </Button>
        </p>
      )}

      {mode === 'hourly' && (
        <div className="field field--pair">
          <label className="field">
            {t('startTime')}
            <Select
              value={startHour}
              disabled={!startDay}
              onChange={(e) => {
                setStartHour(e.target.value);
                setEndHour('');
              }}
            >
              <option value="">{t('choose')}</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h} disabled={startHourDisabled(h)}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            {t('endTime')}
            <Select value={endHour} disabled={sh === null} onChange={(e) => setEndHour(e.target.value)}>
              <option value="">{t('choose')}</option>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h} disabled={endHourDisabled(h)}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}
      {mode === 'hourly' && minHours !== undefined && minHours > 1 && (
        <p className="note">{t('minHours', { count: minHours })}</p>
      )}

      <label className="field">
        {t('message')}
        <Textarea
          value={message}
          maxLength={1000}
          rows={3}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <div className="price-preview" aria-live="polite">
        {quote.ok ? (
          <>
            <p>
              {t(mode === 'hourly' ? 'previewHourly' : 'previewDaily', {
                unit: formatMoney(quote.unitPriceCents, locale),
                count: quote.quantity,
              })}
            </p>
            <p>
              <strong>{t('total', { total: formatMoney(quote.totalCents, locale) })}</strong>
            </p>
          </>
        ) : quote.error === 'incomplete' ? (
          unit !== undefined && (
            <p className="note">{mode === 'hourly' ? tAll('gear.perHour', { price: formatMoney(unit, locale) }) : tAll('gear.perDay', { price: formatMoney(unit, locale) })}</p>
          )
        ) : (
          <p role="alert" className="form-error">
            {t(`errors.${quote.error}`, { count: minHours ?? 1, max: MAX_RENTAL_DAYS })}
          </p>
        )}
        <p className="note">{t('serverNote')}</p>
      </div>

      {error != null && (
        <p role="alert" className="form-error">
          {tAll(`apiErrors.${apiErrorKey(error)}`)}{' '}
          {needsPhone(error) && <Link href="/profile/edit">{t('addPhone')}</Link>}
        </p>
      )}

      <p className="note disclaimer">{tAll('legal.disclaimer')}</p>
      {signedIn ? (
        <Button type="submit" block disabled={!quote.ok || submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      ) : (
        <Link href={{ pathname: '/login', query: { next: pathname } }} className={buttonClass()}>
          {t('signInToRequest')}
        </Link>
      )}
    </form>
  );
}
