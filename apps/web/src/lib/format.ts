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

// UTC instant of 00:00 Europe/Helsinki on the given calendar day (YYYY-MM-DD).
export function helsinkiDayStartUtc(ymd: string): Date {
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - tzOffsetMs(guess);
  return new Date(guess - tzOffsetMs(first));
}
