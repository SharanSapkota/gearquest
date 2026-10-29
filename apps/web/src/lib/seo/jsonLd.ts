import { absoluteUrl } from '../siteUrl';
import { SITE_NAME } from './metadata';
import { publicPath } from './paths';
import type { SeoLocale } from './routes';

// Builders for schema.org JSON-LD. Each takes an explicit, already-public input shape and copies
// named fields only, so contact details, ids of other people and exact coordinates cannot leak
// through by accident (never spread a gear or user object in here).
export type JsonLdNode = Record<string, unknown>;

const CONTEXT = 'https://schema.org';
const LANG: Record<SeoLocale, string> = { fi: 'fi-FI', en: 'en' };

// Integer cents -> "12.50" (EUR, dot decimal, as schema.org expects).
export const centsToPrice = (cents: number) => (cents / 100).toFixed(2);

export const organizationJsonLd = (): JsonLdNode => ({
  '@context': CONTEXT,
  '@type': 'Organization',
  '@id': absoluteUrl('/#organization'),
  name: SITE_NAME,
  url: absoluteUrl('/'),
  logo: absoluteUrl('/logo.svg'),
});

// SearchAction: the search box on the home page reads the free-text `q` param.
export const websiteJsonLd = (locale: SeoLocale): JsonLdNode => ({
  '@context': CONTEXT,
  '@type': 'WebSite',
  '@id': absoluteUrl('/#website'),
  name: SITE_NAME,
  url: absoluteUrl(publicPath('home', locale)),
  inLanguage: LANG[locale],
  publisher: { '@id': absoluteUrl('/#organization') },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl(publicPath('home', locale))}?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export type Crumb = { name: string; path: string };

export const breadcrumbJsonLd = (crumbs: Crumb[]): JsonLdNode => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path),
  })),
});

export type ProductInput = {
  name: string;
  description: string;
  images: string[];
  category: string; // localized label
  path: string; // locale-prefixed canonical path
  pricing: { hourlyCents?: number; dailyCents?: number };
  sellerName?: string; // owner's display name only
  // Only pass when real reviews exist; builder also ignores count 0.
  rating?: { average: number; count: number };
};

export function productJsonLd(p: ProductInput): JsonLdNode {
  const url = absoluteUrl(p.path);
  const { hourlyCents, dailyCents } = p.pricing;
  const spec = (cents: number, unitCode: 'HUR' | 'DAY') => ({
    '@type': 'UnitPriceSpecification',
    price: centsToPrice(cents),
    priceCurrency: 'EUR',
    unitCode,
  });
  const specs = [
    ...(hourlyCents !== undefined ? [spec(hourlyCents, 'HUR')] : []),
    ...(dailyCents !== undefined ? [spec(dailyCents, 'DAY')] : []),
  ];
  const headline = dailyCents ?? hourlyCents;
  const rating = p.rating && p.rating.count > 0 ? p.rating : undefined;
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    name: p.name,
    ...(p.description && { description: p.description }),
    ...(p.images.length > 0 && { image: p.images }),
    category: p.category,
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      ...(headline !== undefined && { price: centsToPrice(headline) }),
      ...(specs.length > 0 && { priceSpecification: specs }),
      availability: `${CONTEXT}/InStock`,
      ...(p.sellerName && { seller: { '@type': 'Person', name: p.sellerName } }),
    },
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(rating.average.toFixed(1)),
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

export type ListItem = { name: string; path: string; image?: string };

// Category / city landing pages: a CollectionPage whose mainEntity is the list of gear shown.
export const collectionPageJsonLd = (input: {
  name: string;
  description: string;
  path: string;
  locale: SeoLocale;
  items: ListItem[];
}): JsonLdNode => ({
  '@context': CONTEXT,
  '@type': 'CollectionPage',
  name: input.name,
  description: input.description,
  url: absoluteUrl(input.path),
  inLanguage: LANG[input.locale],
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: input.items.length,
    itemListElement: input.items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(it.path),
      name: it.name,
      ...(it.image && { image: it.image }),
    })),
  },
});

export const faqPageJsonLd = (faqs: { question: string; answer: string }[]): JsonLdNode => ({
  '@context': CONTEXT,
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

export const articleJsonLd = (input: {
  headline: string;
  description: string;
  path: string;
  locale: SeoLocale;
  author: string;
  datePublished: string; // ISO 8601
  dateModified: string;
  image?: string;
}): JsonLdNode => ({
  '@context': CONTEXT,
  '@type': 'Article',
  headline: input.headline,
  description: input.description,
  inLanguage: LANG[input.locale],
  mainEntityOfPage: absoluteUrl(input.path),
  author: { '@type': 'Person', name: input.author },
  publisher: { '@id': absoluteUrl('/#organization') },
  datePublished: input.datePublished,
  dateModified: input.dateModified,
  ...(input.image && { image: input.image }),
});

// JSON for a <script type="application/ld+json"> body. "<" is escaped so user-written text
// (gear titles, bios) can never close the tag or start HTML.
export const serializeJsonLd = (data: JsonLdNode | JsonLdNode[]) =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
