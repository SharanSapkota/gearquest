import { slugify } from '@gearquest/shared';
import { absoluteUrl } from '../siteUrl';
import { LOCALE_LIST, PUBLIC_PATHS, type PageKey, type SeoLocale } from './routes';

export const DEFAULT_SEO_LOCALE: SeoLocale = 'fi';

const OBJECT_ID = /^[0-9a-f]{24}/i;

export { slugify };

export const idSlug = (id: string, title: string) => {
  const slug = slugify(title);
  return slug ? `${id}-${slug}` : id;
};

// "<24-hex id>-<slug>" -> parts. Anything else (e.g. mock ids) is treated as a bare id.
export function parseIdSlug(param: string): { id: string; hasSlugForm: boolean } {
  let decoded = param;
  try {
    decoded = decodeURIComponent(param);
  } catch {
    // Malformed escape: use the raw segment; it will not match an id and 404s.
  }
  if (!OBJECT_ID.test(decoded)) return { id: decoded, hasSlugForm: false };
  return { id: decoded.slice(0, 24), hasSlugForm: true };
}

// Locale-prefixed path of a page, e.g. publicPath('gear', 'fi', { id: '…-pulkka' }) -> /fi/varuste/…-pulkka.
export function publicPath(page: PageKey, locale: SeoLocale, params: Record<string, string> = {}): string {
  const path = PUBLIC_PATHS[page][locale].replace(/:(\w+)/g, (_, name: string) => params[name] ?? '');
  return `/${locale}${path}`;
}

// Same as publicPath without the locale prefix, for next-intl's <Link>, which adds it.
export const localPath = (page: PageKey, locale: SeoLocale, params: Record<string, string> = {}) =>
  publicPath(page, locale, params).slice(locale.length + 1);

// canonical + hreflang (fi, en, x-default) for the same page in every locale.
// `query` (e.g. "?page=2") is appended to every URL: a paginated page is its own canonical.
// `params` may be a function when a slug differs per locale (category and guide slugs).
export type PathParams = Record<string, string> | ((locale: SeoLocale) => Record<string, string>);
const paramsFor = (params: PathParams, locale: SeoLocale) => (typeof params === 'function' ? params(locale) : params);

export function pageAlternates(
  page: PageKey,
  locale: SeoLocale,
  params: PathParams = {},
  query = '',
) {
  const languages: Record<string, string> = {};
  for (const l of LOCALE_LIST) languages[l] = absoluteUrl(publicPath(page, l, paramsFor(params, l)) + query);
  languages['x-default'] = absoluteUrl(publicPath(page, DEFAULT_SEO_LOCALE, paramsFor(params, DEFAULT_SEO_LOCALE)) + query);
  return { canonical: absoluteUrl(publicPath(page, locale, paramsFor(params, locale)) + query), languages };
}
