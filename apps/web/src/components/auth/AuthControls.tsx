'use client';

import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { PlusIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { isOwnerRole } from '@/lib/onboarding';
import { SignInButton } from './SignInButton';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';

// Guests sign in from the bottom tab bar on phones, so the header button is desktop-only.
// So is "Add gear" for owners: phones have it in the tab bar.
export function AuthControls({ pendingCount }: { pendingCount: number }) {
  const t = useTranslations('nav');
  const user = useAuth();
  if (user) {
    return (
      <>
        {isOwnerRole(user.role) && (
          <Link href="/gear/new" className={`${buttonClass({ size: 'sm' })} header__add`}>
            <PlusIcon size={18} />
            {t('addGear')}
          </Link>
        )}
        <UserMenu user={user} pendingCount={pendingCount} />
      </>
    );
  }
  return (
    <div className="header__signin">
      <SignInButton />
    </div>
  );
}
