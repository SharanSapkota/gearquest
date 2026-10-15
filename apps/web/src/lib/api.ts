import type {
  CATEGORIES,
  CONDITIONS,
  GEAR_SORTS,
  LOCALES,
  RENTAL_MODES,
  UpdateProfileInput,
} from '@gearshare/shared';
import { filterMockGear } from './mockGear';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
  ) {
    super(`api.${status}`);
  }
}

// The only place in the web app that calls fetch.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set('Content-Type', 'application/json');
  // In the browser the session cookie is sent by credentials: 'include'. On the server we
  // forward the incoming request's cookies ourselves.
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookie = (await cookies()).toString();
      if (cookie) headers.set('Cookie', cookie);
    } catch {
      // Outside a request scope (e.g. tests, build): nothing to forward.
    }
  }
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error);
  }
  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>);
}

export type PublicProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  ratingAvg: number;
  ratingCount: number;
};

export type ProfileWithGear = PublicProfile & { gear: PublicGear[] };

// The signed-in user's own account. Only returned by /auth/me and PATCH /users/me.
export type Me = PublicProfile & {
  email: string;
  phone?: string;
  language: (typeof LOCALES)[number];
};

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
  // Unauthenticated (401) means a guest. Other failures (e.g. API down) also render as a guest
  // so public pages keep working.
  async getMe(): Promise<Me | null> {
    try {
      return await request<Me>('/auth/me');
    } catch {
      return null;
    }
  },
  loginWithGoogle(idToken: string) {
    return request<Me>('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) });
  },
  logout() {
    return request<void>('/auth/logout', { method: 'POST' });
  },
  getUser(id: string) {
    return request<ProfileWithGear>(`/users/${encodeURIComponent(id)}`);
  },
  updateMe(patch: UpdateProfileInput) {
    return request<Me>('/users/me', { method: 'PATCH', body: JSON.stringify(patch) });
  },
};
