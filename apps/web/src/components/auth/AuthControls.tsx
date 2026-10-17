'use client';

import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { PlusIcon } from '@/components/ui/icons';
import { Link, usePathname } from '@/i18n/navigation';
import { isOwner } from '@/lib/roles';
import { SignInButton } from './SignInButton';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';

// Guests sign in from the bottom tab bar on phones, so the header buttons are desktop-only.
export function AuthControls({ pendingCount }: { pendingCount: number }) {
  const t = useTranslations('nav');
  const user = useAuth();
  const pathname = usePathname();
  if (user) {
    return (
      <>
        {isOwner(user) && (
          <Link href="/gear/new" className={`${buttonClass({ variant: 'outline', size: 'sm' })} header__add`}>
            <PlusIcon size={16} />
            {t('addGear')}
          </Link>
        )}
        <UserMenu user={user} pendingCount={pendingCount} />
      </>
    );
  }
  // The login and signup pages have their own Google button (only one may exist per page).
  if (pathname === '/login' || pathname === '/signup') return null;
  return (
    <div className="header__signin">
      <SignInButton />
    </div>
  );
}
