import type { MetadataRoute } from 'next';
import { SITEMAP_GEAR_PER_FILE } from '@gearquest/shared';
import { absoluteUrl } from '../siteUrl';
import { publicPath } from './paths';
import { LOCALE_LIST, type PageKey } from './routes';

type Entry = MetadataRoute.Sitemap[number];
type GearRow = { id: string; slug: string; images: string[]; updatedAt: string };

// Pages without params that are always indexable. Landing pages and guides are added with their
// own steps; thin or empty ones are deliberately not listed.
export const STATIC_SITEMAP_PAGES: PageKey[] = ['home', 'map', 'terms', 'privacy'];

// One entry per locale, each pointing at its equivalent in the others (+ x-default).
export function localizedEntries(
  page: PageKey,
  params: Record<string, string> = {},
  extra: Partial<Pick<Entry, 'lastModified' | 'images'>> = {},
): Entry[] {
  const languages: Record<string, string> = {};
  for (const l of LOCALE_LIST) languages[l] = absoluteUrl(publicPath(page, l, params));
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

export const staticEntries = (): Entry[] => STATIC_SITEMAP_PAGES.flatMap((p) => localizedEntries(p));

// Sitemap 0 = static pages, 1..N = gear pages of SITEMAP_GEAR_PER_FILE gear (x2 locales each).
export const gearFileCount = (total: number) => Math.ceil(total / SITEMAP_GEAR_PER_FILE);
