import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AuthControls } from '@/components/auth/AuthControls';
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
        <AuthControls />
      </div>
    </header>
  );
}
