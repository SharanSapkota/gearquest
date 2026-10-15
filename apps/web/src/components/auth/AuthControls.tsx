'use client';

import { SignInButton } from './SignInButton';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';

// Guests sign in from the bottom tab bar on phones, so the header button is desktop-only.
export function AuthControls({ pendingCount }: { pendingCount: number }) {
  const user = useAuth();
  if (user) return <UserMenu user={user} pendingCount={pendingCount} />;
  return (
    <div className="header__signin">
      <SignInButton />
    </div>
  );
}
