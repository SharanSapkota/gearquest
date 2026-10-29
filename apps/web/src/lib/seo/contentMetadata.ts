import type { Metadata } from 'next';
import { CONTENT_PAGES, type ContentPageKey } from '../../content/pages';
import { buildMetadata } from './metadata';
import { isSeoLocale } from './routes';

export const contentMetadata =
  (key: ContentPageKey) =>
  async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    if (!isSeoLocale(locale)) return {};
    const c = CONTENT_PAGES[key];
    return buildMetadata({ locale, page: key, title: c.title[locale], description: c.description[locale] });
  };
