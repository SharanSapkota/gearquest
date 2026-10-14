import type { GearRecord } from './gear.repository';

// Public view: never exposes exact location or address.
export function toPublicGear(gear: NonNullable<GearRecord>) {
  return {
    id: String(gear._id),
    ownerId: String(gear.ownerId),
    title: gear.title,
    description: gear.description,
    category: gear.category,
    condition: gear.condition,
    images: gear.images,
    city: gear.city,
    location: gear.publicLocation?.coordinates,
    pricing: gear.pricing,
    ownerRatingAvg: gear.ownerRatingAvg,
    status: gear.status,
    createdAt: gear.createdAt,
  };
}
