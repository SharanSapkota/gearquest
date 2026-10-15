const TZ = 'Europe/Helsinki';

export const formatMoney = (cents: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);

export const formatDateTime = (date: Date | string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(
    new Date(date),
  );

export const formatDate = (date: Date | string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: TZ }).format(new Date(date));

const tzOffsetMs = (utcMs: number) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(utcMs);
  const get = (type: string) => Number(parts.find((x) => x.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - Math.floor(utcMs / 1000) * 1000;
};

// UTC instant of the given Helsinki wall-clock time ("HH:MM", default midnight) on a calendar day (YYYY-MM-DD).
export function helsinkiToUtc(ymd: string, hm = '00:00'): Date {
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  const [h = 0, min = 0] = hm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - tzOffsetMs(guess);
  return new Date(guess - tzOffsetMs(first));
}

// UTC instant of 00:00 Europe/Helsinki on the given calendar day (YYYY-MM-DD).
export const helsinkiDayStartUtc = (ymd: string): Date => helsinkiToUtc(ymd);

// Calendar day (YYYY-MM-DD) of an instant in Europe/Helsinki.
export const helsinkiYmd = (date: Date | string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

export function addDaysYmd(ymd: string, days: number): string {
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export const formatTime = (date: Date | string, locale: string) =>
  new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: TZ }).format(new Date(date));

// Wrapped so components can ask for the current time without calling Date.now() inline.
export const getNow = () => Date.now();

// Whole hours until an instant, rounded up and never below 0.
export const hoursUntil = (date: Date | string, nowMs: number) =>
  Math.max(0, Math.ceil((new Date(date).getTime() - nowMs) / 3_600_000));
