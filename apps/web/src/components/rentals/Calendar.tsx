'use client';

import { useLocale, useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { addDaysYmd } from '@/lib/format';

const pad = (n: number) => String(n).padStart(2, '0');
const monthStart = (year: number, month: number) => `${year}-${pad(month)}-01`;

// Month grid over plain YYYY-MM-DD strings (Helsinki calendar days), Monday first.
// Native date inputs cannot disable individual days, so this is a small custom picker.
export function Calendar({
  month,
  onMonthChange,
  isDisabled,
  start,
  end,
  onPick,
  minMonth,
  maxMonth,
}: {
  month: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  isDisabled: (ymd: string) => boolean;
  start: string | null;
  end?: string | null;
  onPick: (ymd: string) => void;
  minMonth: string;
  maxMonth: string;
}) {
  const t = useTranslations('rentalForm.calendar');
  const locale = useLocale();
  const [year = 0, mon = 1] = month.split('-').map(Number);
  const first = monthStart(year, mon);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0

  const fmt = (opts: Intl.DateTimeFormatOptions, ymd: string) =>
    new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    fmt({ weekday: 'short' }, addDaysYmd('2024-01-01', i)), // 2024-01-01 is a Monday
  );
  const shift = (delta: number) =>
    onMonthChange(addDaysYmd(first, delta < 0 ? -1 : 32).slice(0, 7));

  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`),
  ];

  return (
    <div className="calendar">
      <div className="calendar__head">
        <IconButton label={t('previous')} variant="ghost" onClick={() => shift(-1)} disabled={month <= minMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <strong aria-live="polite">{fmt({ month: 'long', year: 'numeric' }, first)}</strong>
        <IconButton label={t('next')} variant="ghost" onClick={() => shift(1)} disabled={month >= maxMonth}>
          <ChevronRightIcon />
        </IconButton>
      </div>
      <div className="calendar__grid">
        {weekdays.map((d) => (
          <span key={d} className="calendar__weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((ymd, i) => {
          if (!ymd) return <span key={`e${i}`} />;
          const disabled = isDisabled(ymd);
          const selected = ymd === start || ymd === end;
          const inRange = !!start && !!end && ymd > start && ymd < end;
          return (
            <button
              key={ymd}
              type="button"
              className={`calendar__day${selected ? ' calendar__day--selected' : ''}${inRange ? ' calendar__day--range' : ''}`}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${fmt({ dateStyle: 'full' }, ymd)}${disabled ? ` – ${t('unavailable')}` : ''}`}
              onClick={() => onPick(ymd)}
            >
              {Number(ymd.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
