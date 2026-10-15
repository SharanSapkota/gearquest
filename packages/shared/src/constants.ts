export const LOCALES = ['fi', 'en'] as const;
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
