import { Types } from 'mongoose';
import type { CreateGearInput, GearFilters } from '@gearquest/shared';
import { GearModel } from './gear.model';

export type GearRecord = Awaited<ReturnType<typeof findById>>;
export type SitemapRecord = Awaited<ReturnType<typeof findSitemapPage>>['items'][number];
export type GearDetailRecord = Awaited<ReturnType<typeof findDetail>>;

export type Point = { type: 'Point'; coordinates: [number, number] };
export type GearData = {
  title?: string;
  description?: string;
  category?: CreateGearInput['category'];
  condition?: CreateGearInput['condition'];
  images?: string[];
  city?: string;
  location?: Point;
  publicLocation?: Point;
  pricing?: { hourlyCents?: number; dailyCents?: number; minHours?: number };
  status?: 'active' | 'paused';
};

const EARTH_RADIUS_KM = 6378.1;
const OWNER_FIELDS = 'name avatarUrl ratingAvg'; // never phone or email

const priceField = (mode?: GearFilters['mode']) =>
  mode === 'hourly' ? 'pricing.hourlyCents' : 'pricing.dailyCents';

export function buildGearQuery(filters: GearFilters) {
  const query: Record<string, unknown> = { status: 'active' };
  if (filters.category) query.category = filters.category;
  if (filters.condition) query.condition = filters.condition;
  if (filters.minOwnerRating) query.ownerRatingAvg = { $gte: filters.minOwnerRating };
  if (filters.q) query.$text = { $search: filters.q };

  // Price filter, rental mode and price sorting all need the price field to exist.
  const { minPriceCents: min, maxPriceCents: max } = filters;
  if (min !== undefined || max !== undefined || filters.mode || filters.sort !== 'newest') {
    query[priceField(filters.mode)] = {
      $exists: true,
      ...(min !== undefined && { $gte: min }),
      ...(max !== undefined && { $lte: max }),
    };
  }

  // $geoWithin (not $near) so it can be combined with $text. Both geo filters go in $and
  // because they target the same field.
  const geo: Record<string, unknown>[] = [];
  if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm) {
    geo.push({
      publicLocation: {
        $geoWithin: {
          $centerSphere: [[filters.lng, filters.lat], filters.radiusKm / EARTH_RADIUS_KM],
        },
      },
    });
  }
  if (filters.bbox) {
    const [west, south, east, north] = filters.bbox;
    geo.push({
      publicLocation: {
        $geoWithin: {
          $box: [
            [west, south],
            [east, north],
          ],
        },
      },
    });
  }
  if (geo.length) query.$and = geo;

  return query;
}

export function buildGearSort(filters: GearFilters) {
  if (filters.sort === 'priceAsc') return { [priceField(filters.mode)]: 1, _id: 1 } as const;
  if (filters.sort === 'priceDesc') return { [priceField(filters.mode)]: -1, _id: 1 } as const;
  return { createdAt: -1, _id: -1 } as const;
}

async function findMany(filters: GearFilters) {
  const query = buildGearQuery(filters);
  const [items, total] = await Promise.all([
    GearModel.find(query)
      .sort(buildGearSort(filters))
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean(),
    GearModel.countDocuments(query),
  ]);
  return { items, total };
}

async function findById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return GearModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean();
}

async function findDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return GearModel.findOne({ _id: id, status: { $ne: 'deleted' } })
    .populate<{ ownerId: OwnerRecord | null }>({ path: 'ownerId', select: OWNER_FIELDS })
    .lean();
}

type OwnerRecord = { _id: Types.ObjectId; name: string; avatarUrl?: string; ratingAvg: number };

// Sitemap listing: active gear only, minimal projection, stable order for paging.
async function findSitemapPage(page: number, limit: number) {
  const [items, total] = await Promise.all([
    GearModel.find({ status: 'active' })
      .select('title category city images createdAt updatedAt')
      .sort({ _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    GearModel.countDocuments({ status: 'active' }),
  ]);
  return { items, total };
}

async function findByOwner(ownerId: string) {
  if (!Types.ObjectId.isValid(ownerId)) return [];
  return GearModel.find({ ownerId, status: 'active' }).sort({ createdAt: -1, _id: -1 }).lean();
}

// The owner's own listings: everything except deleted, so paused gear is included.
async function findAllByOwner(ownerId: string) {
  if (!Types.ObjectId.isValid(ownerId)) return [];
  return GearModel.find({ ownerId, status: { $ne: 'deleted' } })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
}

async function create(ownerId: string, data: Required<Omit<GearData, 'status'>>) {
  const doc = await GearModel.create({ ...data, ownerId });
  return doc.toObject();
}

async function update(id: string, patch: GearData) {
  return GearModel.findOneAndUpdate(
    { _id: id, status: { $ne: 'deleted' } },
    { $set: patch },
    {
      new: true,
    },
  ).lean();
}

// Listings that still exist (active or paused).
async function countByOwner(ownerId: string) {
  if (!Types.ObjectId.isValid(ownerId)) return 0;
  return GearModel.countDocuments({ ownerId, status: { $ne: 'deleted' } });
}

async function softDelete(id: string) {
  await GearModel.updateOne({ _id: id }, { $set: { status: 'deleted' } });
}

export const gearRepository = {
  findMany,
  findSitemapPage,
  findById,
  findDetail,
  findByOwner,
  findAllByOwner,
  countByOwner,
  create,
  update,
  softDelete,
};
export type GearRepository = typeof gearRepository;
