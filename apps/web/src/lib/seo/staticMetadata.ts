import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from './metadata';
import { isSeoLocale, type PageKey } from './routes';

// generateMetadata for pages whose title and description are plain message keys
// (titleKey as "namespace.key", descriptionKey inside the "seo" namespace).
export const staticPageMetadata =
  (page: PageKey, titleKey: string, descriptionKey: string) =>
  async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    if (!isSeoLocale(locale)) return {};
    const [namespace, ...rest] = titleKey.split('.');
    const [t, seo] = await Promise.all([
      getTranslations({ locale, namespace }),
      getTranslations({ locale, namespace: 'seo' }),
    ]);
    return buildMetadata({
      locale,
      page,
      title: t(rest.join('.')),
      description: seo(descriptionKey),
    });
  };
