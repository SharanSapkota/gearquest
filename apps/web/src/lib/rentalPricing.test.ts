import { describe, expect, it } from 'vitest';
import { helsinkiToUtc } from './format';
import { isDayFullyBlocked, quoteRental } from './rentalPricing';

const NOW = new Date('2026-06-01T10:00:00Z');
const day = (ymd: string) => helsinkiToUtc(ymd);
const pricing = { hourlyCents: 500, dailyCents: 2000, minHours: 2 };

describe('quoteRental daily', () => {
  it('prices calendar days', () => {
    const q = quoteRental({ mode: 'daily', startAt: day('2026-06-05'), endAt: day('2026-06-08') }, pricing, NOW, []);
    expect(q).toEqual({ ok: true, unitPriceCents: 2000, quantity: 3, totalCents: 6000 });
  });
  it('counts a DST day as one day', () => {
    const q = quoteRental({ mode: 'daily', startAt: day('2026-03-28'), endAt: day('2026-03-30') }, pricing, new Date('2026-03-01T00:00:00Z'), []);
    expect(q.ok && q.quantity).toBe(2);
  });
  it('rejects over 30 days, past starts and reversed ranges', () => {
    const err = (s: string, e: string) => {
      const q = quoteRental({ mode: 'daily', startAt: day(s), endAt: day(e) }, pricing, NOW, []);
      return q.ok ? null : q.error;
    };
    expect(err('2026-06-05', '2026-07-06')).toBe('tooLong');
    expect(err('2026-05-30', '2026-06-02')).toBe('startInPast');
    expect(err('2026-06-08', '2026-06-05')).toBe('invalidRange');
  });
  it('rejects a mode the gear does not offer', () => {
    const q = quoteRental({ mode: 'daily', startAt: day('2026-06-05'), endAt: day('2026-06-06') }, { hourlyCents: 500 }, NOW, []);
    expect(q).toEqual({ ok: false, error: 'modeNotAvailable' });
  });
});

describe('quoteRental hourly', () => {
  const at = (hm: string) => helsinkiToUtc('2026-06-05', hm);
  it('prices whole hours and enforces minHours', () => {
    expect(quoteRental({ mode: 'hourly', startAt: at('10:00'), endAt: at('13:00') }, pricing, NOW, [])).toEqual({
      ok: true,
      unitPriceCents: 500,
      quantity: 3,
      totalCents: 1500,
    });
    const short = quoteRental({ mode: 'hourly', startAt: at('10:00'), endAt: at('11:00') }, pricing, NOW, []);
    expect(short).toEqual({ ok: false, error: 'belowMinHours' });
  });
  it('rejects part hours', () => {
    const q = quoteRental({ mode: 'hourly', startAt: at('10:00'), endAt: at('12:30') }, pricing, NOW, []);
    expect(q).toEqual({ ok: false, error: 'invalidHourlyRange' });
  });
});

describe('blocked ranges', () => {
  const blocked = [{ startAt: at('12:00'), endAt: at('14:00') }];
  function at(hm: string) {
    return helsinkiToUtc('2026-06-05', hm).toISOString();
  }
  const range = (a: string, b: string) => ({ mode: 'hourly' as const, startAt: new Date(at(a)), endAt: new Date(at(b)) });
  it('flags overlaps but allows back-to-back bookings', () => {
    expect(quoteRental(range('13:00', '16:00'), pricing, NOW, blocked)).toEqual({ ok: false, error: 'overlap' });
    expect(quoteRental(range('10:00', '12:00'), pricing, NOW, blocked).ok).toBe(true);
    expect(quoteRental(range('14:00', '16:00'), pricing, NOW, blocked).ok).toBe(true);
  });
  it('detects a fully blocked day', () => {
    const full = [{ startAt: day('2026-06-05').toISOString(), endAt: day('2026-06-06').toISOString() }];
    expect(isDayFullyBlocked('2026-06-05', full)).toBe(true);
    expect(isDayFullyBlocked('2026-06-05', blocked)).toBe(false);
  });
});
