import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { CATEGORY_CONTENT, CITIES, LANDING_CATEGORIES } from '@/content/landing';
import { publicPath } from '@/lib/seo/paths';
import type { SeoLocale } from '@/lib/seo/routes';

const TOP_CITIES = CITIES.slice(0, 8);

// Header "Browse" disclosure: plain links to every category and the top cities (crawlable,
// works without JS). Desktop only; phones get the same links in the footer.
export function BrowseMenu() {
  const t = useTranslations();
  const locale = useLocale() as SeoLocale;
  return (
    <details className="navmenu">
      <summary>{t('nav.browse')}</summary>
      <div className="navmenu__panel">
        <nav aria-label={t('footer.categories')}>
          <p className="navmenu__title">{t('footer.categories')}</p>
          {LANDING_CATEGORIES.map((c) => (
            <NextLink key={c} href={publicPath('category', locale, { category: CATEGORY_CONTENT[c].slug[locale] })}>
              {t(`categories.${c}`)}
            </NextLink>
          ))}
        </nav>
        <nav aria-label={t('footer.cities')}>
          <p className="navmenu__title">{t('footer.cities')}</p>
          {TOP_CITIES.map((c) => (
            <NextLink key={c.key} href={publicPath('city', locale, { city: c.key })}>
              {c.name}
            </NextLink>
          ))}
        </nav>
      </div>
    </details>
  );
}
