import { slugify } from '@gearquest/shared';
import type { GearDetailRecord, GearRecord, SitemapRecord } from './gear.repository';

// Public view: whitelist only. Never exposes exact location or address.
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

// Sitemap entry: ids, slug, category, city, photos and last-modified only. No owner, description,
// price or location.
export function toSitemapEntry(gear: NonNullable<SitemapRecord>) {
  return {
    id: String(gear._id),
    slug: slugify(gear.title),
    category: gear.category,
    city: gear.city,
    images: gear.images,
    updatedAt: gear.updatedAt ?? gear.createdAt,
  };
}

// Detail view adds basic owner info. Never phone or email.
export function toPublicGearDetail(gear: NonNullable<GearDetailRecord>) {
  const owner = gear.ownerId;
  return {
    ...toPublicGear({ ...gear, ownerId: owner?._id ?? gear.ownerId } as NonNullable<GearRecord>),
    owner: owner
      ? { id: String(owner._id), name: owner.name, avatarUrl: owner.avatarUrl, rating: owner.ratingAvg }
      : null,
  };
}

// Owner's own view: adds the exact pin so the edit form can prefill it. Only ever used for the caller's own gear.
export function toOwnerGear(gear: NonNullable<GearRecord>) {
  const [lng, lat] = gear.location?.coordinates ?? [];
  return {
    ...toPublicGear(gear),
    exactLocation: lng !== undefined && lat !== undefined ? { lng, lat } : undefined,
  };
}
