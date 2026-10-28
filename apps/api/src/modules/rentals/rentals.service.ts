import type {
  AvailabilityQuery,
  CreateRentalInput,
  ListMyRentalsQuery,
} from '@gearquest/shared';
import { MAX_OPEN_REQUESTS_PER_RENTER, REQUEST_EXPIRY_HOURS } from '@gearquest/shared';
import { AppError, notFound, unauthorized } from '../../lib/errors';
import type { GearRepository } from '../gear/gear.repository';
import type { UsersRepository } from '../users/users.repository';
import { assertOwnerReady, assertOwnerRole } from '../users/users.policy';
import { toRentalResponse, type PartiesById } from './rentals.mapper';
import { computePrice } from './rentals.pricing';
import type { RentalRecord, RentalsRepository } from './rentals.repository';
import {
  assertTransition,
  type RentalAction,
  type RentalActor,
  type RentalStatus,
} from './rentals.stateMachine';

type Deps = {
  rentals: Pick<
    RentalsRepository,
    | 'create'
    | 'findById'
    | 'findMine'
    | 'countOpenByRenter'
    | 'existsAcceptedOverlap'
    | 'findAcceptedInWindow'
    | 'transition'
    | 'acceptIfFree'
    | 'expireStale'
  >;
  gear: Pick<GearRepository, 'findById'>;
  users: Pick<UsersRepository, 'findById' | 'findByIds'>;
};

const HOUR_MS = 3_600_000;

export function createRentalsService(
  { rentals, gear, users }: Deps,
  clock: () => Date = () => new Date(),
) {
  async function partiesOf(records: RentalRecord[]): Promise<PartiesById> {
    const ids = [...new Set(records.flatMap((r) => [String(r.ownerId), String(r.renterId)]))];
    const found = await users.findByIds(ids);
    return new Map(found.map((u) => [String(u._id), u]));
  }

  async function respond(rental: RentalRecord, viewerId: string, now: Date) {
    return toRentalResponse(rental, viewerId, await partiesOf([rental]), now);
  }

  // Non-parties get 404 so a rental's existence is not leaked.
  async function loadAsParty(userId: string, id: string) {
    const rental = await rentals.findById(id);
    if (!rental) throw notFound('rentals.notFound');
    const actor: RentalActor | null =
      String(rental.ownerId) === userId ? 'owner' : String(rental.renterId) === userId ? 'renter' : null;
    if (!actor) throw notFound('rentals.notFound');
    return { rental, actor };
  }

  // Shared path for decline / cancel / complete. The conditional update re-checks the status,
  // so a concurrent change between our read and write cannot be overwritten.
  async function applyTransition(userId: string, id: string, action: RentalAction) {
    const now = clock();
    const { rental, actor } = await loadAsParty(userId, id);
    const to = assertTransition(rental, action, actor, now);
    const patch: Parameters<RentalsRepository['transition']>[2] = {
      status: to,
      ...(to === 'declined' && { decidedAt: now }),
      ...(to === 'completed' && { completedAt: now }),
      ...(to === 'cancelled' && { cancelledAt: now, cancelledBy: actor }),
    };
    const updated = await rentals.transition(id, rental.status as RentalStatus, patch, now);
    if (!updated) throw new AppError(409, 'rentals.invalidTransition');
    return respond(updated, userId, now);
  }

  return {
    async create(userId: string, input: CreateRentalInput) {
      const now = clock();
      const found = await gear.findById(input.gearId);
      if (!found) throw notFound('gear.notFound');
      if (found.status !== 'active') throw new AppError(409, 'rentals.gearNotActive');
      if (String(found.ownerId) === userId) throw new AppError(400, 'rentals.ownGear');

      const renter = await users.findById(userId);
      if (!renter) throw unauthorized();
      if (!renter.phone) throw new AppError(409, 'rentals.renterPhoneRequired');

      const price = computePrice(input, found.pricing ?? {}, now);

      if ((await rentals.countOpenByRenter(userId, now)) >= MAX_OPEN_REQUESTS_PER_RENTER) {
        throw new AppError(429, 'rentals.tooManyOpenRequests');
      }
      if (await rentals.existsAcceptedOverlap(input.gearId, input.startAt, input.endAt)) {
        throw new AppError(409, 'rentals.overlap');
      }

      const created = await rentals.create({
        gearId: input.gearId,
        ownerId: String(found.ownerId),
        renterId: userId,
        gearSnapshot: {
          title: found.title,
          ...(found.images?.[0] && { coverImage: found.images[0] }),
        },
        mode: input.mode,
        startAt: input.startAt,
        endAt: input.endAt,
        ...price,
        ...(input.message && { message: input.message }),
        expiresAt: new Date(now.getTime() + REQUEST_EXPIRY_HOURS * HOUR_MS),
      });
      return respond(created, userId, now);
    },

    async get(userId: string, id: string) {
      const now = clock();
      const { rental } = await loadAsParty(userId, id);
      return respond(rental, userId, now);
    },

    async listMine(userId: string, query: ListMyRentalsQuery) {
      const now = clock();
      const { items, total } = await rentals.findMine(userId, query, now);
      const parties = await partiesOf(items);
      return {
        items: items.map((r) => toRentalResponse(r, userId, parties, now)),
        page: query.page,
        limit: query.limit,
        total,
      };
    },

    async accept(userId: string, id: string) {
      const now = clock();
      // Role first, so a renter-role caller learns nothing about the rental.
      assertOwnerReady(await users.findById(userId));
      const { rental, actor } = await loadAsParty(userId, id);
      assertTransition(rental, 'accept', actor, now);

      // Overlap is re-checked here, atomically, because several pending requests can overlap.
      const result = await rentals.acceptIfFree(rental, now);
      if (result.outcome === 'overlap') throw new AppError(409, 'rentals.overlap');
      if (result.outcome === 'notPending') throw new AppError(409, 'rentals.invalidTransition');
      return respond(result.rental, userId, now);
    },

    async decline(userId: string, id: string) {
      assertOwnerRole(await users.findById(userId));
      return applyTransition(userId, id, 'decline');
    },
    cancel: (userId: string, id: string) => applyTransition(userId, id, 'cancel'),
    complete: (userId: string, id: string) => applyTransition(userId, id, 'complete'),

    // Public. Exposes only the blocked time ranges, never who booked.
    async availability(gearId: string, query: AvailabilityQuery) {
      if (!(await gear.findById(gearId))) throw notFound('gear.notFound');
      const blocked = await rentals.findAcceptedInWindow(gearId, query.from, query.to);
      return {
        gearId,
        from: query.from,
        to: query.to,
        blocked: blocked.map((r) => ({ startAt: r.startAt, endAt: r.endAt })),
      };
    },

    expireStale: () => rentals.expireStale(clock()),
  };
}
