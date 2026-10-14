import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavTabs } from './NavTabs';

export function Header() {
  const t = useTranslations();
  return (
    <header className="header">
      <Link href="/" className="logo">
        {t('app.name')}
      </Link>
      <NavTabs />
      <div className="header__actions">
        <LanguageSwitcher />
        {/* TODO(auth): wire up Google sign-in. */}
        <button type="button" disabled>
          {t('nav.signIn')}
        </button>
      </div>
    </header>
  );
}
