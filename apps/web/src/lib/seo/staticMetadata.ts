import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { listingState } from './listing';
import { buildMetadata } from './metadata';
import { isSeoLocale, type PageKey } from './routes';

// generateMetadata for pages whose title and description are plain message keys
// (titleKey as "namespace.key", descriptionKey inside the "seo" namespace).
// listing: the page takes filter/sort/page params. Filtered URLs canonicalize to the clean URL
// and are noindex,follow; ?page=N is its own canonical with a distinct title.
export const staticPageMetadata =
  (page: PageKey, titleKey: string, descriptionKey: string, listing = false) =>
  async ({
    params,
    searchParams,
  }: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }): Promise<Metadata> => {
    const { locale } = await params;
    if (!isSeoLocale(locale)) return {};
    const [namespace, ...rest] = titleKey.split('.');
    const [t, seo] = await Promise.all([
      getTranslations({ locale, namespace }),
      getTranslations({ locale, namespace: 'seo' }),
    ]);
    const { page: pageNo, filtered } = listing ? listingState((await searchParams) ?? {}) : { page: 1, filtered: false };
    const paged = !filtered && pageNo > 1;
    return buildMetadata({
      locale,
      page,
      title: paged ? `${t(rest.join('.'))} (${seo('pageN', { page: pageNo })})` : t(rest.join('.')),
      description: seo(descriptionKey),
      ...(paged && { query: `?page=${pageNo}` }),
      noindex: filtered,
    });
  };
