import { Suspense } from 'react';
import { AuthControls } from '@/components/auth/AuthControls';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { NavTabs } from './NavTabs';

export function Header({ pendingCount }: { pendingCount: number }) {
  return (
    <header className="header">
      <Logo />
      <Suspense fallback={null}>
        <NavTabs />
      </Suspense>
      <div className="header__actions">
        <div className="header__lang">
          <LanguageSwitcher />
        </div>
        <AuthControls pendingCount={pendingCount} />
      </div>
    </header>
  );
}
