import type { Metadata } from 'next';
import { absoluteUrl, isIndexable } from '../siteUrl';
import { pageAlternates } from './paths';
import type { PageKey, SeoLocale } from './routes';

export const SITE_NAME = 'GearQuest';
export const OG_LOCALE: Record<SeoLocale, string> = { fi: 'fi_FI', en: 'en_GB' };
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

const OG_SIZE = { width: 1200, height: 630 };

// Joins sentences in priority order into a meta description of 120-160 characters:
// stops adding once long enough and cuts at a word boundary rather than mid-word.
export function fitDescription(parts: (string | undefined)[]): string {
  let text = '';
  for (const raw of parts) {
    const part = raw?.replace(/\s+/g, ' ').trim();
    if (!part) continue;
    const next = text ? `${text} ${part}` : part;
    if (next.length <= DESCRIPTION_MAX) {
      text = next;
      if (text.length >= DESCRIPTION_MIN) break;
      continue;
    }
    const room = DESCRIPTION_MAX - 1;
    const cut = next.slice(0, room + 1).replace(/\s+\S*$/, '').replace(/[,;:.\s-]+$/, '');
    text = `${cut.slice(0, room)}…`;
    break;
  }
  return text;
}

export const ogImageUrl = (locale: SeoLocale, kind: 'default' | { gearId: string }) =>
  absoluteUrl(
    kind === 'default' ? `/og/default?locale=${locale}` : `/og/gear/${kind.gearId}?locale=${locale}`,
  );

type Input = {
  locale: SeoLocale;
  page: PageKey;
  params?: Record<string, string>;
  title: string;
  description: string;
  imageAlt?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  query?: string;
};

// Metadata every public page shares: canonical (always the clean locale URL, never query
// params), hreflang to the equivalent page, Open Graph with og:locale(:alternate), Twitter.
export function buildMetadata(input: Input): Metadata {
  const { locale, page, params, title, description, type = 'website' } = input;
  const other: SeoLocale = locale === 'fi' ? 'en' : 'fi';
  const alternates = pageAlternates(page, locale, params, input.query);
  const image = input.image ?? ogImageUrl(locale, 'default');
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates,
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: alternates.canonical,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[other]],
      images: [{ url: image, ...OG_SIZE, alt: input.imageAlt ?? title }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [image] },
    ...(input.noindex && { robots: { index: false, follow: true } }),
  };
}

// Root-level robots: anything that is not an indexable production deployment is noindex.
export const environmentRobots = (): Metadata['robots'] =>
  isIndexable() ? undefined : { index: false, follow: false };

// Search Console / Bing Webmaster verification tags, rendered only when configured.
export function verificationMetadata(): Metadata['verification'] {
  const google = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
  const bing = process.env.NEXT_PUBLIC_BING_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return { ...(google && { google }), ...(bing && { other: { 'msvalidate.01': bing } }) };
}
