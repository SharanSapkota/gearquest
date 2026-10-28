import { api } from '@/lib/api';
import { gearFileCount } from '@/lib/seo/sitemapEntries';
import { absoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

// Sitemap index: generateSitemaps() only serves /sitemap/<id>.xml, so this lists them.
export async function GET() {
  const { total } = await api.getSitemapGear(1);
  const ids = [0, ...Array.from({ length: gearFileCount(total) }, (_, i) => i + 1)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ids.map((id) => `  <sitemap><loc>${absoluteUrl(`/sitemap/${id}.xml`)}</loc></sitemap>`).join('\n')}
</sitemapindex>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=300' },
  });
}
