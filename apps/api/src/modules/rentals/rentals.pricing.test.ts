import { describe, expect, it } from 'vitest';
import { computePrice } from './rentals.pricing';

const NOW = new Date('2026-01-01T10:00:00Z');
// Europe/Helsinki is UTC+2 in winter: local midnight = 22:00Z the previous day.
const hel = (utc: string) => new Date(utc);

const hourly = (start: string, end: string) => ({
  mode: 'hourly' as const,
  startAt: new Date(start),
  endAt: new Date(end),
});
const daily = (start: string, end: string) => ({
  mode: 'daily' as const,
  startAt: hel(start),
  endAt: hel(end),
});

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

describe('hourly pricing', () => {
  const pricing = { hourlyCents: 1500 };

  it('multiplies the unit price by whole hours', () => {
    expect(computePrice(hourly('2026-01-02T09:00:00Z', '2026-01-02T12:00:00Z'), pricing, NOW)).toEqual({
      unitPriceCents: 1500,
      quantity: 3,
      totalCents: 4500,
    });
  });

  it('rejects fractional hours', () => {
    expect(codeOf(() => computePrice(hourly('2026-01-02T09:00:00Z', '2026-01-02T10:30:00Z'), pricing, NOW))).toBe(
      'rentals.invalidHourlyRange',
    );
  });

  it('enforces minHours', () => {
    const p = { hourlyCents: 1000, minHours: 3 };
    expect(codeOf(() => computePrice(hourly('2026-01-02T09:00:00Z', '2026-01-02T11:00:00Z'), p, NOW))).toBe(
      'rentals.belowMinHours',
    );
    expect(computePrice(hourly('2026-01-02T09:00:00Z', '2026-01-02T12:00:00Z'), p, NOW).totalCents).toBe(3000);
  });

  it('accepts a 1 hour rental when minHours is unset', () => {
    expect(computePrice(hourly('2026-01-02T09:00:00Z', '2026-01-02T10:00:00Z'), pricing, NOW).quantity).toBe(1);
  });

  it('rejects hourly when the gear has no hourly price (also with null from Mongo)', () => {
    const range = hourly('2026-01-02T09:00:00Z', '2026-01-02T10:00:00Z');
    expect(codeOf(() => computePrice(range, { dailyCents: 5000 }, NOW))).toBe('rentals.modeNotAvailable');
    expect(codeOf(() => computePrice(range, { hourlyCents: null, dailyCents: 5000 }, NOW))).toBe(
      'rentals.modeNotAvailable',
    );
  });

  it('caps the length at 30 days', () => {
    expect(computePrice(hourly('2026-01-02T00:00:00Z', '2026-02-01T00:00:00Z'), pricing, NOW).quantity).toBe(720);
    expect(codeOf(() => computePrice(hourly('2026-01-02T00:00:00Z', '2026-02-01T01:00:00Z'), pricing, NOW))).toBe(
      'rentals.tooLong',
    );
  });
});

describe('daily pricing', () => {
  const pricing = { dailyCents: 2500 };

  it('charges per calendar day between Helsinki midnights', () => {
    // 3 Jan 00:00 -> 6 Jan 00:00 Helsinki
    expect(computePrice(daily('2026-01-02T22:00:00Z', '2026-01-05T22:00:00Z'), pricing, NOW)).toEqual({
      unitPriceCents: 2500,
      quantity: 3,
      totalCents: 7500,
    });
  });

  it('counts a day across the DST change as one day (47 real hours = 2 days)', () => {
    // 28 Mar 00:00 EET (UTC+2) -> 30 Mar 00:00 EEST (UTC+3); DST starts 29 Mar 2026.
    const r = computePrice(daily('2026-03-27T22:00:00Z', '2026-03-29T21:00:00Z'), pricing, NOW);
    expect(r.quantity).toBe(2);
    expect(r.totalCents).toBe(5000);
  });

  it('rejects times that are not Helsinki midnights', () => {
    expect(codeOf(() => computePrice(daily('2026-01-03T00:00:00Z', '2026-01-04T00:00:00Z'), pricing, NOW))).toBe(
      'rentals.invalidDailyRange',
    );
    // UTC midnight is 02:00 in Helsinki
  });

  it('rejects daily when the gear has no daily price', () => {
    expect(
      codeOf(() => computePrice(daily('2026-01-02T22:00:00Z', '2026-01-03T22:00:00Z'), { hourlyCents: 900 }, NOW)),
    ).toBe('rentals.modeNotAvailable');
  });

  it('caps the length at 30 days', () => {
    expect(computePrice(daily('2026-01-02T22:00:00Z', '2026-02-01T22:00:00Z'), pricing, NOW).quantity).toBe(30);
    expect(codeOf(() => computePrice(daily('2026-01-02T22:00:00Z', '2026-02-02T22:00:00Z'), pricing, NOW))).toBe(
      'rentals.tooLong',
    );
  });
});

describe('range validation', () => {
  const pricing = { hourlyCents: 1000, dailyCents: 5000 };

  it('rejects a start in the past or exactly now', () => {
    expect(codeOf(() => computePrice(hourly('2026-01-01T08:00:00Z', '2026-01-01T12:00:00Z'), pricing, NOW))).toBe(
      'rentals.startInPast',
    );
    expect(codeOf(() => computePrice(hourly('2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z'), pricing, NOW))).toBe(
      'rentals.startInPast',
    );
  });

  it('rejects an end that is not after the start', () => {
    expect(codeOf(() => computePrice(hourly('2026-01-02T10:00:00Z', '2026-01-02T10:00:00Z'), pricing, NOW))).toBe(
      'rentals.invalidRange',
    );
    expect(codeOf(() => computePrice(hourly('2026-01-02T10:00:00Z', '2026-01-02T09:00:00Z'), pricing, NOW))).toBe(
      'rentals.invalidRange',
    );
  });

  it('total is always an integer number of cents', () => {
    const r = computePrice(hourly('2026-01-02T09:00:00Z', '2026-01-02T16:00:00Z'), { hourlyCents: 333 }, NOW);
    expect(Number.isInteger(r.totalCents)).toBe(true);
    expect(r.totalCents).toBe(2331);
  });
});
