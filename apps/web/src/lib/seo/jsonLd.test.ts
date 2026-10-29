import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  centsToPrice,
  collectionPageJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  productJsonLd,
  serializeJsonLd,
  websiteJsonLd,
  type JsonLdNode,
} from './jsonLd';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test'));
afterEach(() => vi.unstubAllEnvs());

const parse = (n: JsonLdNode | JsonLdNode[]) => JSON.parse(serializeJsonLd(n)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const product = {
  name: 'Atomic Redster 190 cm',
  description: 'Hyvät sukset.',
  images: ['https://img.test/a.jpg'],
  category: 'Sukset',
  path: '/fi/varuste/66f1a2b3c4d5e6f708192a3b-atomic',
  pricing: { hourlyCents: 800, dailyCents: 1800 },
  sellerName: 'Aino K.',
};

describe('site-wide', () => {
  it('Organization has name, url and logo; no contact points', () => {
    const o = parse(organizationJsonLd());
    expect(o).toMatchObject({ '@type': 'Organization', name: 'GearQuest', url: 'https://example.test/', logo: 'https://example.test/logo.svg' });
    expect(o).not.toHaveProperty('contactPoint');
  });
  it('WebSite has a SearchAction pointing at the localized gear search', () => {
    const w = parse(websiteJsonLd('en'));
    expect(w['@type']).toBe('WebSite');
    expect(w.potentialAction).toMatchObject({
      '@type': 'SearchAction',
      target: { urlTemplate: 'https://example.test/en?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    });
    expect(parse(websiteJsonLd('fi')).potentialAction.target.urlTemplate).toBe('https://example.test/fi?q={search_term_string}');
  });
});

describe('Product', () => {
  const build = () => parse(productJsonLd(product));
  it('has the required fields and an EUR offer with per-hour and per-day specs', () => {
    const p = build();
    expect(p).toMatchObject({ '@type': 'Product', name: product.name, category: 'Sukset', image: product.images, url: 'https://example.test' + product.path });
    expect(p.offers).toMatchObject({
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: '18.00',
      availability: 'https://schema.org/InStock',
      url: 'https://example.test' + product.path,
      seller: { '@type': 'Person', name: 'Aino K.' },
    });
    expect(p.offers.priceSpecification).toEqual([
      { '@type': 'UnitPriceSpecification', price: '8.00', priceCurrency: 'EUR', unitCode: 'HUR' },
      { '@type': 'UnitPriceSpecification', price: '18.00', priceCurrency: 'EUR', unitCode: 'DAY' },
    ]);
  });
  it('never fabricates ratings: none without reviews, none for count 0', () => {
    const p = build();
    expect(p).not.toHaveProperty('aggregateRating');
    expect(p).not.toHaveProperty('review');
    expect(parse(productJsonLd({ ...product, rating: { average: 0, count: 0 } }))).not.toHaveProperty('aggregateRating');
  });
  it('adds AggregateRating only with real reviews', () => {
    const r = parse(productJsonLd({ ...product, rating: { average: 4.666, count: 3 } }));
    expect(r.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.7, reviewCount: 3, bestRating: 5, worstRating: 1 });
  });
  it('uses hourly as the headline price when there is no daily price', () => {
    expect(parse(productJsonLd({ ...product, pricing: { hourlyCents: 950 } })).offers.price).toBe('9.50');
  });
  it('formats cents without float noise', () => {
    expect(centsToPrice(1999)).toBe('19.99');
    expect(centsToPrice(5)).toBe('0.05');
  });
});

describe('other types', () => {
  it('BreadcrumbList positions start at 1 with absolute URLs', () => {
    const b = parse(breadcrumbJsonLd([{ name: 'Home', path: '/fi' }, { name: 'X', path: '/fi/varuste/1' }]));
    expect(b.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.test/fi' },
      { '@type': 'ListItem', position: 2, name: 'X', item: 'https://example.test/fi/varuste/1' },
    ]);
  });
  it('CollectionPage wraps an ItemList', () => {
    const c = parse(collectionPageJsonLd({ name: 'Sukset', description: 'd', path: '/fi/varusteet/sukset', locale: 'fi', items: [{ name: 'A', path: '/fi/varuste/1', image: 'https://i/x.jpg' }] }));
    expect(c).toMatchObject({ '@type': 'CollectionPage', inLanguage: 'fi-FI', mainEntity: { '@type': 'ItemList', numberOfItems: 1 } });
    expect(c.mainEntity.itemListElement[0]).toMatchObject({ position: 1, url: 'https://example.test/fi/varuste/1' });
  });
  it('FAQPage has Question/Answer pairs', () => {
    const f = parse(faqPageJsonLd([{ question: 'Q?', answer: 'A.' }]));
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } });
  });
  it('Article has author and both dates', () => {
    const a = parse(articleJsonLd({ headline: 'H', description: 'd', path: '/en/guides/x', locale: 'en', author: 'GearQuest', datePublished: '2026-10-01', dateModified: '2026-10-20' }));
    expect(a).toMatchObject({ '@type': 'Article', author: { name: 'GearQuest' }, datePublished: '2026-10-01', dateModified: '2026-10-20' });
  });
});

describe('serialization', () => {
  it('escapes "<" so user text cannot close the script tag', () => {
    const out = serializeJsonLd(productJsonLd({ ...product, name: '</script><img src=x onerror=alert(1)>' }));
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('</script><img src=x onerror=alert(1)>');
  });
});

describe('privacy', () => {
  // Builders take explicit inputs, but a caller could still hand over a whole API object.
  const leaky = {
    ...product,
    phone: '+358401234567',
    email: 'owner@example.com',
    googleId: 'g-123456789',
    location: [24.9384, 60.1699],
    exactLocation: { lng: 24.9384, lat: 60.1699 },
    address: 'Secret street 1',
    owner: { phone: '+358401234567', email: 'owner@example.com' },
  };
  const everything = () => JSON.stringify([
    organizationJsonLd(),
    websiteJsonLd('fi'),
    productJsonLd(leaky as unknown as Parameters<typeof productJsonLd>[0]),
    breadcrumbJsonLd([{ name: 'Home', path: '/fi' }]),
    collectionPageJsonLd({ name: 'n', description: 'd', path: '/fi', locale: 'fi', items: [{ name: 'A', path: '/fi/x' }] }),
    faqPageJsonLd([{ question: 'q', answer: 'a' }]),
  ]);
  it('contains no phone, email, googleId, address or coordinates', () => {
    expect(everything()).not.toMatch(/\+358|40123|owner@example|g-1234|Secret street|24\.9384|60\.1699|googleId|exactLocation|coordinates|"phone"|"email"|telephone/i);
  });
});
