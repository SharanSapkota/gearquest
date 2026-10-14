import { z } from 'zod';
import {
  CATEGORIES,
  CONDITIONS,
  DEFAULT_PAGE_SIZE,
  GEAR_SORTS,
  GEAR_STATUSES,
  LOCALES,
  MAX_PAGE_SIZE,
  RENTAL_MODES,
  RENTAL_STATUSES,
  REVIEW_ROLES,
} from './constants';

export const localeSchema = z.enum(LOCALES);
export const categorySchema = z.enum(CATEGORIES);
export const conditionSchema = z.enum(CONDITIONS);
export const gearStatusSchema = z.enum(GEAR_STATUSES);
export const rentalModeSchema = z.enum(RENTAL_MODES);
export const rentalStatusSchema = z.enum(RENTAL_STATUSES);
export const reviewRoleSchema = z.enum(REVIEW_ROLES);

const cents = z.number().int().positive();

export const pointSchema = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

export const pricingSchema = z
  .object({
    hourlyCents: cents.optional(),
    dailyCents: cents.optional(),
    minHours: z.number().int().positive().optional(),
  })
  .refine((p) => p.hourlyCents !== undefined || p.dailyCents !== undefined, {
    message: 'pricing.required',
  })
  .refine((p) => p.minHours === undefined || p.hourlyCents !== undefined, {
    message: 'pricing.minHoursNeedsHourly',
  });

export const createGearSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000),
  category: categorySchema,
  condition: conditionSchema,
  images: z.array(z.string().url()).max(10),
  location: pointSchema,
  city: z.string().trim().min(1).max(100),
  pricing: pricingSchema,
});
export type CreateGearInput = z.infer<typeof createGearSchema>;

export const updateGearSchema = createGearSchema.partial();
export type UpdateGearInput = z.infer<typeof updateGearSchema>;

// Price is never accepted from the client: the server computes it.
export const createRentalSchema = z.object({
  gearId: z.string().min(1),
  mode: rentalModeSchema,
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  message: z.string().trim().max(1000).optional(),
});
export type CreateRentalInput = z.infer<typeof createRentalSchema>;

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// Map bounding box as "west,south,east,north" (minLng,minLat,maxLng,maxLat).
export const bboxSchema = z
  .string()
  .transform((s) => s.split(',').map(Number))
  .pipe(z.tuple([z.number(), z.number(), z.number(), z.number()]))
  .refine(([w, s, e, n]) => w >= -180 && e <= 180 && s >= -90 && n <= 90 && w < e && s < n, {
    message: 'bbox.invalid',
  });

export const gearFiltersSchema = z
  .object({
    category: categorySchema.optional(),
    condition: conditionSchema.optional(),
    mode: rentalModeSchema.optional(),
    minPriceCents: z.coerce.number().int().nonnegative().optional(),
    maxPriceCents: z.coerce.number().int().nonnegative().optional(),
    // TODO(rentals): availability filter is accepted but not applied until the rentals module exists.
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(500).optional(),
    bbox: bboxSchema.optional(),
    q: z.string().trim().max(100).optional(),
    minOwnerRating: z.coerce.number().min(1).max(5).optional(),
    sort: z.enum(GEAR_SORTS).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .refine(
    (f) => [f.lat, f.lng, f.radiusKm].every((v) => v === undefined) ||
      [f.lat, f.lng, f.radiusKm].every((v) => v !== undefined),
    { message: 'filters.geoIncomplete', path: ['radiusKm'] },
  )
  .refine(
    (f) =>
      f.minPriceCents === undefined ||
      f.maxPriceCents === undefined ||
      f.minPriceCents <= f.maxPriceCents,
    { message: 'filters.priceRange', path: ['maxPriceCents'] },
  );
export type GearFilters = z.infer<typeof gearFiltersSchema>;
export type GearFiltersInput = z.input<typeof gearFiltersSchema>;
