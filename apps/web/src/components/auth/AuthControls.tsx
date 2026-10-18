'use client';

import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { PlusIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { isOwnerRole } from '@/lib/roles';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';

// Guests get "Sign in" and "Sign up". Phones show only "Sign up" in the header (the bottom tab
// bar has "Sign in"); "Add gear" for owners is desktop-only for the same reason.
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
    <>
      <Link href="/login" className={`${buttonClass({ variant: 'outline', size: 'sm' })} header__signin`}>
        {t('signIn')}
      </Link>
      <Link href="/signup" className={buttonClass({ size: 'sm' })}>
        {t('signUp')}
      </Link>
    </>
  );
}
