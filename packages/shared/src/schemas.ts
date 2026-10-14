import { z } from 'zod';
import {
  CATEGORIES,
  CONDITIONS,
  GEAR_STATUSES,
  LOCALES,
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

export const gearFiltersSchema = z.object({
  category: categorySchema.optional(),
  condition: conditionSchema.optional(),
  mode: rentalModeSchema.optional(),
  minPriceCents: z.coerce.number().int().nonnegative().optional(),
  maxPriceCents: z.coerce.number().int().nonnegative().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  q: z.string().trim().max(100).optional(),
  minOwnerRating: z.coerce.number().min(1).max(5).optional(),
});
export type GearFilters = z.infer<typeof gearFiltersSchema>;
