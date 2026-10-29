import { buildLlmsFullTxt } from '@/lib/seo/llms';
import { fetchAllSitemapRows } from '@/lib/seo/sitemapData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows, total } = await fetchAllSitemapRows();
  return new Response(buildLlmsFullTxt({ rows, total }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
