import { z } from 'zod';

const FALLBACK = 'http://localhost:3000';

const siteUrlSchema = z
  .url()
  .refine((u) => /^https?:\/\//.test(u), 'must start with http:// or https://')
  .transform((u) => u.replace(/\/+$/, ''));

// NEXT_PUBLIC_SITE_URL, validated. undefined when unset; throws when set but invalid.
export function getSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  const parsed = siteUrlSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`NEXT_PUBLIC_SITE_URL is invalid: ${raw}`);
  return parsed.data;
}

// Search engines may only index a production build that knows its public URL.
// Everything else (dev, preview, a production build without NEXT_PUBLIC_SITE_URL) is noindex.
export const isIndexable = () => process.env.NODE_ENV === 'production' && getSiteUrl() !== undefined;

// Absolute URL for a locale-prefixed path such as "/fi/ehdot". Never hardcode a domain.
export const absoluteUrl = (path: string) => `${getSiteUrl() ?? FALLBACK}${path}`;
