import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  categoryFromSlug,
  CATEGORY_CONTENT,
  cityByKey,
  type City,
  type LandingCategory,
} from '../../content/landing';
import { getLandingGear } from '../landingData';
import { listingState } from './listing';
import { landingCopy, landingDescription } from './landing';
import { buildMetadata } from './metadata';
import { publicPath } from './paths';
import { isSeoLocale, type PageKey, type SeoLocale } from './routes';

export type LandingParams = { locale: string; category?: string; city?: string };
export type LandingSearch = Record<string, string | string[] | undefined>;

// Path params for a given locale (category slugs are language-specific, city keys are not).
export const landingPathParams = (r: Pick<ResolvedLanding, 'category' | 'city'>, locale: SeoLocale): Record<string, string> => ({
  ...(r.category && { category: CATEGORY_CONTENT[r.category].slug[locale] }),
  ...(r.city && { city: r.city.key }),
});

export type ResolvedLanding = {
  locale: SeoLocale;
  category?: LandingCategory;
  city?: City;
  page: PageKey;
  pathParams: Record<string, string>;
};

// Slug -> content. Unknown slugs 404; a slug from the other language (/en/.../sukset) redirects
// to the canonical URL for this locale.
export function resolveLanding(params: LandingParams): ResolvedLanding {
  const { locale, category: categorySlug, city: citySlug } = params;
  if (!isSeoLocale(locale)) notFound();
  const category = categorySlug ? categoryFromSlug(categorySlug) : undefined;
  const city = citySlug ? cityByKey(citySlug) : undefined;
  if ((categorySlug && !category) || (citySlug && !city)) notFound();
  const page: PageKey = category && city ? 'categoryCity' : category ? 'category' : 'city';
  const pathParams: Record<string, string> = {
    ...(category && { category: CATEGORY_CONTENT[category].slug[locale] }),
    ...(city && { city: city.key }),
  };
  const canonical = publicPath(page, locale, pathParams);
  const requested = publicPath(page, locale, { ...(categorySlug && { category: categorySlug }), ...(citySlug && { city: citySlug }) });
  if (canonical !== requested) permanentRedirect(canonical);
  return { locale, category, city, page, pathParams };
}

// Empty or out-of-range pages are noindex (thin content); filtered params never apply here.
export async function landingMetadata(params: LandingParams, search: LandingSearch): Promise<Metadata> {
  if (!isSeoLocale(params.locale)) return {};
  const r = resolveLanding(params);
  const { page: pageNo } = listingState(search);
  const res = await getLandingGear(r.category, r.city?.key, pageNo);
  const copy = landingCopy({ category: r.category, city: r.city }, r.locale);
  const t = await getTranslations({ locale: r.locale, namespace: 'landing' });
  const paged = pageNo > 1 && res.items.length > 0;
  return buildMetadata({
    locale: r.locale,
    page: r.page,
    params: (l) => landingPathParams(r, l),
    title: paged ? `${copy.h1} (${t('pageN', { page: pageNo })})` : copy.h1,
    description: landingDescription(copy),
    ...(paged && { query: `?page=${pageNo}` }),
    noindex: res.total === 0 || res.items.length === 0,
  });
}
