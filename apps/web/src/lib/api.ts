const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// The only place in the web app that calls fetch.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) throw new Error(`api.${res.status}`);
  return res.json() as Promise<T>;
}

export type PublicGear = {
  id: string;
  title: string;
  category: string;
  city: string;
  pricing: { hourlyCents?: number; dailyCents?: number; minHours?: number };
};

export const api = {
  listGear: (query = '') => request<PublicGear[]>(`/gear${query ? `?${query}` : ''}`),
};
