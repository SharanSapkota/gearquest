import type { RENTAL_STATUSES } from '@gearshare/shared';
import { AppError, forbidden } from '../../lib/errors';

export type RentalStatus = (typeof RENTAL_STATUSES)[number];
export type RentalActor = 'owner' | 'renter';
export type RentalAction = 'accept' | 'decline' | 'cancel' | 'complete';

type Subject = { status: RentalStatus; expiresAt: Date; endAt: Date };
type Rule = { from: RentalStatus; actors: RentalActor[]; to: RentalStatus };

// The single definition of every allowed transition. Expiry is system-driven and handled by
// effectiveStatus (on read) and the repository sweep, never by a user action.
const RULES: Record<RentalAction, Rule[]> = {
  accept: [{ from: 'requested', actors: ['owner'], to: 'accepted' }],
  decline: [{ from: 'requested', actors: ['owner'], to: 'declined' }],
  cancel: [
    { from: 'requested', actors: ['renter'], to: 'cancelled' }, // owner uses decline instead
    { from: 'accepted', actors: ['owner', 'renter'], to: 'cancelled' },
  ],
  complete: [{ from: 'accepted', actors: ['owner', 'renter'], to: 'completed' }],
};

// A request nobody answered in time is expired, whether or not the sweep has run yet.
export function effectiveStatus(rental: Pick<Subject, 'status' | 'expiresAt'>, now: Date) {
  return rental.status === 'requested' && rental.expiresAt <= now ? 'expired' : rental.status;
}

// Returns the target status or throws an AppError explaining why the transition is rejected.
export function assertTransition(
  rental: Subject,
  action: RentalAction,
  actor: RentalActor,
  now: Date,
): RentalStatus {
  const status = effectiveStatus(rental, now);
  if (status === 'expired') throw new AppError(409, 'rentals.expired');

  const rule = RULES[action].find((r) => r.from === status);
  if (!rule) throw new AppError(409, 'rentals.invalidTransition');
  if (!rule.actors.includes(actor)) throw forbidden('rentals.forbidden');

  if (action === 'complete' && now < rental.endAt) throw new AppError(409, 'rentals.notEnded');
  if (action === 'cancel' && status === 'accepted' && now >= rental.endAt) {
    throw new AppError(409, 'rentals.alreadyEnded'); // after the end time it can only be completed
  }
  return rule.to;
}
