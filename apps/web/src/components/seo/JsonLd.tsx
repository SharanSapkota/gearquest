import { serializeJsonLd, type JsonLdNode } from '@/lib/seo/jsonLd';

// Server-rendered structured data; the markup is in the initial HTML.
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
