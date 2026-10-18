import { toOwnerGear } from '../gear/gear.mapper';
import type { GearRepository } from '../gear/gear.repository';
import { toRentalResponse, type PartiesById } from '../rentals/rentals.mapper';
import type { RentalRecord, RentalsRepository } from '../rentals/rentals.repository';
import { effectiveStatus } from '../rentals/rentals.stateMachine';
import type { UsersRepository } from '../users/users.repository';

type Deps = {
  rentals: Pick<RentalsRepository, 'findByParty'>;
  gear: Pick<GearRepository, 'findAllByOwner'>;
  users: Pick<UsersRepository, 'findByIds'>;
};

const LATEST_REQUESTS = 5;
const PAST_LIMIT = 20;
const MAX_ROWS = 500;

export function createDashboardService(
  { rentals, gear, users }: Deps,
  clock: () => Date = () => new Date(),
) {
  // Every rental goes through the rentals mapper, so phone numbers follow the same rule as
  // everywhere else: only accepted/completed, only to a party.
  async function respond(records: RentalRecord[], viewerId: string, now: Date) {
    const ids = [...new Set(records.flatMap((r) => [String(r.ownerId), String(r.renterId)]))];
    const parties: PartiesById = new Map((await users.findByIds(ids)).map((u) => [String(u._id), u]));
    return records.map((r) => toRentalResponse(r, viewerId, parties, now));
  }

  const isUpcoming = (r: RentalRecord, now: Date) => r.endAt > now;

  return {
    async owner(userId: string) {
      const now = clock();
      const [records, listings] = await Promise.all([
        rentals.findByParty('owner', userId, ['requested', 'accepted', 'completed'], MAX_ROWS),
        gear.findAllByOwner(userId),
      ]);
      const by = (status: string) => records.filter((r) => effectiveStatus(r, now) === status);
      const pending = by('requested');
      const completed = by('completed');
      const upcoming = by('accepted').filter((r) => isUpcoming(r, now));

      return {
        counts: {
          activeListings: listings.filter((g) => g.status === 'active').length,
          pendingRequests: pending.length,
          upcomingRentals: upcoming.length,
          completedRentals: completed.length,
        },
        earningsCents: completed.reduce((sum, r) => sum + r.totalCents, 0),
        pendingRequests: await respond(pending.slice(0, LATEST_REQUESTS), userId, now),
        listings: listings.map(toOwnerGear),
      };
    },

    async renter(userId: string) {
      const now = clock();
      const records = await rentals.findByParty('renter', userId, undefined, MAX_ROWS);
      const upcoming = records
        .filter((r) => effectiveStatus(r, now) === 'accepted' && isUpcoming(r, now))
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      const pending = records.filter((r) => effectiveStatus(r, now) === 'requested');
      const past = records
        .filter((r) => !upcoming.includes(r) && !pending.includes(r))
        .slice(0, PAST_LIMIT);

      const [u, p, h] = await Promise.all([
        respond(upcoming, userId, now),
        respond(pending, userId, now),
        respond(past, userId, now),
      ]);
      return { upcoming: u, pending: p, past: h };
    },
  };
}
export type DashboardService = ReturnType<typeof createDashboardService>;
