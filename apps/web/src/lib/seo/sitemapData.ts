import { api } from '../api';
import { gearFileCount } from './sitemapEntries';

// Every active listing's public sitemap row (category, city, ...), across all pages of
// GET /gear/sitemap. Cheap fields only; used by the sitemap and llms.txt.
export async function fetchAllSitemapRows() {
  const first = await api.getSitemapGear(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, gearFileCount(first.total) - 1) }, (_, i) => api.getSitemapGear(i + 2)),
  );
  return { total: first.total, rows: [first, ...rest].flatMap((r) => r.items) };
}
