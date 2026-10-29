import type { MetadataRoute } from 'next';
import { cityKey } from '@gearquest/shared';
import { SITEMAP_GEAR_PER_FILE } from '@gearquest/shared';
import { absoluteUrl } from '../siteUrl';
import { publicPath } from './paths';
import { CATEGORY_CONTENT, CITIES, LANDING_CATEGORIES } from '../../content/landing';
import { CONTENT_UPDATED, GUIDES } from '../../content/pages';
import { LOCALE_LIST, type PageKey, type SeoLocale } from './routes';

type Entry = MetadataRoute.Sitemap[number];
type GearRow = { id: string; slug: string; images: string[]; updatedAt: string };

// Pages without params that are always indexable. Landing pages and guides are added with their
// own steps; thin or empty ones are deliberately not listed.
export const STATIC_SITEMAP_PAGES: PageKey[] = [
  'home',
  'map',
  'terms',
  'privacy',
  'howItWorks',
  'forOwners',
  'forRenters',
  'safety',
  'faq',
  'about',
  'guides',
];

// One entry per locale, each pointing at its equivalent in the others (+ x-default).
type Params = Record<string, string> | ((locale: SeoLocale) => Record<string, string>);

export function localizedEntries(
  page: PageKey,
  params: Params = {},
  extra: Partial<Pick<Entry, 'lastModified' | 'images'>> = {},
): Entry[] {
  const languages: Record<string, string> = {};
  for (const l of LOCALE_LIST) languages[l] = absoluteUrl(publicPath(page, l, typeof params === 'function' ? params(l) : params));
  languages['x-default'] = languages.fi as string;
  return LOCALE_LIST.map((l) => ({
    url: languages[l] as string,
    alternates: { languages },
    ...extra,
  }));
}

// The API already returns the slug, so build "<id>-<slug>" directly.
const gearPathParam = (id: string, slug: string) => (slug ? `${id}-${slug}` : id);

export const gearEntries = (rows: GearRow[]): Entry[] =>
  rows.flatMap((g) =>
    localizedEntries(
      'gear',
      { id: gearPathParam(g.id, g.slug) },
      { lastModified: new Date(g.updatedAt), ...(g.images.length > 0 && { images: g.images }) },
    ),
  );

export const staticEntries = (): Entry[] => [
  ...STATIC_SITEMAP_PAGES.flatMap((p) => localizedEntries(p)),
  ...guideEntries(),
];

// Sitemap 0 = static pages, 1..N = gear pages of SITEMAP_GEAR_PER_FILE gear (x2 locales each).
export const gearFileCount = (total: number) => Math.ceil(total / SITEMAP_GEAR_PER_FILE);

export const guideEntries = (): Entry[] =>
  GUIDES.flatMap((g) =>
    localizedEntries('guide', (l) => ({ slug: g.slug[l] }), { lastModified: new Date(CONTENT_UPDATED) }),
  );

type LandingRow = { category: string; city: string };

// Landing pages enter the sitemap only when they have at least one active listing (empty ones
// are noindex). Cities outside the curated list have no landing page.
export function landingEntries(rows: LandingRow[]): Entry[] {
  const cityKeyOf = (name: string) => CITIES.find((c) => c.key === cityKey(name))?.key;
  const categories = new Set<string>();
  const cities = new Set<string>();
  const pairs = new Set<string>();
  for (const r of rows) {
    const city = cityKeyOf(r.city);
    if (LANDING_CATEGORIES.includes(r.category as (typeof LANDING_CATEGORIES)[number])) categories.add(r.category);
    if (city) cities.add(city);
    if (city && LANDING_CATEGORIES.includes(r.category as (typeof LANDING_CATEGORIES)[number])) pairs.add(`${r.category}|${city}`);
  }
  const slug = (c: string, l: SeoLocale) => CATEGORY_CONTENT[c as (typeof LANDING_CATEGORIES)[number]].slug[l];
  return [
    ...[...categories].flatMap((c) => localizedEntries('category', (l) => ({ category: slug(c, l) }))),
    ...[...cities].flatMap((city) => localizedEntries('city', { city })),
    ...[...pairs].flatMap((p) => {
      const [c, city] = p.split('|') as [string, string];
      return localizedEntries('categoryCity', (l) => ({ category: slug(c, l), city }));
    }),
  ];
}
