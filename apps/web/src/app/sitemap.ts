import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { fetchAllSitemapRows } from '@/lib/seo/sitemapData';
import { gearEntries, gearFileCount, landingEntries, staticEntries } from '@/lib/seo/sitemapEntries';

// Built per request from live data; never prerendered at build time (the API may be down).
export const dynamic = 'force-dynamic';

// 0 = static pages, 1..N = active gear, 2,500 per file (2 locales each = 5,000 URLs).
export async function generateSitemaps() {
  const { total } = await api.getSitemapGear(1);
  return [{ id: 0 }, ...Array.from({ length: gearFileCount(total) }, (_, i) => ({ id: i + 1 }))];
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  if (id === 0) {
    // Landing pages are listed only for categories and cities that have active gear.
    const { rows } = await fetchAllSitemapRows();
    return [...staticEntries(), ...landingEntries(rows)];
  }
  const { items } = await api.getSitemapGear(id);
  return gearEntries(items);
}
