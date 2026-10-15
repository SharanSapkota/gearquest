import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AuthControls } from '@/components/auth/AuthControls';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavTabs } from './NavTabs';

export function Header({ pendingCount }: { pendingCount: number }) {
  const t = useTranslations();
  return (
    <header className="header">
      <Link href="/" className="logo">
        {t('app.name')}
      </Link>
      <NavTabs />
      <div className="header__actions">
        <LanguageSwitcher />
        <AuthControls pendingCount={pendingCount} />
      </div>
    </header>
  );
}
