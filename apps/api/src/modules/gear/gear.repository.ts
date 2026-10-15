import { Types } from 'mongoose';
import type { CreateGearInput, GearFilters } from '@gearshare/shared';
import { GearModel } from './gear.model';

export type GearRecord = Awaited<ReturnType<typeof findById>>;
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

async function findByOwner(ownerId: string) {
  if (!Types.ObjectId.isValid(ownerId)) return [];
  return GearModel.find({ ownerId, status: 'active' }).sort({ createdAt: -1, _id: -1 }).lean();
}

async function create(ownerId: string, data: Required<GearData>) {
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

async function softDelete(id: string) {
  await GearModel.updateOne({ _id: id }, { $set: { status: 'deleted' } });
}

export const gearRepository = {
  findMany,
  findById,
  findDetail,
  findByOwner,
  create,
  update,
  softDelete,
};
export type GearRepository = typeof gearRepository;
