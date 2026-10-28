import { differenceInCalendarDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { MAX_RENTAL_DAYS, RENTAL_TIME_ZONE, type CreateRentalInput } from '@gearquest/shared';
import { AppError } from '../../lib/errors';

type Maybe<T> = T | null | undefined; // Mongo/Mongoose may hand back null for unset fields
export type GearPricing = {
  hourlyCents?: Maybe<number>;
  dailyCents?: Maybe<number>;
  minHours?: Maybe<number>;
};
export type Price = { unitPriceCents: number; quantity: number; totalCents: number };

const HOUR_MS = 3_600_000;
const MAX_HOURS = MAX_RENTAL_DAYS * 24;

const helsinki = (date: Date) => new TZDate(date.getTime(), RENTAL_TIME_ZONE);
const isHelsinkiMidnight = (date: Date) => {
  const d = helsinki(date);
  return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
};

// Validates the requested range against the gear's current pricing and returns the price to
// snapshot. The client never supplies a price. Hourly: whole hours. Daily: both ends are
// Europe/Helsinki midnights, days are calendar days (so DST days still count as one day).
export function computePrice(
  input: Pick<CreateRentalInput, 'mode' | 'startAt' | 'endAt'>,
  pricing: GearPricing,
  now: Date,
): Price {
  const { mode, startAt, endAt } = input;
  if (startAt <= now) throw new AppError(400, 'rentals.startInPast');
  if (endAt <= startAt) throw new AppError(400, 'rentals.invalidRange');

  if (mode === 'hourly') {
    const unitPriceCents = pricing.hourlyCents ?? undefined;
    if (unitPriceCents === undefined) throw new AppError(400, 'rentals.modeNotAvailable');
    const ms = endAt.getTime() - startAt.getTime();
    if (ms % HOUR_MS !== 0) throw new AppError(400, 'rentals.invalidHourlyRange');
    const quantity = ms / HOUR_MS;
    if (quantity < (pricing.minHours ?? 1)) throw new AppError(400, 'rentals.belowMinHours');
    if (quantity > MAX_HOURS) throw new AppError(400, 'rentals.tooLong');
    return { unitPriceCents, quantity, totalCents: unitPriceCents * quantity };
  }

  const unitPriceCents = pricing.dailyCents ?? undefined;
  if (unitPriceCents === undefined) throw new AppError(400, 'rentals.modeNotAvailable');
  if (!isHelsinkiMidnight(startAt) || !isHelsinkiMidnight(endAt)) {
    throw new AppError(400, 'rentals.invalidDailyRange');
  }
  const quantity = differenceInCalendarDays(helsinki(endAt), helsinki(startAt));
  if (quantity > MAX_RENTAL_DAYS) throw new AppError(400, 'rentals.tooLong');
  return { unitPriceCents, quantity, totalCents: unitPriceCents * quantity };
}
