import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { CATEGORY_CONTENT, CITIES, LANDING_CATEGORIES } from '@/content/landing';
import { CONTENT_PAGES, type ContentPageKey } from '@/content/pages';
import { publicPath } from '@/lib/seo/paths';
import type { SeoLocale } from '@/lib/seo/routes';
import { Link } from '@/i18n/navigation';
import type { Me } from '@/lib/api';
import { isOwnerRole } from '@/lib/roles';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

// Deep forest footer with the contour motif. Carries the intermediary disclaimer on every page.
const INFO_PAGES: ContentPageKey[] = ['howItWorks', 'forOwners', 'forRenters', 'safety', 'faq', 'about'];

export function Footer({ user }: { user: Me | null }) {
  const t = useTranslations();
  const locale = useLocale() as SeoLocale;
  return (
    <footer className="footer contour">
      <div className="footer__inner">
        <div className="footer__brand">
          <Logo light />
          <p>{t('footer.tagline')}</p>
        </div>
        <nav className="footer__col" aria-label={t('footer.explore')}>
          <h2>{t('footer.explore')}</h2>
          <Link href="/">{t('nav.home')}</Link>
          <Link href="/map">{t('nav.map')}</Link>
        </nav>
        <nav className="footer__col" aria-label={t('footer.categories')}>
          <h2>{t('footer.categories')}</h2>
          {LANDING_CATEGORIES.map((c) => (
            <NextLink key={c} href={publicPath('category', locale, { category: CATEGORY_CONTENT[c].slug[locale] })}>
              {t(`categories.${c}`)}
            </NextLink>
          ))}
        </nav>
        <nav className="footer__col" aria-label={t('footer.cities')}>
          <h2>{t('footer.cities')}</h2>
          {CITIES.map((c) => (
            <NextLink key={c.key} href={publicPath('city', locale, { city: c.key })}>
              {c.name}
            </NextLink>
          ))}
        </nav>
        <nav className="footer__col" aria-label={t('footer.about')}>
          <h2>{t('footer.about')}</h2>
          {INFO_PAGES.map((k) => (
            <NextLink key={k} href={publicPath(k, locale)}>
              {CONTENT_PAGES[k].title[locale]}
            </NextLink>
          ))}
          <NextLink href={publicPath('guides', locale)}>{t('footer.guides')}</NextLink>
          <NextLink href={publicPath('terms', locale)}>{t('footer.terms')}</NextLink>
          <NextLink href={publicPath('privacy', locale)}>{t('footer.privacy')}</NextLink>
        </nav>
        {user && (
          <nav className="footer__col" aria-label={t('footer.account')}>
            <h2>{t('footer.account')}</h2>
            {isOwnerRole(user.role) && <Link href="/dashboard">{t('nav.dashboard')}</Link>}
            <Link href="/rentals">{t('nav.rentals')}</Link>
            {isOwnerRole(user.role) && <Link href="/gear/mine">{t('nav.myGear')}</Link>}
            {isOwnerRole(user.role) && <Link href="/gear/new">{t('nav.addGear')}</Link>}
            <Link href={`/users/${user.id}`}>{t('nav.myProfile')}</Link>
          </nav>
        )}
        <div className="footer__col">
          <h2>{t('language.label')}</h2>
          <LanguageSwitcher />
        </div>
      </div>
      <p className="footer__disclaimer">{t('legal.disclaimer')}</p>
    </footer>
  );
}
