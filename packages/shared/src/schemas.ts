import { z } from 'zod';
import { cityKey } from './slug';
import {
  AUTH_INTENTS,
  CATEGORIES,
  CONDITIONS,
  DEFAULT_PAGE_SIZE,
  GEAR_SORTS,
  GEAR_STATUSES,
  LOCALES,
  MAX_AVAILABILITY_WINDOW_DAYS,
  MAX_GEAR_IMAGES,
  MAX_PAGE_SIZE,
  OWNER_GEAR_STATUSES,
  OWNER_ROLES,
  RENTAL_MODES,
  RENTAL_STATUSES,
  REVIEW_ROLES,
  SITEMAP_GEAR_PER_FILE,
  USER_ROLES,
} from './constants';

export const localeSchema = z.enum(LOCALES);
export const categorySchema = z.enum(CATEGORIES);
export const conditionSchema = z.enum(CONDITIONS);
export const gearStatusSchema = z.enum(GEAR_STATUSES);
export const rentalModeSchema = z.enum(RENTAL_MODES);
export const rentalStatusSchema = z.enum(RENTAL_STATUSES);
export const reviewRoleSchema = z.enum(REVIEW_ROLES);
export const userRoleSchema = z.enum(USER_ROLES);

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
  images: z.array(z.string().url()).max(MAX_GEAR_IMAGES),
  location: pointSchema,
  city: z.string().trim().min(1).max(100),
  pricing: pricingSchema,
});
export type CreateGearInput = z.infer<typeof createGearSchema>;

// Owners can only toggle active/paused; deletion goes through DELETE.
export const updateGearSchema = createGearSchema
  .extend({ status: z.enum(OWNER_GEAR_STATUSES) })
  .partial();
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
    // Free text normalized to cityKey; matches Gear.cityKey exactly. Empty after normalizing = ignored.
    city: z
      .string()
      .trim()
      .max(100)
      .transform(cityKey)
      .transform((k) => k || undefined)
      .optional(),
    sort: z.enum(GEAR_SORTS).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .refine(
    (f) =>
      [f.lat, f.lng, f.radiusKm].every((v) => v === undefined) ||
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
// GET /gear/sitemap: id-only listing of active gear for the web sitemap (1-based pages).
export const sitemapQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(SITEMAP_GEAR_PER_FILE).default(SITEMAP_GEAR_PER_FILE),
});
export type SitemapQuery = z.infer<typeof sitemapQuerySchema>;

export type GearFilters = z.infer<typeof gearFiltersSchema>;
export type GearFiltersInput = z.input<typeof gearFiltersSchema>;

// What a new user may tell us at signup. Identity (email, name, avatar) is never accepted from
// the client: it comes from the verified Google token. Rules (terms, phone, consent) are enforced
// by the auth service, not here.
export const signupDataSchema = z.object({
  role: userRoleSchema,
  termsAccepted: z.boolean(),
  phone: z.string().trim().max(30).optional(),
  whatsappShareConsent: z.boolean().optional(),
  language: localeSchema.optional(),
});
export type SignupData = z.infer<typeof signupDataSchema>;

// intent "signup" creates the account (signupData required); "signin" never creates one.
export const googleLoginSchema = z
  .object({
    idToken: z.string().min(1),
    intent: z.enum(AUTH_INTENTS),
    signupData: signupDataSchema.optional(),
  })
  .refine((v) => v.intent !== 'signup' || v.signupData !== undefined, {
    message: 'auth.signupDataRequired',
    path: ['signupData'],
  });
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

// POST /auth/signup/complete: the Google profile comes from the signupToken cookie.
export const completeSignupSchema = signupDataSchema;

// Phone format (Finnish or E.164) is validated and normalized server-side in the users service.
// An empty string clears the phone. Owner rules (phone + consent) are enforced by the service.
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    bio: z.string().trim().max(1000),
    language: localeSchema,
    phone: z.string().trim().max(30),
    whatsappShareConsent: z.boolean(),
  })
  .partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// PATCH /users/me/role: becoming an owner (or both) later. Same phone + consent rules as signup.
export const upgradeRoleSchema = z.object({
  role: z.enum(OWNER_ROLES),
  phone: z.string().trim().max(30).optional(),
  whatsappShareConsent: z.boolean().optional(),
});
export type UpgradeRoleInput = z.infer<typeof upgradeRoleSchema>;

// Response of POST /uploads/sign: everything the browser needs for a direct signed Cloudinary upload.
export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  uploadPreset?: string;
  maxBytes: number;
};

export const listMyRentalsSchema = z.object({
  role: z.enum(['owner', 'renter']),
  status: rentalStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type ListMyRentalsQuery = z.infer<typeof listMyRentalsSchema>;

export const availabilityQuerySchema = z
  .object({ from: z.coerce.date(), to: z.coerce.date() })
  .refine((q) => q.to > q.from, { message: 'availability.invalidWindow' })
  .refine((q) => q.to.getTime() - q.from.getTime() <= MAX_AVAILABILITY_WINDOW_DAYS * 86_400_000, {
    message: 'availability.windowTooLarge',
  });
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
