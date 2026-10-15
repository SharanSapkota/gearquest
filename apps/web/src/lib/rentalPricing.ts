import { MAX_RENTAL_DAYS, type RENTAL_MODES } from '@gearshare/shared';
import { helsinkiDayStartUtc } from './format';

export type RentalMode = (typeof RENTAL_MODES)[number];
export type Pricing = { hourlyCents?: number; dailyCents?: number; minHours?: number };
export type BlockedRange = { startAt: string; endAt: string };

// Keys under `rentalForm.errors`. They mirror the backend rules in rentals.pricing.ts.
export type QuoteError =
  | 'incomplete'
  | 'modeNotAvailable'
  | 'startInPast'
  | 'invalidRange'
  | 'invalidHourlyRange'
  | 'belowMinHours'
  | 'tooLong'
  | 'overlap';

export type Quote =
  | { ok: true; unitPriceCents: number; quantity: number; totalCents: number }
  | { ok: false; error: QuoteError };

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

// Half-open intervals, like the backend: back-to-back rentals do not overlap.
export const overlapsBlocked = (start: Date, end: Date, blocked: BlockedRange[]) =>
  blocked.some(
    (b) => new Date(b.startAt).getTime() < end.getTime() && new Date(b.endAt).getTime() > start.getTime(),
  );

// Preview only: the server recomputes and confirms the price.
export function quoteRental(
  input: { mode: RentalMode; startAt: Date | null; endAt: Date | null },
  pricing: Pricing,
  now: Date,
  blocked: BlockedRange[],
): Quote {
  const { mode, startAt, endAt } = input;
  const unitPriceCents = mode === 'hourly' ? pricing.hourlyCents : pricing.dailyCents;
  if (unitPriceCents === undefined) return { ok: false, error: 'modeNotAvailable' };
  if (!startAt || !endAt) return { ok: false, error: 'incomplete' };
  if (startAt <= now) return { ok: false, error: 'startInPast' };
  if (endAt <= startAt) return { ok: false, error: 'invalidRange' };

  const ms = endAt.getTime() - startAt.getTime();
  let quantity: number;
  if (mode === 'hourly') {
    if (ms % HOUR_MS !== 0) return { ok: false, error: 'invalidHourlyRange' };
    quantity = ms / HOUR_MS;
    if (quantity < (pricing.minHours ?? 1)) return { ok: false, error: 'belowMinHours' };
    if (quantity > MAX_RENTAL_DAYS * 24) return { ok: false, error: 'tooLong' };
  } else {
    // Both ends are Helsinki midnights; DST days are 23/25 h, so round to calendar days.
    quantity = Math.round(ms / DAY_MS);
    if (quantity > MAX_RENTAL_DAYS) return { ok: false, error: 'tooLong' };
  }
  if (overlapsBlocked(startAt, endAt, blocked)) return { ok: false, error: 'overlap' };
  return { ok: true, unitPriceCents, quantity, totalCents: unitPriceCents * quantity };
}

// A calendar day (YYYY-MM-DD, Helsinki) that no hourly slot can be booked on.
export function isDayFullyBlocked(ymd: string, blocked: BlockedRange[]) {
  const dayStart = helsinkiDayStartUtc(ymd);
  const next = new Date(dayStart.getTime() + DAY_MS);
  return blocked.some(
    (b) => new Date(b.startAt) <= dayStart && new Date(b.endAt) >= next,
  );
}
