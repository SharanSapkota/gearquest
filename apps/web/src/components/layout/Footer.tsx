import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Me } from '@/lib/api';
import { isOwnerRole } from '@/lib/roles';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

// Deep forest footer with the contour motif. Carries the intermediary disclaimer on every page.
export function Footer({ user }: { user: Me | null }) {
  const t = useTranslations();
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
