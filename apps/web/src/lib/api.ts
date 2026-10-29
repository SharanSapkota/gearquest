import type {
  CATEGORIES,
  CONDITIONS,
  GEAR_SORTS,
  LOCALES,
  RENTAL_MODES,
  RENTAL_STATUSES,
  CreateGearInput,
  SignupData,
  USER_ROLES,
  UpdateGearInput,
  UpdateProfileInput,
  UpgradeRoleInput,
  UploadSignature,
} from '@gearquest/shared';
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
    console.log(body, 'body');
    throw new ApiError(res.status, body?.error);
  }
  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>);
}

// HTTP status of GET /gear/:id/state for the proxy (it can only act on the status, not the body).
// Null when the API is unreachable: the page then renders normally. The cookie is forwarded so
// the owner keeps access to a paused listing.
export async function fetchGearStatus(id: string, cookie: string | null): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/gear/${encodeURIComponent(id)}/state`, {
      cache: 'no-store',
      headers: cookie ? { Cookie: cookie } : undefined,
      signal: AbortSignal.timeout(1500),
    });
    return res.status;
  } catch {
    return null;
  }
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

export type UserRole = (typeof USER_ROLES)[number];

// The signed-in user's own account. Only returned by /auth/me, login, signup and PATCH /users/me*.
export type Me = PublicProfile & {
  email: string;
  phone?: string;
  language: (typeof LOCALES)[number];
  role: UserRole;
  whatsappShareConsent: boolean;
  termsAccepted: boolean;
};

// POST /auth/google and /auth/signup/complete. NEW_USER: nothing was created; finish at /signup/complete.
export type AuthResult =
  | { status: 'OK'; user: Me; dashboardPath: string; isNew: boolean }
  | { status: 'NEW_USER'; profile: { name: string; avatarUrl?: string } };

export type OwnerDashboard = {
  counts: {
    activeListings: number;
    pendingRequests: number;
    upcomingRentals: number;
    completedRentals: number;
  };
  earningsCents: number;
  pendingRequests: Rental[];
  listings: OwnerGear[];
};

export type RenterDashboard = { upcoming: Rental[]; pending: Rental[]; past: Rental[] };

export type PublicGear = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  condition: (typeof CONDITIONS)[number];
  images: string[];
  city: string;
  // Approximate (fuzzed) public location as [lng, lat]. Never the exact pin.
  location?: [number, number];
  pricing: { hourlyCents?: number; dailyCents?: number; minHours?: number };
  ownerRatingAvg?: number;
};

// The caller's own listing. exactLocation is only ever returned for the owner's own gear.
export type OwnerGear = PublicGear & {
  status: 'active' | 'paused';
  exactLocation?: { lng: number; lat: number };
};

// GET /gear/:id: public view plus the owner's public card. `location` is the fuzzed [lng, lat].
export type GearDetail = PublicGear & {
  status: 'active' | 'paused';
  location?: [number, number];
  owner: { id: string; name: string; avatarUrl?: string; rating?: number } | null;
};

export type RentalStatus = (typeof RENTAL_STATUSES)[number];

// Phone fields are only present when the API reveals them (accepted/completed, caller is a party).
export type Rental = {
  id: string;
  gearId: string;
  gear: { title: string; coverImage?: string };
  ownerId: string;
  renterId: string;
  mode: (typeof RENTAL_MODES)[number];
  startAt: string;
  endAt: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  message?: string;
  status: RentalStatus;
  expiresAt: string;
  createdAt: string;
  role: 'owner' | 'renter';
  counterparty: {
    id: string;
    name?: string;
    avatarUrl?: string;
    ratingAvg: number;
    ratingCount: number;
    phone?: string;
    whatsappUrl?: string;
  };
};

export type RentalListResponse = { items: Rental[]; total: number; page: number; limit: number };
export type MyRentalsQuery = { role: 'owner' | 'renter'; status?: RentalStatus; page?: number; limit?: number };
export type Availability = { gearId: string; blocked: { startAt: string; endAt: string }[] };
export type CreateRentalBody = {
  gearId: string;
  mode: (typeof RENTAL_MODES)[number];
  startAt: string;
  endAt: string;
  message?: string;
};

// GET /gear/sitemap: public ids and slugs of active gear, nothing else.
export type SitemapGear = {
  id: string;
  slug: string;
  category: (typeof CATEGORIES)[number];
  city: string;
  images: string[];
  updatedAt: string;
};
export type SitemapGearResponse = { items: SitemapGear[]; total: number; page: number; limit: number };

export type GearListResponse = {
  items: PublicGear[];
  total: number;
  page: number;
  limit: number;
};

export type GearQuery = {
  q?: string;
  category?: (typeof CATEGORIES)[number];
  // Matched on the API against the normalized cityKey (case and diacritics insensitive).
  city?: string;
  condition?: (typeof CONDITIONS)[number];
  mode?: (typeof RENTAL_MODES)[number];
  minPriceCents?: number;
  maxPriceCents?: number;
  from?: string;
  to?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  // Visible map area as "west,south,east,north".
  bbox?: string;
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
  async listGear(query: GearQuery = {}, signal?: AbortSignal): Promise<GearListResponse> {
    const qs = toQueryString(query);
    try {
      return await request<GearListResponse>(`/gear${qs ? `?${qs}` : ''}`, { signal });
    } catch (err) {
      // Only an unreachable API (network failure) falls back to mock data; HTTP errors and
      // aborted (superseded) requests surface.
      if (err instanceof ApiError || signal?.aborted) throw err;
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
  // intent "signin" never creates an account (unknown Google users get NEW_USER); "signup" sends
  // the role/terms/phone/consent chosen before Google. Identity always comes from the ID token.
  googleAuth(idToken: string, intent: 'signin' | 'signup', signupData?: SignupData) {
    return request<AuthResult>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, intent, ...(signupData && { signupData }) }),
    });
  },
  // Name and avatar from the short-lived signup cookie, to prefill "Create your account".
  async getPendingSignup(): Promise<{ name: string; avatarUrl?: string } | null> {
    try {
      return await request<{ name: string; avatarUrl?: string }>('/auth/signup/pending');
    } catch {
      return null;
    }
  },
  completeSignup(data: SignupData) {
    return request<AuthResult>('/auth/signup/complete', { method: 'POST', body: JSON.stringify(data) });
  },
  upgradeRole(input: UpgradeRoleInput) {
    return request<Me>('/users/me/role', { method: 'PATCH', body: JSON.stringify(input) });
  },
  getOwnerDashboard() {
    return request<OwnerDashboard>('/dashboard/owner');
  },
  getRenterDashboard() {
    return request<RenterDashboard>('/dashboard/renter');
  },
  logout() {
    return request<void>('/auth/logout', { method: 'POST' });
  },
  getMyGear() {
    return request<{ items: OwnerGear[] }>('/gear/mine');
  },
  createGear(input: CreateGearInput) {
    return request<PublicGear>('/gear', { method: 'POST', body: JSON.stringify(input) });
  },
  updateGear(id: string, patch: UpdateGearInput) {
    return request<PublicGear>(`/gear/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },
  deleteGear(id: string) {
    return request<void>(`/gear/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  signUpload() {
    return request<UploadSignature>('/uploads/sign', { method: 'POST' });
  },
  // Direct browser-to-Cloudinary upload. XHR (not fetch) because only XHR reports upload progress.
  uploadImage(file: Blob, sig: UploadSignature, onProgress: (fraction: number) => void) {
    return new Promise<string>((resolve, reject) => {
      const form = new FormData();
      form.set('file', file);
      form.set('api_key', sig.apiKey);
      form.set('timestamp', String(sig.timestamp));
      form.set('signature', sig.signature);
      form.set('folder', sig.folder);
      form.set('allowed_formats', sig.allowedFormats);
      if (sig.uploadPreset) form.set('upload_preset', sig.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onerror = () => reject(new Error('upload.network'));
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText) as { secure_url?: string };
          if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body.secure_url);
          else reject(new Error('upload.rejected'));
        } catch {
          reject(new Error('upload.rejected'));
        }
      };
      xhr.send(form);
    });
  },
  // No mock fallback: an unreachable API must fail the sitemap, never publish fake URLs.
  getSitemapGear(page: number) {
    return request<SitemapGearResponse>(`/gear/sitemap?page=${page}`);
  },
  getGear(id: string) {
    return request<GearDetail>(`/gear/${encodeURIComponent(id)}`);
  },
  getAvailability(gearId: string, from: string, to: string) {
    const qs = new URLSearchParams({ from, to }).toString();
    return request<Availability>(`/gear/${encodeURIComponent(gearId)}/availability?${qs}`);
  },
  createRental(body: CreateRentalBody) {
    return request<Rental>('/rentals', { method: 'POST', body: JSON.stringify(body) });
  },
  listMyRentals(query: MyRentalsQuery) {
    const params = new URLSearchParams({ role: query.role });
    if (query.status) params.set('status', query.status);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    return request<RentalListResponse>(`/rentals/mine?${params.toString()}`);
  },
  // Incoming requests still waiting for the signed-in owner. Failures count as none.
  async countPendingRequests(): Promise<number> {
    try {
      return (await this.listMyRentals({ role: 'owner', status: 'requested', limit: 1 })).total;
    } catch {
      return 0;
    }
  },
  getRental(id: string) {
    return request<Rental>(`/rentals/${encodeURIComponent(id)}`);
  },
  rentalAction(id: string, action: 'accept' | 'decline' | 'cancel' | 'complete') {
    return request<Rental>(`/rentals/${encodeURIComponent(id)}/${action}`, { method: 'PATCH' });
  },
  getUser(id: string) {
    return request<ProfileWithGear>(`/users/${encodeURIComponent(id)}`);
  },
  updateMe(patch: UpdateProfileInput) {
    return request<Me>('/users/me', { method: 'PATCH', body: JSON.stringify(patch) });
  },
};
