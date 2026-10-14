import { DEFAULT_PAGE_SIZE } from '@gearshare/shared';
import type { GearListResponse, GearQuery, PublicGear } from './api';

// TODO(mock): temporary dataset used only when the API is unreachable. Remove with the fallback in api.ts.
// Geo and availability (from/to) filters are not applied here.
const base = { ownerId: 'mock-owner', description: '' };

export const MOCK_GEAR: PublicGear[] = [
  {
    ...base,
    id: 'mock-1',
    title: 'Rossignol touring skis',
    category: 'ski',
    condition: 'good',
    images: [],
    city: 'Helsinki',
    pricing: { dailyCents: 2500 },
    ownerRatingAvg: 4.8,
  },
  {
    ...base,
    id: 'mock-2',
    title: 'Burton snowboard 156',
    category: 'snowboard',
    condition: 'fair',
    images: [],
    city: 'Tampere',
    pricing: { hourlyCents: 800, dailyCents: 4000 },
    ownerRatingAvg: 4.2,
  },
  {
    ...base,
    id: 'mock-3',
    title: 'MSR 2-person tent',
    category: 'tent',
    condition: 'new',
    images: [],
    city: 'Espoo',
    pricing: { dailyCents: 1800 },
    ownerRatingAvg: 5,
  },
  {
    ...base,
    id: 'mock-4',
    title: 'Sea kayak with paddle',
    category: 'kayak',
    condition: 'good',
    images: [],
    city: 'Turku',
    pricing: { hourlyCents: 1200, dailyCents: 6000, minHours: 2 },
    ownerRatingAvg: 4.5,
  },
  {
    ...base,
    id: 'mock-5',
    title: 'Trekking mountain bike',
    category: 'bike',
    condition: 'good',
    images: [],
    city: 'Oulu',
    pricing: { hourlyCents: 500 },
  },
  {
    ...base,
    id: 'mock-6',
    title: 'Climbing rope 60 m',
    category: 'climbing',
    condition: 'fair',
    images: [],
    city: 'Helsinki',
    pricing: { dailyCents: 1000 },
    ownerRatingAvg: 3.9,
  },
];

const priceFor = (g: PublicGear, mode?: 'hourly' | 'daily') => {
  const { hourlyCents, dailyCents } = g.pricing;
  if (mode === 'hourly') return hourlyCents;
  if (mode === 'daily') return dailyCents;
  return dailyCents ?? hourlyCents;
};

export function filterMockGear(query: GearQuery): GearListResponse {
  const q = query.q?.trim().toLowerCase();
  let items = MOCK_GEAR.filter((g) => {
    const price = priceFor(g, query.mode);
    return (
      (!q || g.title.toLowerCase().includes(q)) &&
      (!query.category || g.category === query.category) &&
      (!query.condition || g.condition === query.condition) &&
      (!query.mode || price !== undefined) &&
      (query.minPriceCents === undefined ||
        (price !== undefined && price >= query.minPriceCents)) &&
      (query.maxPriceCents === undefined ||
        (price !== undefined && price <= query.maxPriceCents)) &&
      (query.minOwnerRating === undefined || (g.ownerRatingAvg ?? 0) >= query.minOwnerRating)
    );
  });
  if (query.sort === 'priceAsc' || query.sort === 'priceDesc') {
    const dir = query.sort === 'priceAsc' ? 1 : -1;
    items = [...items].sort(
      (a, b) => dir * ((priceFor(a, query.mode) ?? 0) - (priceFor(b, query.mode) ?? 0)),
    );
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit };
}
