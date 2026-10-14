const TZ = 'Europe/Helsinki';

export const formatMoney = (cents: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);

export const formatDateTime = (date: Date | string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(
    new Date(date),
  );
