import mongoose, { Types } from 'mongoose';
import type { ListMyRentalsQuery } from '@gearshare/shared';
import { GearModel } from '../gear/gear.model';
import type { RentalStatus } from './rentals.stateMachine';
import { RentalModel } from './rentals.model';

export type RentalRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;
export type NewRental = {
  gearId: string;
  ownerId: string;
  renterId: string;
  gearSnapshot: { title: string; coverImage?: string };
  mode: 'hourly' | 'daily';
  startAt: Date;
  endAt: Date;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  message?: string;
  expiresAt: Date;
};
export type AcceptResult =
  | { outcome: 'ok'; rental: RentalRecord }
  | { outcome: 'overlap' }
  | { outcome: 'notPending' };
export type TransitionPatch = {
  status: RentalStatus;
  decidedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'owner' | 'renter';
};

// Half-open intervals: back-to-back rentals (one ends when the next starts) do not overlap.
// Only ACCEPTED rentals block; pending requests never do.
export function buildOverlapQuery(
  gearId: string,
  startAt: Date,
  endAt: Date,
): Record<string, unknown> {
  return { gearId, status: 'accepted', startAt: { $lt: endAt }, endAt: { $gt: startAt } };
}

// Stale "requested" rentals are treated as expired even before the sweep rewrites them.
export function buildMineQuery(
  userId: string,
  q: Pick<ListMyRentalsQuery, 'role' | 'status'>,
  now: Date,
): Record<string, unknown> {
  const party = q.role === 'owner' ? { ownerId: userId } : { renterId: userId };
  if (q.status === 'requested') return { ...party, status: 'requested', expiresAt: { $gt: now } };
  if (q.status === 'expired') {
    return {
      ...party,
      $or: [{ status: 'expired' }, { status: 'requested', expiresAt: { $lte: now } }],
    };
  }
  return { ...party, ...(q.status && { status: q.status }) };
}

async function create(data: NewRental) {
  const doc = await RentalModel.create(data);
  return doc.toObject();
}

async function findById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return RentalModel.findById(id).lean();
}

async function findMine(userId: string, q: ListMyRentalsQuery, now: Date) {
  const query = buildMineQuery(userId, q, now);
  const [items, total] = await Promise.all([
    RentalModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    RentalModel.countDocuments(query),
  ]);
  return { items, total };
}

// Rentals where the user is the given party, newest first. Dashboards group them in the service.
async function findByParty(
  role: 'owner' | 'renter',
  userId: string,
  statuses: RentalStatus[] | undefined,
  limit: number,
) {
  const party = role === 'owner' ? { ownerId: userId } : { renterId: userId };
  return RentalModel.find({ ...party, ...(statuses && { status: { $in: statuses } }) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
}

async function countOpenByRenter(renterId: string, now: Date) {
  return RentalModel.countDocuments({ renterId, status: 'requested', expiresAt: { $gt: now } });
}

async function existsAcceptedOverlap(gearId: string, startAt: Date, endAt: Date) {
  return (await RentalModel.exists(buildOverlapQuery(gearId, startAt, endAt))) !== null;
}

async function findAcceptedInWindow(gearId: string, from: Date, to: Date) {
  return RentalModel.find(buildOverlapQuery(gearId, from, to))
    .select('startAt endAt')
    .sort({ startAt: 1 })
    .lean();
}

// Conditional update: only applies if the rental is still in the expected status (and, for a
// request, not yet expired). Returns null when someone else changed it first.
async function transition(id: string, from: RentalStatus, patch: TransitionPatch, now: Date) {
  const guard = from === 'requested' ? { expiresAt: { $gt: now } } : {};
  return RentalModel.findOneAndUpdate(
    { _id: id, status: from, ...guard },
    { $set: patch },
    { new: true },
  ).lean();
}

// Atomic accept. Mongo cannot enforce "no overlapping accepted rentals" with an index, so:
// 1. bump the gear's acceptSeq inside a transaction. That write makes concurrent accepts for
//    the same gear conflict; Mongo aborts and retries the loser, which serializes them.
// 2. check for an overlapping accepted rental, 3. flip requested -> accepted conditionally.
// Whichever accept runs second sees the first one's committed result and gets 'overlap'.
async function acceptIfFree(rental: RentalRecord, now: Date): Promise<AcceptResult> {
  const session = await mongoose.startSession();
  try {
    let result: AcceptResult = { outcome: 'notPending' };
    await session.withTransaction(async () => {
      result = { outcome: 'notPending' }; // the callback can be retried
      await GearModel.updateOne({ _id: rental.gearId }, { $inc: { acceptSeq: 1 } }, { session });
      const clash = await RentalModel.exists({
        ...buildOverlapQuery(String(rental.gearId), rental.startAt, rental.endAt),
        _id: { $ne: rental._id },
      }).session(session);
      if (clash) {
        result = { outcome: 'overlap' };
        return;
      }
      const updated = await RentalModel.findOneAndUpdate(
        { _id: rental._id, status: 'requested', expiresAt: { $gt: now } },
        { $set: { status: 'accepted', decidedAt: now } },
        { new: true, session },
      ).lean();
      if (updated) result = { outcome: 'ok', rental: updated };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function existsAcceptedAsOwner(ownerId: string) {
  if (!Types.ObjectId.isValid(ownerId)) return false;
  return (await RentalModel.exists({ ownerId, status: 'accepted' })) !== null;
}

// Sweep: persists the expired status for stale requests. Returns how many were expired.
async function expireStale(now: Date) {
  const res = await RentalModel.updateMany(
    { status: 'requested', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } },
  );
  return res.modifiedCount;
}

export const rentalsRepository = {
  create,
  findById,
  findMine,
  findByParty,
  countOpenByRenter,
  existsAcceptedOverlap,
  findAcceptedInWindow,
  transition,
  acceptIfFree,
  existsAcceptedAsOwner,
  expireStale,
};
export type RentalsRepository = typeof rentalsRepository;
