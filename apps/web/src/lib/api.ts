import type { CATEGORIES, CONDITIONS, GEAR_SORTS, RENTAL_MODES } from '@gearshare/shared';
import { filterMockGear } from './mockGear';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public status: number) {
    super(`api.${status}`);
  }
}

// The only place in the web app that calls fetch.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}

export type PublicGear = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  condition: (typeof CONDITIONS)[number];
  images: string[];
  city: string;
  pricing: { hourlyCents?: number; dailyCents?: number; minHours?: number };
  ownerRatingAvg?: number;
};

export type GearListResponse = {
  items: PublicGear[];
  total: number;
  page: number;
  limit: number;
};

export type GearQuery = {
  q?: string;
  category?: (typeof CATEGORIES)[number];
  condition?: (typeof CONDITIONS)[number];
  mode?: (typeof RENTAL_MODES)[number];
  minPriceCents?: number;
  maxPriceCents?: number;
  from?: string;
  to?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minOwnerRating?: number;
  sort?: (typeof GEAR_SORTS)[number];
  page?: number;
  limit?: number;
};

const toQueryString = (query: GearQuery) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
};

export const api = {
  async listGear(query: GearQuery = {}): Promise<GearListResponse> {
    const qs = toQueryString(query);
    try {
      return await request<GearListResponse>(`/gear${qs ? `?${qs}` : ''}`);
    } catch (err) {
      // Only an unreachable API (network failure) falls back to mock data; HTTP errors surface.
      if (err instanceof ApiError) throw err;
      // TODO(mock): remove this fallback once the API is always available to the web app.
      return filterMockGear(query);
    }
  },
};
