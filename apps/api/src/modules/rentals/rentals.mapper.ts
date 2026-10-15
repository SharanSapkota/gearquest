import { effectiveStatus } from './rentals.stateMachine';
import type { RentalRecord } from './rentals.repository';

export type PartyUser = {
  _id: unknown;
  name?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
};
export type PartiesById = Map<string, PartyUser>;

// Phone numbers are revealed only once the owner accepted (and after completion).
const PHONE_VISIBLE = new Set(['accepted', 'completed']);

// The only place that decides whether a phone number leaves the API. Fields are absent
// (not null) unless status is accepted/completed, the viewer is a party, and a number exists.
export function toRentalResponse(
  rental: RentalRecord,
  viewerId: string,
  parties: PartiesById,
  now: Date,
) {
  const ownerId = String(rental.ownerId);
  const renterId = String(rental.renterId);
  const role = viewerId === ownerId ? 'owner' : viewerId === renterId ? 'renter' : null;
  const status = effectiveStatus(rental, now);

  const base = {
    id: String(rental._id),
    gearId: String(rental.gearId),
    gear: rental.gearSnapshot,
    ownerId,
    renterId,
    mode: rental.mode,
    startAt: rental.startAt,
    endAt: rental.endAt,
    unitPriceCents: rental.unitPriceCents,
    quantity: rental.quantity,
    totalCents: rental.totalCents,
    ...(rental.message && { message: rental.message }),
    status,
    expiresAt: rental.expiresAt,
    ...(rental.decidedAt && { decidedAt: rental.decidedAt }),
    ...(rental.completedAt && { completedAt: rental.completedAt }),
    ...(rental.cancelledAt && { cancelledAt: rental.cancelledAt }),
    ...(rental.cancelledBy && { cancelledBy: rental.cancelledBy }),
    createdAt: rental.createdAt,
  };
  if (!role) return base; // non-parties get no counterparty at all

  const counterpartyId = role === 'owner' ? renterId : ownerId;
  const other = parties.get(counterpartyId);
  const phone = PHONE_VISIBLE.has(status) ? other?.phone : undefined;

  return {
    ...base,
    role,
    counterparty: {
      id: counterpartyId,
      ...(other?.name && { name: other.name }),
      ...(other?.avatarUrl && { avatarUrl: other.avatarUrl }),
      ratingAvg: other?.ratingAvg ?? 0,
      ratingCount: other?.ratingCount ?? 0,
      ...(phone && { phone, whatsappUrl: `https://wa.me/${phone.replace(/\D/g, '')}` }),
    },
  };
}
