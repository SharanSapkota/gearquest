import type { CreateGearInput, GearFilters, SitemapQuery, UpdateGearInput } from '@gearquest/shared';
import { GEAR_IMAGE_FOLDER, MAP_LOCATION_OFFSET_METERS, MAX_GEAR_IMAGES } from '@gearquest/shared';
import { AppError, forbidden, notFound } from '../../lib/errors';
import type { UsersRepository } from '../users/users.repository';
import { assertOwnerReady } from '../users/users.policy';
import { toOwnerGear, toPublicGear, toPublicGearDetail, toSitemapEntry } from './gear.mapper';
import type { GearRepository, Point } from './gear.repository';

type Repo = Pick<
  GearRepository,
  'findMany' | 'findSitemapPage' | 'findById' | 'findDetail' | 'findState' | 'findAllByOwner' | 'create' | 'update' | 'softDelete'
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

// Only images uploaded to our own Cloudinary account, in our gear folder, are accepted.
export function isOwnImageUrl(value: string, cloudName: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return false;
  if (url.port || url.username || url.password || url.search || url.hash) return false;
  const prefix = `/${cloudName}/image/upload/`;
  if (!url.pathname.startsWith(prefix)) return false;
  return new RegExp(`^(v\\d+/)?${GEAR_IMAGE_FOLDER}/[\\w.-]+$`).test(url.pathname.slice(prefix.length));
}

// Who may see a listing. Deleted: 410 for everyone but the owner (who gets a plain 404).
// Paused: 404 for everyone but the owner. Error bodies carry nothing about the gear or owner.
export function assertViewable(status: string, ownerId: string | undefined, viewerId?: string) {
  const isOwner = viewerId !== undefined && viewerId === ownerId;
  if (status === 'deleted') throw isOwner ? notFound('gear.notFound') : new AppError(410, 'gear.gone');
  if (status === 'paused' && !isOwner) throw notFound('gear.notFound');
}

export function createGearService(
  repo: Repo,
  users: Pick<UsersRepository, 'findById'>,
  rng: () => number = Math.random,
  cloudName: string = '',
) {
  function assertImages(images: string[]) {
    if (images.length > MAX_GEAR_IMAGES) throw new AppError(400, 'gear.tooManyImages');
    if (!images.every((url) => isOwnImageUrl(url, cloudName))) {
      throw new AppError(400, 'gear.invalidImageUrl');
    }
  }

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
    async sitemap({ page, limit }: SitemapQuery) {
      const { items, total } = await repo.findSitemapPage(page, limit);
      return { items: items.map(toSitemapEntry), total, page, limit };
    },
    async listMine(userId: string) {
      const items = await repo.findAllByOwner(userId);
      return { items: items.map(toOwnerGear) };
    },
    async get(id: string, viewerId?: string) {
      const gear = await repo.findDetail(id);
      if (!gear) throw notFound('gear.notFound');
      assertViewable(gear.status, gear.ownerId ? String(gear.ownerId._id) : undefined, viewerId);
      return toPublicGearDetail(gear);
    },
    // Same visibility rules as get(), without the payload: lets the web proxy answer 410.
    async state(id: string, viewerId?: string) {
      const gear = await repo.findState(id);
      if (!gear) throw notFound('gear.notFound');
      assertViewable(gear.status, String(gear.ownerId), viewerId);
      return { status: 'ok' as const };
    },
    async create(userId: string, input: CreateGearInput) {
      assertOwnerReady(await users.findById(userId));
      assertImages(input.images);
      const gear = await repo.create(userId, {
        ...input,
        location: toPoint(input.location),
        publicLocation: fuzzLocation(input.location, rng),
      });
      return toPublicGear(gear);
    },
    async update(userId: string, id: string, patch: UpdateGearInput) {
      await getOwned(userId, id);
      if (patch.images) assertImages(patch.images);
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
