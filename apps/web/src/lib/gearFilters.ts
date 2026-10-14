import { DEFAULT_PAGE_SIZE, gearFiltersSchema } from '@gearshare/shared';
import type { GearQuery } from './api';
import { helsinkiDayStartUtc } from './format';

export type SearchParams = Record<string, string | string[] | undefined>;

const DAY_MS = 24 * 60 * 60 * 1000;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const validYmd = (v?: string) => (v && YMD.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined);

const euros = (v?: string) => {
  const n = Number(v);
  return v !== undefined && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

// URL params are human-friendly (prices in EUR, dates as YYYY-MM-DD in Helsinki time).
// Invalid values are dropped so a hand-edited URL never breaks the page.
export function parseGearSearchParams(sp: SearchParams): GearQuery {
  const from = validYmd(first(sp.from));
  const to = validYmd(first(sp.to));
  const raw: Record<string, unknown> = {
    q: first(sp.q),
    category: first(sp.category),
    condition: first(sp.condition),
    mode: first(sp.mode),
    minPriceCents: euros(first(sp.minPrice)),
    maxPriceCents: euros(first(sp.maxPrice)),
    from: from && helsinkiDayStartUtc(from).toISOString(),
    // Inclusive end date: the end of that day, i.e. the start of the next one.
    to: to && new Date(helsinkiDayStartUtc(to).getTime() + DAY_MS).toISOString(),
    lat: first(sp.lat),
    lng: first(sp.lng),
    radiusKm: first(sp.radiusKm),
    minOwnerRating: first(sp.minOwnerRating),
    sort: first(sp.sort),
    page: first(sp.page),
    limit: DEFAULT_PAGE_SIZE,
  };
  for (const k of Object.keys(raw)) if (raw[k] === undefined) delete raw[k];

  // Drop offending keys until the shared schema accepts the rest.
  for (let i = 0; i < Object.keys(raw).length + 1; i++) {
    const parsed = gearFiltersSchema.safeParse(raw);
    if (parsed.success) break;
    const bad = new Set(parsed.error.issues.map((issue) => String(issue.path[0])));
    // Cross-field failures (geo, price range) name one key; drop the whole group.
    if (bad.has('radiusKm')) ['lat', 'lng', 'radiusKm'].forEach((k) => delete raw[k]);
    bad.forEach((k) => delete raw[k]);
  }
  return raw as GearQuery;
}

// Builds `?a=b&c=d` from the current params with overrides applied (empty/undefined removes).
export function buildSearch(sp: SearchParams, overrides: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = first(v);
    if (val !== undefined) params.set(k, val);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === '') params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const pageWindow = (page: number, totalPages: number, span = 2): number[] => {
  const start = Math.max(1, Math.min(page - span, totalPages - span * 2));
  const end = Math.min(totalPages, start + span * 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
