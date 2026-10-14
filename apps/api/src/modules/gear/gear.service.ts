import type { CreateGearInput, GearFilters, UpdateGearInput } from '@gearshare/shared';
import { MAP_LOCATION_OFFSET_METERS } from '@gearshare/shared';
import { forbidden, notFound } from '../../lib/errors';
import { toPublicGear, toPublicGearDetail } from './gear.mapper';
import type { GearRepository, Point } from './gear.repository';

type Repo = Pick<
  GearRepository,
  'findMany' | 'findById' | 'findDetail' | 'create' | 'update' | 'softDelete'
>;

const METERS_PER_DEGREE_LAT = 111_320;
const MIN_OFFSET_METERS = MAP_LOCATION_OFFSET_METERS / 2;

const toPoint = ({ lng, lat }: { lng: number; lat: number }): Point => ({
  type: 'Point',
  coordinates: [lng, lat],
});

// Random bearing, distance 150-300 m. Generated once and stored on the gear (publicLocation),
// so it is stable across requests. Not derived from the id, so it cannot be reversed.
export function fuzzLocation(point: { lng: number; lat: number }, rng: () => number = Math.random) {
  const distance = MIN_OFFSET_METERS + rng() * (MAP_LOCATION_OFFSET_METERS - MIN_OFFSET_METERS);
  const bearing = rng() * 2 * Math.PI;
  const dLat = (distance * Math.cos(bearing)) / METERS_PER_DEGREE_LAT;
  const dLng =
    (distance * Math.sin(bearing)) / (METERS_PER_DEGREE_LAT * Math.cos((point.lat * Math.PI) / 180));
  return toPoint({ lng: point.lng + dLng, lat: point.lat + dLat });
}

export function createGearService(repo: Repo, rng: () => number = Math.random) {
  async function getOwned(userId: string, id: string) {
    const gear = await repo.findById(id);
    if (!gear) throw notFound('gear.notFound');
    if (String(gear.ownerId) !== userId) throw forbidden('gear.forbidden');
    return gear;
  }

  return {
    async list(filters: GearFilters) {
      const { items, total } = await repo.findMany(filters);
      return { items: items.map(toPublicGear), total, page: filters.page, limit: filters.limit };
    },
    async get(id: string) {
      const gear = await repo.findDetail(id);
      if (!gear) throw notFound('gear.notFound');
      return toPublicGearDetail(gear);
    },
    async create(userId: string, input: CreateGearInput) {
      const gear = await repo.create(userId, {
        ...input,
        location: toPoint(input.location),
        publicLocation: fuzzLocation(input.location, rng),
      });
      return toPublicGear(gear);
    },
    async update(userId: string, id: string, patch: UpdateGearInput) {
      await getOwned(userId, id);
      const { location, ...rest } = patch;
      const gear = await repo.update(id, {
        ...rest,
        ...(location && { location: toPoint(location), publicLocation: fuzzLocation(location, rng) }),
      });
      if (!gear) throw notFound('gear.notFound');
      return toPublicGear(gear);
    },
    async remove(userId: string, id: string) {
      await getOwned(userId, id);
      await repo.softDelete(id);
    },
  };
}
