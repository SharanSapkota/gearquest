export const LOCALES = ['fi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE = 'fi';

export const CATEGORIES = [
  'ski',
  'snowboard',
  'tent',
  'kayak',
  'bike',
  'climbing',
  'camping',
  'other',
] as const;
export const CONDITIONS = ['new', 'good', 'fair'] as const;
export const GEAR_STATUSES = ['active', 'paused', 'deleted'] as const;
export const RENTAL_MODES = ['hourly', 'daily'] as const;
export const RENTAL_STATUSES = [
  'requested',
  'accepted',
  'declined',
  'cancelled',
  'completed',
  'expired',
] as const;
export const REVIEW_ROLES = ['owner', 'renter'] as const;

export const GEAR_SORTS = ['newest', 'priceAsc', 'priceDesc'] as const;

export const MAX_GEAR_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const GEAR_IMAGE_FOLDER = 'gear';
export const OWNER_GEAR_STATUSES = ['active', 'paused'] as const;

export const REQUEST_EXPIRY_HOURS = 48;
export const MAP_LOCATION_OFFSET_METERS = 300;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const MAX_RENTAL_DAYS = 30;
export const MAX_OPEN_REQUESTS_PER_RENTER = 10;
export const MAX_AVAILABILITY_WINDOW_DAYS = 90;
export const RENTAL_TIME_ZONE = 'Europe/Helsinki';

// Chosen at signup (or upgraded later). Owners (and "both") must have a phone and WhatsApp consent.
export const USER_ROLES = ['renter', 'owner', 'both'] as const;
export const OWNER_ROLES = ['owner', 'both'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_INTENTS = ['signin', 'signup'] as const;
export const SIGNUP_TOKEN_TTL_SECONDS = 10 * 60;

export const OWNER_DASHBOARD_PATH = '/dashboard/owner';
export const RENTER_DASHBOARD_PATH = '/dashboard/renter';
// Where a user lands after signing in. "both" defaults to renting; the web remembers the last view.
export const dashboardPath = (role: UserRole | undefined) =>
  role === 'owner' ? OWNER_DASHBOARD_PATH : RENTER_DASHBOARD_PATH;
