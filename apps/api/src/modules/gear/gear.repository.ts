import { Types } from 'mongoose';
import type { GearFilters } from '@gearshare/shared';
import { GearModel } from './gear.model';

export type GearRecord = Awaited<ReturnType<typeof findById>>;

const EARTH_RADIUS_KM = 6378.1;

async function findActive(filters: GearFilters) {
  const query: Record<string, unknown> = { status: 'active' };
  if (filters.category) query.category = filters.category;
  if (filters.condition) query.condition = filters.condition;
  if (filters.minOwnerRating) query.ownerRatingAvg = { $gte: filters.minOwnerRating };
  if (filters.q) query.$text = { $search: filters.q };

  if (filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined) {
    const field = filters.mode === 'hourly' ? 'pricing.hourlyCents' : 'pricing.dailyCents';
    query[field] = {
      ...(filters.minPriceCents !== undefined && { $gte: filters.minPriceCents }),
      ...(filters.maxPriceCents !== undefined && { $lte: filters.maxPriceCents }),
    };
  } else if (filters.mode) {
    query[filters.mode === 'hourly' ? 'pricing.hourlyCents' : 'pricing.dailyCents'] = {
      $exists: true,
    };
  }

  // $geoWithin (not $near) so it can be combined with $text.
  if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm) {
    query.publicLocation = {
      $geoWithin: {
        $centerSphere: [[filters.lng, filters.lat], filters.radiusKm / EARTH_RADIUS_KM],
      },
    };
  }

  return GearModel.find(query).sort({ createdAt: -1 }).limit(100).lean();
}

async function findById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return GearModel.findOne({ _id: id, status: { $ne: 'deleted' } }).lean();
}

export const gearRepository = { findActive, findById };
export type GearRepository = typeof gearRepository;
